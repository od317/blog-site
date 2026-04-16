const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth"); // ✅ Import auth middleware
const profileController = require("../controllers/profile.controller");

// ✅ Apply auth middleware to ALL routes (sets req.userId for all requests)
router.use(authMiddleware);

// Public routes (anyone can view profile)
router.get("/:username", profileController.getProfile);
router.get("/:username/posts", profileController.getUserPosts);

// Protected routes (require authentication)
router.put("/update", profileController.updateProfile);
router.post("/:userId/follow", profileController.followUser);
router.delete("/:userId/follow", profileController.unfollowUser);

module.exports = router;
