const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Protected migration endpoint (remove after running)
router.post("/migrate/add-refresh-token", async (req, res) => {
  try {
    console.log("Running migration: Adding refresh_token columns...");

    // Check if column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'refresh_token'
    `;
    const result = await pool.query(checkQuery);

    if (result.rows.length === 0) {
      // Add the columns
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN refresh_token VARCHAR(500),
        ADD COLUMN refresh_token_expires TIMESTAMP
      `);

      // Create index
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token)
      `);

      console.log("✅ Migration completed: refresh_token columns added");
      res.json({
        success: true,
        message: "Refresh token columns added successfully",
      });
    } else {
      console.log("Columns already exist");
      res.json({
        success: true,
        message: "Refresh token columns already exist",
      });
    }
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
