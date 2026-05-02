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

// Migration: Add notifications table with comment_id column
router.post("/add-notifications-table", async (req, res) => {
  try {
    console.log("🔧 Running migration: Adding notifications table...");

    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);

    if (checkTable.rows[0].exists) {
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

        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON notifications(comment_id)
        `);
        console.log("✅ index on comment_id created");
      }

      return res.json({ message: "Notifications table already exists" });
    }

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

// Migration: Add comment_id column to existing notifications table
router.post("/add-comment-id-to-notifications", async (req, res) => {
  try {
    console.log(
      "🔧 Running migration: Adding comment_id column to notifications table...",
    );

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

    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'comment_id'
    `);

    if (columnCheck.rows.length > 0) {
      return res.json({ message: "Column comment_id already exists" });
    }

    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN comment_id UUID REFERENCES comments(id) ON DELETE CASCADE
    `);

    console.log("✅ comment_id column added");

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

// ✅ NEW: Migration: Add saved_posts table
router.post("/add-saved-posts-table", async (req, res) => {
  try {
    console.log("🔧 Running migration: Adding saved_posts table...");

    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'saved_posts'
      );
    `);

    if (checkTable.rows[0].exists) {
      return res.json({ message: "Saved posts table already exists" });
    }

    await pool.query(`
      CREATE TABLE saved_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
    `);

    await pool.query(`
      CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);
      CREATE INDEX idx_saved_posts_post_id ON saved_posts(post_id);
    `);

    console.log("✅ Saved posts table created");
    res.json({
      success: true,
      message: "Saved posts table added successfully",
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

    // Add notifications table with comment_id
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

    // ✅ Add saved_posts table
    const savedPostsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'saved_posts'
      );
    `);

    if (!savedPostsCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE saved_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        );
      `);
      console.log("✅ saved_posts table added");

      await pool.query(`
        CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);
        CREATE INDEX idx_saved_posts_post_id ON saved_posts(post_id);
      `);
      console.log("✅ saved_posts indexes created");
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

// Create all tables from scratch (for fresh database)
router.post("/create-all-tables", async (req, res) => {
  try {
    console.log("🔧 Creating all tables from scratch...");

    // Create users table
    await pool.query(`
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
      )
    `);
    console.log("✅ Users table created");

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Posts table created");

    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Comments table created");

    // Create likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    console.log("✅ Likes table created");

    // Create follows table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);
    console.log("✅ Follows table created");

    // Create saved_posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    console.log("✅ Saved posts table created");

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Notifications table created");

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read)`);
    console.log("✅ All indexes created");

    res.json({
      success: true,
      message: "All tables created successfully"
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
