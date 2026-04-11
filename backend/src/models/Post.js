const pool = require("../config/database");

class Post {
  // Create posts table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    `;

    await pool.query(query);
    console.log("✅ Posts table ready");
  }

  // Create a new post
  static async create(postData) {
    const { title, content, user_id } = postData;
    const query = `
      INSERT INTO posts (title, content, user_id)
      VALUES ($1, $2, $3)
      RETURNING id, title, content, user_id, created_at, updated_at
    `;
    const values = [title, content, user_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static generateExcerpt(content, maxLength = 200) {
    // Remove HTML tags if any
    const plainText = content.replace(/<[^>]*>/g, "");
    // Trim and add ellipsis
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + "...";
  }

  static async findAll(limit = 20, offset = 0, currentUserId = null) {
    if (!currentUserId) {
      const query = `
      SELECT 
        p.id,
        p.title,
        p.content,
        LEFT(p.content, 200) as excerpt,
        p.user_id,
        p.created_at,
        p.updated_at,
        u.username,
        u.full_name,
        u.avatar_url,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT c.id) as comment_count,
        false as user_has_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id, u.id, u.username, u.full_name, u.avatar_url
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;
      const values = [limit, offset];
      const result = await pool.query(query, values);
      return result.rows;
    }

    const query = `
    SELECT 
      p.id,
      p.title,
      p.content,
      LEFT(p.content, 200) as excerpt,
      p.user_id,
      p.created_at,
      p.updated_at,
      u.username,
      u.full_name,
      u.avatar_url,
      COUNT(DISTINCT l.id) as like_count,
      COUNT(DISTINCT c.id) as comment_count,
      EXISTS(
        SELECT 1 FROM likes l2 
        WHERE l2.post_id = p.id AND l2.user_id = $3
      ) as user_has_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    GROUP BY p.id, u.id, u.username, u.full_name, u.avatar_url
    ORDER BY p.created_at DESC
    LIMIT $1 OFFSET $2
  `;
    const values = [limit, offset, currentUserId];
    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get single post with details
  static async findById(id, currentUserId = null) {
    if (!currentUserId) {
      const query = `
      SELECT 
        p.id,
        p.title,
        p.content,
        p.user_id,
        p.created_at,
        p.updated_at,
        u.username,
        u.full_name,
        u.avatar_url,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT c.id) as comment_count,
        false as user_has_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.id = $1
      GROUP BY p.id, u.id, u.username, u.full_name, u.avatar_url
    `;
      const values = [id];
      const result = await pool.query(query, values);
      return result.rows[0];
    }

    const query = `
    SELECT 
      p.id,
      p.title,
      p.content,
      p.user_id,
      p.created_at,
      p.updated_at,
      u.username,
      u.full_name,
      u.avatar_url,
      COUNT(DISTINCT l.id) as like_count,
      COUNT(DISTINCT c.id) as comment_count,
      EXISTS(
        SELECT 1 FROM likes l2 
        WHERE l2.post_id = p.id AND l2.user_id = $2
      ) as user_has_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.id = $1
    GROUP BY p.id, u.id, u.username, u.full_name, u.avatar_url
  `;
    const values = [id, currentUserId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get posts by user
  static async findByUser(
    userId,
    limit = 20,
    offset = 0,
    currentUserId = null,
  ) {
    if (!currentUserId) {
      const query = `
      SELECT 
        p.*,
        u.username,
        u.full_name,
        u.avatar_url,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT c.id) as comment_count,
        false as user_has_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.user_id = $1
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
      const values = [userId, limit, offset];
      const result = await pool.query(query, values);
      return result.rows;
    }

    const query = `
    SELECT 
      p.*,
      u.username,
      u.full_name,
      u.avatar_url,
      COUNT(DISTINCT l.id) as like_count,
      COUNT(DISTINCT c.id) as comment_count,
      EXISTS(
        SELECT 1 FROM likes l2 
        WHERE l2.post_id = p.id AND l2.user_id = $3
      ) as user_has_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.user_id = $1
    GROUP BY p.id, u.id
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $4
  `;
    const values = [userId, limit, currentUserId, offset];
    const result = await pool.query(query, values);
    return result.rows;
  }

  // Update post
  static async update(id, userId, { title, content }) {
    const query = `
      UPDATE posts 
      SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING id, title, content, user_id, created_at, updated_at
    `;
    const values = [title, content, id, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete post
  static async delete(id, userId) {
    const query =
      "DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id";
    const values = [id, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Post;
