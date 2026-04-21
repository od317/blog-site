const Notification = require("../models/Notification");

// Get grouped user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 220, offset = 0 } = req.query;

    const notifications = await Notification.getGroupedByUser(
      userId,
      parseInt(limit),
      parseInt(offset),
    );
    const unreadCount = await Notification.getUnreadCount(userId);
    console.log(notifications);
    console.log(unreadCount);
    res.json({
      notifications,
      unreadCount,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: notifications.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
};

// Get unread count only
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const count = await Notification.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

// Mark notifications for a post as read
exports.markPostAsRead = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type } = req.query; // Optional: mark only specific type
    const userId = req.userId;

    await Notification.markPostNotificationsAsRead(userId, postId, type);

    res.json({ success: true });
  } catch (error) {
    console.error("Mark post as read error:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    await Notification.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
};
