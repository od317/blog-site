// routes/migrations.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ============================================
// RUN ALL MIGRATIONS
// ============================================
router.post("/run-all", async (req, res) => {
  try {
    console.log("🔧 Running all migrations...");

    // 1. Users table
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
    console.log("✅ Users table ready");

    // 2. Posts table
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
    console.log("✅ Posts table ready");

    // 3. Comments table (with ALL columns)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        reply_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Comments table ready");

    // 4. Likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    console.log("✅ Likes table ready");

    // 5. Follows table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);
    console.log("✅ Follows table ready");

    // 6. Saved posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    console.log("✅ Saved posts table ready");

    // 7. Notifications table
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
    console.log("✅ Notifications table ready");

    // ============================================
    // CREATE ALL INDEXES
    // ============================================

    // Users indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token)`,
    );

    // Posts indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`,
    );

    // Comments indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)`,
    );

    // Likes indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)`,
    );

    // Follows indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`,
    );

    // Saved posts indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id)`,
    );

    // Notifications indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_type_post ON notifications(user_id, type, post_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON notifications(comment_id)`,
    );

    console.log("✅ All indexes created");

    res.json({
      success: true,
      message: "All tables and indexes created successfully",
      tables: [
        "users",
        "posts",
        "comments",
        "likes",
        "follows",
        "saved_posts",
        "notifications",
      ],
      indexes: [
        "idx_users_email",
        "idx_users_username",
        "idx_users_refresh_token",
        "idx_posts_user_id",
        "idx_posts_created_at",
        "idx_comments_post_id",
        "idx_comments_user_id",
        "idx_comments_parent_id",
        "idx_comments_created_at",
        "idx_likes_post_id",
        "idx_likes_user_id",
        "idx_follows_follower",
        "idx_follows_following",
        "idx_saved_posts_user_id",
        "idx_saved_posts_post_id",
        "idx_notifications_user_id",
        "idx_notifications_user_read",
        "idx_notifications_created_at",
        "idx_notifications_type_post",
        "idx_notifications_comment_id",
      ],
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// INDIVIDUAL MIGRATIONS (for incremental updates)
// ============================================

// Add avatar_url to users
router.post("/add-avatar-column", async (req, res) => {
  try {
    const checkResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'avatar_url'
    `);

    if (checkResult.rows.length > 0) {
      return res.json({ message: "Column avatar_url already exists" });
    }

    await pool.query(`ALTER TABLE users ADD COLUMN avatar_url TEXT`);
    console.log("✅ avatar_url column added");
    res.json({ success: true, message: "avatar_url column added" });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add image_url to posts
router.post("/add-post-image-column", async (req, res) => {
  try {
    const checkResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'image_url'
    `);

    if (checkResult.rows.length > 0) {
      return res.json({ message: "Column image_url already exists" });
    }

    await pool.query(`ALTER TABLE posts ADD COLUMN image_url TEXT`);
    console.log("✅ image_url column added");
    res.json({ success: true, message: "image_url column added" });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add comment nesting columns (parent_id, reply_count, updated_at + indexes)
router.post("/add-comment-nesting-columns", async (req, res) => {
  try {
    // parent_id
    const parentIdCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'parent_id'
    `);
    if (parentIdCheck.rows.length === 0) {
      await pool.query(
        `ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE`,
      );
      console.log("✅ parent_id column added");
    }

    // reply_count
    const replyCountCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'reply_count'
    `);
    if (replyCountCheck.rows.length === 0) {
      await pool.query(
        `ALTER TABLE comments ADD COLUMN reply_count INTEGER DEFAULT 0`,
      );
      console.log("✅ reply_count column added");
    }

    // updated_at
    const updatedAtCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'updated_at'
    `);
    if (updatedAtCheck.rows.length === 0) {
      await pool.query(
        `ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      );
      console.log("✅ updated_at column added");
    }

    // Indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)`,
    );
    console.log("✅ Comments indexes created");

    res.json({ success: true, message: "Comment nesting columns added" });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add notifications table
router.post("/add-notifications-table", async (req, res) => {
  try {
    const tableExists = await pool.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications')
    `);

    if (tableExists.rows[0].exists) {
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
      )
    `);

    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_type_post ON notifications(user_id, type, post_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON notifications(comment_id)`,
    );

    console.log("✅ Notifications table created");
    res.json({ success: true, message: "Notifications table created" });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add saved_posts table
router.post("/add-saved-posts-table", async (req, res) => {
  try {
    const tableExists = await pool.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_posts')
    `);

    if (tableExists.rows[0].exists) {
      return res.json({ message: "Saved posts table already exists" });
    }

    await pool.query(`
      CREATE TABLE saved_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);

    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id)`,
    );

    console.log("✅ Saved posts table created");
    res.json({ success: true, message: "Saved posts table created" });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
