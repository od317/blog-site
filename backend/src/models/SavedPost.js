const pool = require("../config/database");

class SavedPost {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS saved_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id);
    `;

    await pool.query(query);
    console.log("✅ Saved posts table ready");
  }

  // Save a post
  static async save(postId, userId) {
    const query = `
      INSERT INTO saved_posts (post_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (post_id, user_id) DO NOTHING
      RETURNING id, post_id, user_id, created_at
    `;
    const values = [postId, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Unsave a post
  static async unsave(postId, userId) {
    const query =
      "DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2 RETURNING id";
    const values = [postId, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Check if user saved a post
  static async hasSaved(postId, userId) {
    const query =
      "SELECT 1 FROM saved_posts WHERE post_id = $1 AND user_id = $2";
    const values = [postId, userId];
    const result = await pool.query(query, values);
    return result.rows.length > 0;
  }

  // Get saved posts for a user
  static async getSavedPosts(userId, limit = 20, offset = 0) {
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
          WHERE l2.post_id = p.id AND l2.user_id = $1
        ) as user_has_liked,
        sp.created_at as saved_at
      FROM saved_posts sp
      JOIN posts p ON sp.post_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE sp.user_id = $1
      GROUP BY p.id, u.id, u.username, u.full_name, u.avatar_url, sp.created_at
      ORDER BY sp.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [userId, limit, offset];
    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get count of saved posts for a user
  static async getSavedPostsCount(userId) {
    const query =
      "SELECT COUNT(*) as count FROM saved_posts WHERE user_id = $1";
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = SavedPost;
