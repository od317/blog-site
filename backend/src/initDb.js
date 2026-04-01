const pool = require("./config/database");
const User = require("./models/User");
const Follow = require("./models/Follow");
const Post = require("./models/Post");
const Comment = require("./models/Comment");
const Like = require("./models/Like");

const initDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");
    console.log("Environment:", process.env.NODE_ENV);

    // Wait for database to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await pool.query("SELECT NOW()");
        break;
      } catch (err) {
        console.log(`Database not ready yet, retries left: ${retries}`);
        retries--;
        if (retries === 0) {
          console.error("Could not connect to database after multiple retries");
          process.exit(1);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Create all tables
    await User.createTable();
    await Follow.createTable();
    await Post.createTable();
    await Comment.createTable();
    await Like.createTable();

    console.log("✅ Database initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

initDatabase();
