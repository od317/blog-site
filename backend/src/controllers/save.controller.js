// controllers/save.controller.js
const SavedPost = require("../models/SavedPost");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

// Save a post
exports.savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const alreadySaved = await SavedPost.hasSaved(postId, userId);
    if (alreadySaved) {
      return res.status(400).json({ error: "Post already saved" });
    }

    await SavedPost.save(postId, userId);
    const savedCount = await SavedPost.getSavedPostsCount(userId);

    // Create notification for post owner (don't notify yourself)
    if (post.user_id !== userId) {
      console.log(
        `📢 Creating save notification: User ${userId} saved post ${postId} owned by ${post.user_id}`,
      );

      await Notification.create({
        userId: post.user_id,
        type: "save",
        actorId: userId,
        postId: postId,
        commentId: null,
      });

      // Emit real-time notification
      const io = req.app.get("io");
      io.to(`user:${post.user_id}`).emit("new-notification", {
        type: "save",
        postId: postId,
        postTitle: post.title,
      });

      console.log(`📢 Notification emitted to user:${post.user_id}`);
    }

    res.json({
      success: true,
      saved: true,
      savedCount,
      message: "Post saved",
    });
  } catch (error) {
    console.error("Save post error:", error);
    res.status(500).json({ error: "Failed to save post" });
  }
};

// Unsave a post
exports.unsavePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    // Get post info first (to know the owner)
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const removed = await SavedPost.unsave(postId, userId);
    if (!removed) {
      return res.status(400).json({ error: "Post not saved" });
    }

    const savedCount = await SavedPost.getSavedPostsCount(userId);

    // ✅ Remove the save notification for the post owner
    const io = req.app.get("io");

    // Delete the save notification from database
    await Notification.deleteByPostAndActor(postId, userId);

    // Notify the post owner to remove the notification from UI
    if (post.user_id !== userId) {
      io.to(`user:${post.user_id}`).emit("notification-removed", {
        type: "save",
        postId: postId,
        actorId: userId,
      });
    }

    console.log(`📢 Save removed: post ${postId} by user ${userId}`);

    res.json({
      success: true,
      saved: false,
      savedCount,
      message: "Post unsaved",
    });
  } catch (error) {
    console.error("Unsave post error:", error);
    res.status(500).json({ error: "Failed to unsave post" });
  }
};

// Check if user saved a post
exports.checkSave = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.json({ hasSaved: false });
    }

    const hasSaved = await SavedPost.hasSaved(postId, userId);
    res.json({ hasSaved });
  } catch (error) {
    console.error("Check save error:", error);
    res.status(500).json({ error: "Failed to check save status" });
  }
};

// Get user's saved posts
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await SavedPost.getSavedPosts(
      userId,
      parseInt(limit),
      parseInt(offset),
    );

    const total = await SavedPost.getSavedPostsCount(userId);

    res.json({
      posts,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + posts.length,
      },
    });
  } catch (error) {
    console.error("Get saved posts error:", error);
    res.status(500).json({ error: "Failed to get saved posts" });
  }
};
