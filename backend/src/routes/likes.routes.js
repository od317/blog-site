const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const likeController = require("../controllers/like.controller");
router.use(express.json());

// All like routes require authentication
router.use(authMiddleware);

// Like/Unlike routes
router.post("/:postId/like", likeController.likePost);
router.delete("/:postId/like", likeController.unlikePost);
router.get("/:postId/like", likeController.checkLike);

// Get user's liked posts
router.get("/posts", likeController.getLikedPosts); // New route
router.post("/check", likeController.checkLikedPosts); // Bulk check

// Bulk likes for feed optimization
router.post("/bulk", likeController.getBulkLikes);

module.exports = router;
