const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ========== CORS CONFIGURATION ==========
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://blog-frontend-i0w1.onrender.com",
  /\.onrender\.com$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some((pattern) => {
      if (pattern instanceof RegExp) return pattern.test(origin);
      return pattern === origin;
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error(`CORS policy does not allow ${origin}`));
    }
  },
  credentials: true,
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
app.use(cookieParser());

// ========== REMOVED GLOBAL BODY PARSERS ==========
// No more app.use(express.json()) here

// ========== REQUEST LOGGING ==========
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
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

app.set("io", io);

// ========== ROUTES ==========
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/posts.routes");
const adminRoutes = require("./routes/admin.routes");
const likeRoutes = require("./routes/likes.routes");
const profileRoutes = require("./routes/profile.routes");
const migrateRoutes = require("./routes/migrate.routes");

app.use("/api/migrate", migrateRoutes);
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

// ========== ACTIVE READERS TRACKING ==========
const activeReaders = new Map();

// ========== SOCKET.IO CONNECTION HANDLING ==========
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);
  console.log("🔌 Total connected clients:", io.engine.clientsCount);

  let currentPostId = null;

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
      socket.join("global-feed");
      console.log(`✅ User ${socket.userId} subscribed to global feed`);
      socket.emit("subscribed", { channel: "global-feed" });
    }
  });

  socket.on("unsubscribe-feed", () => {
    if (socket.userId) {
      socket.leave("global-feed");
      console.log(`User ${socket.userId} unsubscribed from global feed`);
    }
  });

  socket.on("join-post", (postId) => {
    if (currentPostId) {
      const previousReaders = activeReaders.get(currentPostId);
      if (previousReaders) {
        previousReaders.delete(socket.id);
        if (previousReaders.size === 0) {
          activeReaders.delete(currentPostId);
        }
      }
      socket.leave(`post-${currentPostId}`);
      const newCount = previousReaders?.size || 0;
      io.to(`post-${currentPostId}`).emit("readers-count-updated", {
        postId: currentPostId,
        count: newCount,
      });
    }

    currentPostId = postId;
    socket.join(`post-${postId}`);

    if (!activeReaders.has(postId)) {
      activeReaders.set(postId, new Set());
    }
    activeReaders.get(postId).add(socket.id);

    const readerCount = activeReaders.get(postId).size;
    console.log(
      `📖 User joined post ${postId}, active readers: ${readerCount}`,
    );

    io.to(`post-${postId}`).emit("readers-count-updated", {
      postId,
      count: readerCount,
    });

    socket.emit("post-joined", { postId, readerCount });
  });

  socket.on("leave-post", (postId) => {
    if (currentPostId === postId) {
      const readers = activeReaders.get(postId);
      if (readers) {
        readers.delete(socket.id);
        const readerCount = readers.size;
        if (readerCount === 0) {
          activeReaders.delete(postId);
        }
        console.log(
          `📖 User left post ${postId}, active readers: ${readerCount}`,
        );
        io.to(`post-${postId}`).emit("readers-count-updated", {
          postId,
          count: readerCount,
        });
      }
      socket.leave(`post-${postId}`);
      currentPostId = null;
    }
  });

  socket.on("join-profile", (profileUserId) => {
    if (socket.currentProfileRoom) {
      socket.leave(socket.currentProfileRoom);
    }
    socket.currentProfileRoom = `profile-${profileUserId}`;
    socket.join(socket.currentProfileRoom);
    console.log(`📖 Socket joined profile room: profile-${profileUserId}`);
  });

  socket.on("leave-profile", (profileUserId) => {
    const room = `profile-${profileUserId}`;
    socket.leave(room);
    if (socket.currentProfileRoom === room) {
      socket.currentProfileRoom = null;
    }
    console.log(`📖 Socket left profile room: ${room}`);
  });

  socket.on("disconnect", () => {
    if (currentPostId) {
      const readers = activeReaders.get(currentPostId);
      if (readers) {
        readers.delete(socket.id);
        const readerCount = readers.size;
        if (readerCount === 0) {
          activeReaders.delete(currentPostId);
        }
        io.to(`post-${currentPostId}`).emit("readers-count-updated", {
          postId: currentPostId,
          count: readerCount,
        });
      }
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
