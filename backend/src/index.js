const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const pool = require("./config/database");
const User = require("./models/User");
const Follow = require("./models/Follow");
const Post = require("./models/Post");
const Comment = require("./models/Comment");
const Like = require("./models/Like");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Auto-initialize database on startup
const initializeDatabase = async () => {
  try {
    console.log("🔄 Checking database tables...");

    // Wait for database to be ready with retries
    let retries = 10;
    while (retries > 0) {
      try {
        await pool.query("SELECT NOW()");
        break;
      } catch (err) {
        console.log(`Database not ready, retries left: ${retries}`);
        retries--;
        if (retries === 0) {
          console.error("Could not connect to database after multiple retries");
          process.exit(1);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Create tables if they don't exist
    await User.createTable();
    await Follow.createTable();
    await Post.createTable();
    await Comment.createTable();
    await Like.createTable();

    console.log("✅ Database tables verified/created");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    // Don't exit, just log error - app might still work if tables exist
  }
};

// Run initialization before starting server
initializeDatabase().then(() => {
  // Socket.io setup and server start here...
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    },
  });

  app.set("io", io);

  // CORS and body parsers
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Routes
  const authRoutes = require("./routes/auth.routes");
  const userRoutes = require("./routes/user.routes");
  const postRoutes = require("./routes/posts.routes");

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "OK",
      message: "Server is running",
      timestamp: new Date(),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res
      .status(404)
      .json({ error: `Route ${req.method} ${req.path} not found` });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  });

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    socket.on("authenticate", (token) => {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.join(`user:${decoded.id}`);
        console.log(`✅ User ${decoded.id} authenticated on socket`);
        socket.emit("authenticated", { userId: decoded.id });
      } catch (error) {
        console.log("❌ Socket authentication failed:", error.message);
        socket.emit("auth-error", { message: "Authentication failed" });
      }
    });

    socket.on("subscribe-feed", () => {
      if (socket.userId) {
        socket.join("feed");
        console.log(`User ${socket.userId} subscribed to feed`);
        socket.emit("subscribed", { channel: "feed" });
      }
    });

    socket.on("unsubscribe-feed", () => {
      if (socket.userId) {
        socket.leave("feed");
        console.log(`User ${socket.userId} unsubscribed from feed`);
      }
    });

    socket.on("join-post", (postId) => {
      socket.join(`post-${postId}`);
      console.log(`Socket ${socket.id} joined post-${postId}`);
    });

    socket.on("leave-post", (postId) => {
      socket.leave(`post-${postId}`);
      console.log(`Socket ${socket.id} left post-${postId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
    console.log(`📝 Posts endpoint: http://localhost:${PORT}/api/posts`);
  });
});
