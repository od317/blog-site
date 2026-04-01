const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    console.log("\n=== AUTH MIDDLEWARE ===");
    console.log("Headers:", req.headers);
    console.log("Body before auth:", req.body);

    const token = req.headers.authorization?.replace("Bearer ", "");
    console.log("Token present:", !!token);

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    req.userId = user.id;
    console.log("Auth successful for user:", user.id);
    console.log("Body after auth:", req.body);
    next();
  } catch (error) {
    console.error("Auth error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = authMiddleware;
