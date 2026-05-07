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
const notificationRoutes = require("./routes/notification.routes");
const saveRoutes = require("./routes/saves.routes");

app.use("/api/saves", saveRoutes);
app.use("/api/migrate", migrateRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);

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
// ========== ACTIVE READERS TRACKING ==========
const activeReaders = new Map();
// Track which post each socket is currently in
const socketPostMap = new Map(); // socket.id -> postId

// ========== SOCKET.IO CONNECTION HANDLING ==========
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);
  console.log("🔌 Total connected clients:", io.engine.clientsCount);

  let currentPostId = null;

  // Check if this socket already has a post room (reconnection)
  const existingPostId = socketPostMap.get(socket.id);
  if (existingPostId) {
    console.log(
      `🔄 Socket ${socket.id} reconnected, was in post: ${existingPostId}`,
    );
    currentPostId = existingPostId;

    // Re-add to active readers
    if (!activeReaders.has(existingPostId)) {
      activeReaders.set(existingPostId, new Set());
    }
    activeReaders.get(existingPostId).add(socket.id);

    // Re-join the room
    socket.join(`post-${existingPostId}`);

    // Emit updated count
    const readerCount = activeReaders.get(existingPostId).size;
    console.log(
      `📖 Socket reconnected to post ${existingPostId}, readers: ${readerCount}`,
    );
    io.to(`post-${existingPostId}`).emit("readers-count-updated", {
      postId: existingPostId,
      count: readerCount,
    });
  }

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
    console.log(
      `🚪 [JOIN] Socket ${socket.id} joining post ${postId} | currentPostId=${currentPostId}`,
    );

    // If already in the same post, don't do anything
    if (currentPostId === postId) {
      console.log(
        `⚠️ [JOIN] Socket ${socket.id} already in post ${postId}, skipping`,
      );

      // Still emit current count to keep client in sync
      const currentCount = activeReaders.get(postId)?.size || 0;
      socket.emit("post-joined", { postId, readerCount: currentCount });
      return;
    }

    // Remove from previous post if any
    if (currentPostId) {
      console.log(
        `🚪 [LEAVE] Socket ${socket.id} leaving previous post ${currentPostId}`,
      );
      const previousReaders = activeReaders.get(currentPostId);
      if (previousReaders) {
        previousReaders.delete(socket.id);
        if (previousReaders.size === 0) {
          activeReaders.delete(currentPostId);
        }
      }
      socket.leave(`post-${currentPostId}`);

      // Emit updated count for old room AFTER removing
      const newCount = activeReaders.get(currentPostId)?.size || 0;
      console.log(
        `📢 [EMIT] readers-count-updated for old post ${currentPostId}: ${newCount}`,
      );
      io.to(`post-${currentPostId}`).emit("readers-count-updated", {
        postId: currentPostId,
        count: newCount,
      });
    }

    // Join new post
    currentPostId = postId;
    socketPostMap.set(socket.id, postId); // Track for reconnection
    socket.join(`post-${postId}`);

    if (!activeReaders.has(postId)) {
      activeReaders.set(postId, new Set());
    }
    activeReaders.get(postId).add(socket.id);

    const readerCount = activeReaders.get(postId).size;
    console.log(
      `📖 [JOIN] User joined post ${postId}, active readers: ${readerCount} | readers: ${[...activeReaders.get(postId)]}`,
    );

    // Emit to ALL in room (including the new joiner)
    console.log(
      `📢 [EMIT] readers-count-updated for new post ${postId}: ${readerCount}`,
    );
    io.to(`post-${postId}`).emit("readers-count-updated", {
      postId,
      count: readerCount,
    });

    socket.emit("post-joined", { postId, readerCount });
  });

  socket.on("leave-post", (postId) => {
    console.log(
      `🚪 [LEAVE] Socket ${socket.id} leaving post ${postId} | currentPostId=${currentPostId}`,
    );

    if (currentPostId === postId) {
      const readers = activeReaders.get(postId);
      if (readers) {
        readers.delete(socket.id);
        const readerCount = readers.size;

        console.log(
          `📖 [LEAVE] User left post ${postId}, remaining readers: ${readerCount}`,
        );

        if (readerCount === 0) {
          activeReaders.delete(postId);
        }

        console.log(
          `📢 [EMIT] readers-count-updated after leave: ${readerCount}`,
        );
        io.to(`post-${postId}`).emit("readers-count-updated", {
          postId,
          count: readerCount,
        });
      }
      socket.leave(`post-${postId}`);
      socketPostMap.delete(socket.id); // Remove from tracking
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

  socket.on("disconnect", (reason) => {
    console.log(
      `🔌 [DISCONNECT] Socket ${socket.id} disconnected. Reason: ${reason} | was in post: ${currentPostId}`,
    );

    if (currentPostId) {
      const readers = activeReaders.get(currentPostId);
      if (readers) {
        readers.delete(socket.id);
        const readerCount = readers.size;

        console.log(
          `📖 [DISCONNECT] Removed from post ${currentPostId}, remaining readers: ${readerCount}`,
        );

        if (readerCount === 0) {
          activeReaders.delete(currentPostId);
        }

        console.log(
          `📢 [EMIT] readers-count-updated after disconnect: ${readerCount}`,
        );
        io.to(`post-${currentPostId}`).emit("readers-count-updated", {
          postId: currentPostId,
          count: readerCount,
        });
      }
    }
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
