const pool = require("./config/database");
const User = require("./models/User");
const Follow = require("./models/Follow");

const initDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");

    // Wait for database to be ready
    let retries = 5;
    while (retries > 0) {
      try {
        await pool.query("SELECT NOW()");
        break;
      } catch (err) {
        console.log(`Database not ready yet, retries left: ${retries}`);
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    await User.createTable();
    await Follow.createTable();
    console.log("✅ Database initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

initDatabase();
