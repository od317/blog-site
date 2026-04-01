const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// For Render, use the DATABASE_URL from environment if available
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test database connection
const testConnection = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL database");
    return true;
  } catch (err) {
    console.error("❌ Error connecting to database:", err.message);
    return false;
  }
};

testConnection();

module.exports = pool;
