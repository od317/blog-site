const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// ========== CORS CONFIGURATION ==========
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

// ========== BODY PARSERS - MUST BE BEFORE ROUTES ==========
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ========== REQUEST LOGGING ==========
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }
  next();
});

// ========== ROUTES ==========
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/posts.routes");

app.use("/api/posts", (req, res, next) => {
  console.log("\n=== POSTS ROUTE DEBUG ===");
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("Raw body chunks: (if any)");

  // Capture raw body for this route only
  let rawBody = "";
  req.on("data", (chunk) => {
    rawBody += chunk;
    console.log("Chunk received:", chunk.toString());
  });

  req.on("end", () => {
    console.log("Complete raw body:", rawBody);
    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody);
        console.log("Parsed raw body:", parsed);
      } catch (e) {
        console.log("Failed to parse raw body:", e.message);
      }
    }
  });

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

// ========== HEALTH CHECK ==========
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date(),
  });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// ========== SOCKET.IO ==========
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
