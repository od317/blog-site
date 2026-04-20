const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Migration: Add avatar_url column if not exists
router.post("/add-avatar-column", async (req, res) => {
  try {
    console.log(
      "🔧 Running migration: Adding avatar_url column to users table...",
    );

    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'avatar_url'
    `;
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      return res.json({ message: "Column avatar_url already exists" });
    }

    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN avatar_url TEXT
    `);

    console.log("✅ Migration completed: avatar_url column added");
    res.json({
      success: true,
      message: "avatar_url column added successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Migration: Add image_url column to posts (if not exists)
router.post("/add-post-image-column", async (req, res) => {
  try {
    console.log(
      "🔧 Running migration: Adding image_url column to posts table...",
    );

    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'image_url'
    `;
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      return res.json({ message: "Column image_url already exists" });
    }

    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN image_url TEXT
    `);

    console.log("✅ Migration completed: image_url column added");
    res.json({ success: true, message: "image_url column added successfully" });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Run all migrations
router.post("/run-all", async (req, res) => {
  try {
    // Add avatar_url to users
    const avatarCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'avatar_url'
    `);

    if (avatarCheck.rows.length === 0) {
      await pool.query(`ALTER TABLE users ADD COLUMN avatar_url TEXT`);
      console.log("✅ avatar_url column added");
    }

    // Add image_url to posts
    const imageCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'image_url'
    `);

    if (imageCheck.rows.length === 0) {
      await pool.query(`ALTER TABLE posts ADD COLUMN image_url TEXT`);
      console.log("✅ image_url column added");
    }

    res.json({
      success: true,
      message: "All migrations completed successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
