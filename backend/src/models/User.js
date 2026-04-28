const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

class User {
  // Create users table
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        avatar_url TEXT,
        bio TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP,
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        refresh_token VARCHAR(500),
        refresh_token_expires TIMESTAMP,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTableQuery);
    console.log("✅ Users table ready");
    await this.createIndexes();
  }

  // Create indexes separately
  static async createIndexes() {
    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      );
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
      );

      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'refresh_token'
      `);

      if (columnCheck.rows.length > 0) {
        await pool.query(
          `CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token)`,
        );
      }

      console.log("✅ Indexes created/verified");
    } catch (error) {
      console.error("Error creating indexes:", error.message);
    }
  }

  // Add missing columns for existing databases
  static async addMissingColumns() {
    try {
      const checkQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'refresh_token'
      `;
      const result = await pool.query(checkQuery);

      if (result.rows.length === 0) {
        console.log("Adding refresh_token columns...");
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(500),
          ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMP
        `);
        await pool.query(
          `CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token)`,
        );
        console.log("✅ Refresh token columns added");
      } else {
        console.log("Refresh token columns already exist");
      }
    } catch (error) {
      console.error("Error adding columns:", error.message);
    }
  }

  // Save refresh token
  static async saveRefreshToken(userId, refreshToken, expiresAt) {
    const query = `
      UPDATE users 
      SET refresh_token = $1, refresh_token_expires = $2
      WHERE id = $3
    `;
    await pool.query(query, [refreshToken, expiresAt, userId]);
    console.log(`✅ Refresh token saved for user ${userId}`);
  }

  // Get user by refresh token
  static async findByRefreshToken(refreshToken) {
    const query = `
      SELECT * FROM users 
      WHERE refresh_token = $1 AND refresh_token_expires > CURRENT_TIMESTAMP
    `;
    const result = await pool.query(query, [refreshToken]);
    return result.rows[0];
  }

  // Clear refresh token
  static async clearRefreshToken(userId) {
    const query = `
      UPDATE users 
      SET refresh_token = NULL, refresh_token_expires = NULL
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }

  // Create user
  static async create(userData) {
    const { username, email, password, full_name, avatar_url, bio } = userData;
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const query = `
      INSERT INTO users (id, username, email, password_hash, full_name, avatar_url, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, email, full_name, avatar_url, bio, is_verified, created_at
    `;

    const values = [
      id,
      username,
      email,
      password_hash,
      full_name,
      avatar_url,
      bio,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find by email
  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find by username
  static async findByUsername(username) {
    const query = "SELECT * FROM users WHERE username = $1";
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  // Find by ID - FIXED: includes refresh_token fields
  static async findById(id) {
    const query = `
      SELECT id, username, email, full_name, avatar_url, bio, 
             is_verified, followers_count, following_count, created_at,
             refresh_token, refresh_token_expires
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Save verification token
  static async saveVerificationToken(userId, token, expiresAt) {
    const query = `
      UPDATE users 
      SET verification_token = $1, verification_token_expires = $2
      WHERE id = $3
    `;
    await pool.query(query, [token, expiresAt, userId]);
  }

  static async setVerified(userId, isVerified) {
    const query = `
    UPDATE users 
    SET is_verified = $1
    WHERE id = $2
  `;
    await pool.query(query, [isVerified, userId]);
  }

  // Get full user profile with stats
  static async getProfile(userId) {
    const query = `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.full_name,
      u.avatar_url,
      u.bio,
      u.is_verified,
      u.followers_count,
      u.following_count,
      u.created_at,
      COUNT(DISTINCT p.id) as posts_count,
      COUNT(DISTINCT l.id) as total_likes_received
    FROM users u
    LEFT JOIN posts p ON p.user_id = u.id
    LEFT JOIN likes l ON l.post_id = p.id
    WHERE u.id = $1
    GROUP BY u.id
  `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Get user posts with pagination
static async getUserPosts(
  userId,
  limit = 10,
  offset = 0,
  currentUserId = null,
) {
  console.log("📊 getUserPosts called with:", {
    userId,
    currentUserId,
    limit,
    offset
  });
  
  // If no current user, just return false for user_has_liked
  if (!currentUserId) {
    const query = `
      SELECT 
        p.id,
        p.title,
        p.content,
        p.image_url,
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
      WHERE p.user_id = $1
      GROUP BY p.id, u.id, u.username, u.full_name, u.avatar_url
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [userId, limit, offset];
    const result = await pool.query(query, values);
    return result.rows;
  }

  // With current user - check if they liked each post
  const query = `
    SELECT 
      p.id,
      p.title,
      p.content,
      p.image_url,
      p.created_at,
      p.updated_at,
      u.username,
      u.full_name,
      u.avatar_url,
      COUNT(DISTINCT l.id) as like_count,
      COUNT(DISTINCT c.id) as comment_count,
      EXISTS(
        SELECT 1 FROM likes l2 
        WHERE l2.post_id = p.id AND l2.user_id = $3::uuid
      ) as user_has_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.user_id = $1
    GROUP BY p.id, u.id, u.username, u.full_name, u.avatar_url
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $4
  `;
  const values = [userId, limit, currentUserId, offset];
  const result = await pool.query(query, values);
  
  // Debug output
  if (result.rows.length > 0) {
    console.log("📊 First post user_has_liked:", result.rows[0].user_has_liked);
  }
  
  return result.rows;
}

  // Get user posts count
  static async getUserPostsCount(userId) {
    const query = `SELECT COUNT(*) as count FROM posts WHERE user_id = $1`;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async updateAvatar(userId, avatarUrl) {
    const query = `
    UPDATE users 
    SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, username, email, avatar_url, full_name, bio
  `;
    const result = await pool.query(query, [avatarUrl, userId]);
    return result.rows[0];
  }
}

module.exports = User;
