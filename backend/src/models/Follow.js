const pool = require("../config/database");

class Follow {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
    `;

    await pool.query(query);
    console.log("✅ Follows table ready");
  }
}

module.exports = Follow;
