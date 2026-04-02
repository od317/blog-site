const pool = require("./config/database");
const User = require("./models/User");
const Follow = require("./models/Follow");
const Post = require("./models/Post");
const Comment = require("./models/Comment");
const Like = require("./models/Like");

const initDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");

    // Wait for database to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await pool.query("SELECT NOW()");
        console.log("✅ Database connected");
        break;
      } catch (err) {
        console.log(`Database not ready yet, retries left: ${retries}`);
        retries--;
        if (retries === 0) {
          console.error("Could not connect to database after multiple retries");
          process.exit(1);
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // Create all tables (order matters due to foreign keys)
    console.log("Creating tables...");
    await User.createTable();
    console.log("✓ Users table");

    await Follow.createTable();
    console.log("✓ Follows table");

    await Post.createTable();
    console.log("✓ Posts table");

    await Comment.createTable();
    console.log("✓ Comments table");

    await Like.createTable();
    console.log("✓ Likes table");

    // Add missing columns to existing tables
    console.log("Checking for missing columns...");
    await User.addMissingColumns();

    console.log("✅ Database initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

initDatabase();
