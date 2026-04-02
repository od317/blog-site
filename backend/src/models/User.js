const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

class User {
  // Create users table
  static async createTable() {
    // First, create the table without the refresh_token index
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

    // Now create indexes separately
    await this.createIndexes();
  }

  // Create indexes separately
  static async createIndexes() {
    try {
      // Check if email index exists
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `);

      // Check if username index exists
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
      `);

      // Check if refresh_token column exists before creating index
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'refresh_token'
      `);

      if (columnCheck.rows.length > 0) {
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token)
        `);
      }

      console.log("✅ Indexes created/verified");
    } catch (error) {
      console.error("Error creating indexes:", error.message);
    }
  }

  // Add missing columns for existing databases
  static async addMissingColumns() {
    try {
      // Check if refresh_token column exists
      const checkQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'refresh_token'
      `;
      const result = await pool.query(checkQuery);

      if (result.rows.length === 0) {
        console.log("Adding refresh_token columns...");

        // Add columns
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(500),
          ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMP
        `);

        // Create index after columns exist
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token)
        `);

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

  // Clear refresh token (for logout)
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

  // Find by ID
  static async findById(id) {
    const query = `
      SELECT id, username, email, full_name, avatar_url, bio, 
             is_verified, followers_count, following_count, created_at
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

  // Verify email
  static async verifyEmail(token) {
    const query = `
      UPDATE users 
      SET is_verified = TRUE, 
          verification_token = NULL,
          verification_token_expires = NULL
      WHERE verification_token = $1 
        AND verification_token_expires > CURRENT_TIMESTAMP
      RETURNING id, email, username
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }
}

module.exports = User;
