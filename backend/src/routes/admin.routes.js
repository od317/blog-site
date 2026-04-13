const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Check and fix comments table structure
router.get("/check-comments-table", async (req, res) => {
  try {
    const results = {};

    // 1. Check if comments table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'comments'
      );
    `);
    results.tableExists = tableCheck.rows[0].exists;

    if (!results.tableExists) {
      // Create the comments table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          content TEXT NOT NULL,
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      results.tableCreated = true;
    }

    // 2. Check columns
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'comments'
      ORDER BY ordinal_position;
    `);
    results.columns = columns.rows;

    // 3. Check indexes
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'comments';
    `);
    results.indexes = indexes.rows;

    // 4. Get comment count
    const count = await pool.query("SELECT COUNT(*) FROM comments");
    results.commentCount = parseInt(count.rows[0].count);

    res.json(results);
  } catch (error) {
    console.error("Migration check error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Force recreate comments table (be careful!)
router.post("/recreate-comments-table", async (req, res) => {
  try {
    // Drop existing table
    await pool.query("DROP TABLE IF EXISTS comments CASCADE");

    // Recreate table
    await pool.query(`
      CREATE TABLE comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX idx_comments_post_id ON comments(post_id);
      CREATE INDEX idx_comments_user_id ON comments(user_id);
      CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
    `);

    res.json({
      success: true,
      message: "Comments table recreated successfully",
    });
  } catch (error) {
    console.error("Recreate table error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check comments for a specific post
router.get("/post-comments/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    // Get all comments for this post
    const comments = await pool.query(
      `
      SELECT 
        c.id,
        c.content,
        c.post_id,
        c.user_id,
        c.created_at,
        u.username,
        u.full_name,
        u.avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at DESC
    `,
      [postId],
    );

    // Also check if the post exists
    const post = await pool.query("SELECT id, title FROM posts WHERE id = $1", [
      postId,
    ]);

    res.json({
      postExists: post.rows.length > 0,
      post: post.rows[0] || null,
      comments: comments.rows,
      commentCount: comments.rows.length,
    });
  } catch (error) {
    console.error("Error checking post comments:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/fix-orphaned-comments", async (req, res) => {
  try {
    // Update comments with null user_id to use the post's author
    const result = await pool.query(`
      UPDATE comments c
      SET user_id = p.user_id
      FROM posts p
      WHERE c.post_id = p.id 
        AND c.user_id IS NULL
      RETURNING c.id, c.user_id
    `);

    res.json({
      message: `Fixed ${result.rows.length} orphaned comments`,
      fixedComments: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
