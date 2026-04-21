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

// ✅ UPDATED: Migration: Add notifications table with comment_id column
router.post("/add-notifications-table", async (req, res) => {
  try {
    console.log("🔧 Running migration: Adding notifications table...");

    // Check if notifications table already exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);

    if (checkTable.rows[0].exists) {
      // Table exists, check if comment_id column exists
      const checkColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'comment_id'
      `);

      if (checkColumn.rows.length === 0) {
        console.log(
          "🔧 Adding comment_id column to existing notifications table...",
        );
        await pool.query(`
          ALTER TABLE notifications 
          ADD COLUMN comment_id UUID REFERENCES comments(id) ON DELETE CASCADE
        `);
        console.log("✅ comment_id column added");

        // Add index on comment_id
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON notifications(comment_id)
        `);
        console.log("✅ index on comment_id created");
      }

      return res.json({ message: "Notifications table already exists" });
    }

    // Create notifications table with comment_id column
    await pool.query(`
      CREATE TABLE notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Notifications table created");

    // Create indexes
    await pool.query(`
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX idx_notifications_comment_id ON notifications(comment_id);
    `);

    console.log("✅ Notifications indexes created");

    res.json({
      success: true,
      message: "Notifications table added successfully with comment_id column",
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW: Migration to add comment_id column to existing notifications table
router.post("/add-comment-id-to-notifications", async (req, res) => {
  try {
    console.log(
      "🔧 Running migration: Adding comment_id column to notifications table...",
    );

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return res
        .status(400)
        .json({ error: "Notifications table does not exist yet" });
    }

    // Check if comment_id column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'comment_id'
    `);

    if (columnCheck.rows.length > 0) {
      return res.json({ message: "Column comment_id already exists" });
    }

    // Add comment_id column
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN comment_id UUID REFERENCES comments(id) ON DELETE CASCADE
    `);

    console.log("✅ comment_id column added");

    // Add index on comment_id
    await pool.query(`
      CREATE INDEX idx_notifications_comment_id ON notifications(comment_id)
    `);

    console.log("✅ index on comment_id created");

    res.json({
      success: true,
      message: "comment_id column added to notifications table successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Run all migrations (including notifications with comment_id)
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

    // Add updated_at to comments
    const updatedAtCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'updated_at'
    `);

    if (updatedAtCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE comments 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log("✅ updated_at column added");
    }

    // ✅ Add notifications table with comment_id
    const notificationsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);

    if (!notificationsCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ notifications table added");

      await pool.query(`
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
        CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
        CREATE INDEX idx_notifications_comment_id ON notifications(comment_id);
      `);
      console.log("✅ notifications indexes created");
    } else {
      // Check if comment_id column exists in notifications
      const commentIdCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'comment_id'
      `);

      if (commentIdCheck.rows.length === 0) {
        await pool.query(`
          ALTER TABLE notifications 
          ADD COLUMN comment_id UUID REFERENCES comments(id) ON DELETE CASCADE
        `);
        console.log("✅ comment_id column added to notifications");

        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON notifications(comment_id)
        `);
        console.log("✅ index on comment_id created");
      }
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
