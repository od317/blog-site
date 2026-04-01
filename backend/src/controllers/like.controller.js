const Like = require("../models/Like");
const Post = require("../models/Post");

// Like a post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const like = await Like.create(postId, req.userId);
    const likeCount = await Like.getCount(postId);

    if (like) {
      // Emit real-time update
      const io = req.app.get("io");
      io.to(`post-${postId}`).emit("like-updated", {
        postId,
        likeCount,
        userId: req.userId,
        action: "liked",
      });
    }

    res.json({
      liked: !!like,
      likeCount,
      message: like ? "Post liked" : "Already liked",
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ error: "Failed to like post" });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const removed = await Like.delete(postId, req.userId);
    const likeCount = await Like.getCount(postId);

    if (removed) {
      // Emit real-time update
      const io = req.app.get("io");
      io.to(`post-${postId}`).emit("like-updated", {
        postId,
        likeCount,
        userId: req.userId,
        action: "unliked",
      });
    }

    res.json({
      liked: false,
      likeCount,
      message: removed ? "Post unliked" : "Already unliked",
    });
  } catch (error) {
    console.error("Unlike post error:", error);
    res.status(500).json({ error: "Failed to unlike post" });
  }
};

// Check if user liked post
exports.checkLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const hasLiked = await Like.hasLiked(postId, req.userId);
    const likeCount = await Like.getCount(postId);

    res.json({ hasLiked, likeCount });
  } catch (error) {
    console.error("Check like error:", error);
    res.status(500).json({ error: "Failed to check like status" });
  }
};
