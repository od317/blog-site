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

// Migration: Add parent_id and reply_count to comments (for nested comments/replies)
router.post("/add-comment-nesting-columns", async (req, res) => {
  try {
    console.log(
      "🔧 Running migration: Adding parent_id and reply_count columns to comments table...",
    );

    // Check if parent_id column exists
    const parentIdCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'parent_id'
    `);

    if (parentIdCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE comments 
        ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE
      `);
      console.log("✅ parent_id column added");
    } else {
      console.log("ℹ️ parent_id column already exists");
    }

    // Check if reply_count column exists
    const replyCountCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'reply_count'
    `);

    if (replyCountCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE comments 
        ADD COLUMN reply_count INTEGER DEFAULT 0
      `);
      console.log("✅ reply_count column added");
    } else {
      console.log("ℹ️ reply_count column already exists");
    }

    // Add index on parent_id for better query performance
    const indexCheck = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'comments' AND indexname = 'idx_comments_parent_id'
    `);

    if (indexCheck.rows.length === 0) {
      await pool.query(`
        CREATE INDEX idx_comments_parent_id ON comments(parent_id)
      `);
      console.log("✅ index on parent_id created");
    } else {
      console.log("ℹ️ index on parent_id already exists");
    }

    console.log("✅ Migration completed: comment nesting columns added");
    res.json({
      success: true,
      message: "parent_id and reply_count columns added successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/add-comment-updated-at", async (req, res) => {
  try {
    console.log(
      "🔧 Running migration: Adding updated_at column to comments table...",
    );

    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'updated_at'
    `;
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      return res.json({ message: "Column updated_at already exists" });
    }

    await pool.query(`
      ALTER TABLE comments 
      ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    console.log("✅ Migration completed: updated_at column added");
    res.json({
      success: true,
      message: "updated_at column added successfully",
    });
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

    // Add parent_id and reply_count to comments
    const parentIdCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'parent_id'
    `);

    if (parentIdCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE comments 
        ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE
      `);
      console.log("✅ parent_id column added");
    }

    const replyCountCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'reply_count'
    `);

    if (replyCountCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE comments 
        ADD COLUMN reply_count INTEGER DEFAULT 0
      `);
      console.log("✅ reply_count column added");
    }

    const indexCheck = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'comments' AND indexname = 'idx_comments_parent_id'
    `);

    if (indexCheck.rows.length === 0) {
      await pool.query(`
        CREATE INDEX idx_comments_parent_id ON comments(parent_id)
      `);
      console.log("✅ index on parent_id created");
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
