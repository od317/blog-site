const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

class User {
  // Create users table
  static async createTable() {
    const query = `
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
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
    `;

    await pool.query(query);
    console.log("✅ Users table ready");
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
