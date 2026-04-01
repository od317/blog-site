const pool = require("../config/database");

class Like {
  // Create likes table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
    `;

    await pool.query(query);
    console.log("✅ Likes table ready");
  }

  // Add like
  static async create(postId, userId) {
    const query = `
      INSERT INTO likes (post_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (post_id, user_id) DO NOTHING
      RETURNING id, post_id, user_id, created_at
    `;
    const values = [postId, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Remove like
  static async delete(postId, userId) {
    const query =
      "DELETE FROM likes WHERE post_id = $1 AND user_id = $2 RETURNING id";
    const values = [postId, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Check if user liked post
  static async hasLiked(postId, userId) {
    const query = "SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2";
    const values = [postId, userId];
    const result = await pool.query(query, values);
    return result.rows.length > 0;
  }

  // Get like count for a post
  static async getCount(postId) {
    const query = "SELECT COUNT(*) as count FROM likes WHERE post_id = $1";
    const result = await pool.query(query, [postId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Like;
