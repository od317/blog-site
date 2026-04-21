const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const notificationController = require("../controllers/notification.controller");

// All notification routes require authentication
router.use(authMiddleware);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/posts/:postId/read", notificationController.markPostAsRead);
router.put("/read-all", notificationController.markAllAsRead);

module.exports = router;
