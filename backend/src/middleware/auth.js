const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log("🔑 Auth: No token found");
      req.userId = null;
      return next();
    }

    console.log("🔑 Auth: Token found, verifying...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔑 Auth: Decoded userId:", decoded.id);

    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("🔑 Auth: User not found");
      req.userId = null;
      return next();
    }

    req.user = user;
    req.userId = user.id;
    console.log("🔑 Auth: userId set to:", req.userId);
    next();
  } catch (error) {
    console.log("🔑 Auth error:", error.message);
    req.userId = null;
    next();
  }
};

module.exports = authMiddleware;
