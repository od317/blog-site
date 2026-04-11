const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const profileController = require("../controllers/profile.controller");

// Public routes (anyone can view profile)
router.get("/:username", profileController.getProfile);
router.get("/:username/posts", profileController.getUserPosts);

// Protected routes (require authentication)
router.use(authMiddleware);
router.put("/update", profileController.updateProfile);
router.post("/:userId/follow", profileController.followUser);
router.delete("/:userId/follow", profileController.unfollowUser);

module.exports = router;
