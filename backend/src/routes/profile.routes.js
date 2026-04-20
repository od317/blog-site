const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");
const profileController = require("../controllers/profile.controller");

// Apply auth middleware to all routes
router.use(authMiddleware);

// JSON routes - apply express.json
router.get("/:username", profileController.getProfile);
router.get("/:username/posts", profileController.getUserPosts);
router.put("/update", express.json(), profileController.updateProfile);

// File upload route - NO JSON parser
router.post(
  "/avatar",
  uploadAvatar.single("avatar"),
  profileController.uploadAvatar,
);
router.delete("/avatar", profileController.deleteAvatar);

// Follow routes - JSON
router.post("/:userId/follow", express.json(), profileController.followUser);
router.delete(
  "/:userId/follow",
  express.json(),
  profileController.unfollowUser,
);

module.exports = router;
