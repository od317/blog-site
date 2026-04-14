// Middleware to require authentication for write operations
const requireAuth = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be logged in to perform this action",
    });
  }
  next();
};

module.exports = requireAuth;
