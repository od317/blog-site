const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// One-time migration endpoint (remove after running)
router.post("/add-image-column", async (req, res) => {
  try {
    console.log(
      "🔧 Running migration: Adding image_url column to posts table...",
    );

    // Check if column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'image_url'
    `;
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      return res.json({ message: "Column image_url already exists" });
    }

    // Add the column
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

module.exports = router;
