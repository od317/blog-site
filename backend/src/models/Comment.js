const pool = require("../config/database");

class Comment {
  // Create comments table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
    `;

    await pool.query(query);
    console.log("✅ Comments table ready");
  }

  // Create comment
  static async create({ content, post_id, user_id }) {
    const query = `
      INSERT INTO comments (content, post_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING id, content, post_id, user_id, created_at
    `;
    const values = [content, post_id, user_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get comments for a post with user info
  static async findByPost(postId, limit = 50, offset = 0) {
    const query = `
    SELECT 
      c.*,
      u.username,
      u.full_name,
      u.avatar_url
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $3
  `;
    const values = [postId, limit, offset];
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(id, userId, content) {
    const query = `
      UPDATE comments 
      SET content = $1 
      WHERE id = $2 AND user_id = $3
      RETURNING id, content, post_id, user_id, created_at
    `;
    const values = [content, id, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete comment
  static async delete(id, userId) {
    const query =
      "DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id";
    const values = [id, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get comment count for a post
  static async getCount(postId) {
    const query = "SELECT COUNT(*) as count FROM comments WHERE post_id = $1";
    const result = await pool.query(query, [postId]);
    return parseInt(result.rows[0].count);
  }

  // Get comment by ID
  static async findById(id) {
    const query = `
    SELECT 
      c.*,
      u.username,
      u.full_name,
      u.avatar_url
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = $1
  `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Comment;
