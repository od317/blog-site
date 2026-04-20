const pool = require("../config/database");

class Comment {
  static async createTable() {
    const query = `
    CREATE TABLE IF NOT EXISTS comments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      content TEXT NOT NULL,
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      reply_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
  `;

    await pool.query(query);
    console.log("✅ Comments table ready");
  }

  // Create a comment (top-level or reply)
  static async create({ content, post_id, user_id, parent_id = null }) {
    const query = `
      INSERT INTO comments (content, post_id, user_id, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, post_id, user_id, parent_id, created_at
    `;
    const values = [content, post_id, user_id, parent_id];
    const result = await pool.query(query, values);

    // If this is a reply, increment parent's reply_count
    if (parent_id) {
      await pool.query(
        `UPDATE comments SET reply_count = reply_count + 1 WHERE id = $1`,
        [parent_id],
      );
    }

    return result.rows[0];
  }

  // Get top-level comments for a post (no parent)
  static async findByPost(postId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        c.*,
        u.username,
        u.full_name,
        u.avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [postId, limit, offset];
    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get replies for a specific comment
  static async getReplies(commentId, limit = 20, offset = 0) {
    const query = `
      SELECT 
        c.*,
        u.username,
        u.full_name,
        u.avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const values = [commentId, limit, offset];
    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get reply count for a comment
  static async getReplyCount(commentId) {
    const query = `SELECT reply_count FROM comments WHERE id = $1`;
    const result = await pool.query(query, [commentId]);
    return result.rows[0]?.reply_count || 0;
  }

  static async update(id, userId, content) {
    const query = `
    UPDATE comments 
    SET content = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND user_id = $3
    RETURNING id, content, post_id, user_id, parent_id, created_at, updated_at
  `;
    const values = [content, id, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id, userId) {
    // First get the comment to know its parent
    const comment = await this.findById(id);

    const query =
      "DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id";
    const values = [id, userId];
    const result = await pool.query(query, values);

    // If this was a reply, decrement parent's reply_count
    if (result.rows.length > 0 && comment?.parent_id) {
      await pool.query(
        `UPDATE comments SET reply_count = reply_count - 1 WHERE id = $1`,
        [comment.parent_id],
      );
    }

    return result.rows[0];
  }

  static async getCount(postId) {
    const query = "SELECT COUNT(*) as count FROM comments WHERE post_id = $1";
    const result = await pool.query(query, [postId]);
    return parseInt(result.rows[0].count);
  }

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

  // Get all comments for a post (including replies, flat structure)
  static async findByPostWithReplies(postId, limit = 50, offset = 0) {
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
}

module.exports = Comment;
