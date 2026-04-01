// Basic socket setup for now - we'll expand this when we add posts and comments
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Authenticate socket connection
    socket.on("authenticate", (token) => {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.join(`user:${decoded.id}`);
        console.log(`✅ User ${decoded.id} authenticated on socket`);
      } catch (error) {
        console.log("❌ Socket authentication failed");
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });
};
