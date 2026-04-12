const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ========== CORS CONFIGURATION - FIX FOR RENDER ==========
// Allow all Render subdomains and localhost
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://blog-frontend-i0w1.onrender.com", // Your exact frontend URL
  /\.onrender\.com$/, // Allow any onrender subdomain
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error(`CORS policy does not allow ${origin}`));
    }
  },
  credentials: true, // Important for cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
  ],
  exposedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
};

app.use(cors(corsOptions));

// ========== COOKIE PARSER ==========
app.use(cookieParser());

// ========== BODY PARSERS ==========
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

// ========== SOCKET.IO SETUP ==========
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.includes("onrender.com") || origin.includes("localhost")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible to routes
app.set("io", io);

// ========== ROUTES ==========
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/posts.routes");
const adminRoutes = require("./routes/admin.routes");
const likeRoutes = require("./routes/likes.routes");
const profileRoutes = require("./routes/profile.routes");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/profile", profileRoutes);
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

// ========== SOCKET.IO CONNECTION HANDLING ==========
// Socket connection handling
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);
  console.log("🔌 Total connected clients:", io.engine.clientsCount);

  // Track current post room for cleanup
  let currentPostRoom = null;

  // Authenticate socket
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

  // Subscribe to global feed
  socket.on("subscribe-feed", () => {
    if (socket.userId) {
      socket.join("feed");
      console.log(`✅ User ${socket.userId} subscribed to feed room`);
      console.log(
        `✅ Feed room size:`,
        io.sockets.adapter.rooms.get("feed")?.size || 0,
      );
      socket.emit("subscribed", { channel: "feed" });
    }
  });

  // Unsubscribe from feed
  socket.on("unsubscribe-feed", () => {
    if (socket.userId) {
      socket.leave("feed");
      console.log(`User ${socket.userId} unsubscribed from feed`);
    }
  });

  // ========== POST ROOM HANDLERS ==========
  // Join a specific post room
  socket.on("join-post", (postId) => {
    // Leave previous post room if any
    if (currentPostRoom) {
      socket.leave(currentPostRoom);
      console.log(`Socket left previous room: ${currentPostRoom}`);
    }
    currentPostRoom = `post-${postId}`;
    socket.join(currentPostRoom);
    console.log(`✅ Socket ${socket.id} joined post room: ${currentPostRoom}`);
    socket.emit("post-joined", { postId });
  });

  // Leave a specific post room
  socket.on("leave-post", (postId) => {
    const room = `post-${postId}`;
    socket.leave(room);
    if (currentPostRoom === room) {
      currentPostRoom = null;
    }
    console.log(`Socket left post room: ${room}`);
  });

  // Handle delete comment
  socket.on("delete-comment", (data) => {
    console.log(`🗑️ Comment ${data.commentId} deleted on post ${data.postId}`);
    socket.to(`post-${data.postId}`).emit("comment-deleted", {
      commentId: data.commentId,
      postId: data.postId,
    });
  });

  // Handle update comment
  socket.on("update-comment", (data) => {
    console.log(`✏️ Comment ${data.commentId} updated on post ${data.postId}`);
    socket.to(`post-${data.postId}`).emit("comment-updated", {
      comment: data.comment,
      postId: data.postId,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (currentPostRoom) {
      console.log(`Socket left room on disconnect: ${currentPostRoom}`);
    }
    console.log("🔌 Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
  console.log(`📝 Posts endpoint: http://localhost:${PORT}/api/posts`);
  console.log(`CORS allowed origins: any .onrender.com and localhost`);
});
