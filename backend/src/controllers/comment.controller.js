const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    console.log("💬 Adding comment to post:", postId);
    console.log("💬 User ID:", userId);
    console.log("💬 Content:", content);

    // ✅ Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Create comment with user_id
    const comment = await Comment.create({
      content: content.trim(),
      post_id: postId,
      user_id: userId, // ✅ Make sure this is not null
    });

    // Get full comment with user info
    const fullComment = await Comment.findById(comment.id);

    // Get updated comment count
    const commentCount = await Comment.getCount(postId);

    console.log("💬 Comment added:", fullComment);

    // Get io instance and emit real-time event
    const io = req.app.get("io");

    io.to(`post-${postId}`).emit("new-comment", {
      comment: fullComment,
      postId,
      commentCount,
    });

    res.status(201).json({
      success: true,
      comment: fullComment,
      commentCount,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get comment to find post_id
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const postId = comment.post_id;

    // Delete comment
    const deleted = await Comment.delete(id, userId);

    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Comment not found or unauthorized" });
    }

    // Get updated comment count
    const commentCount = await Comment.getCount(postId);

    // Emit real-time update
    const io = req.app.get("io");
    io.to(`post-${postId}`).emit("comment-deleted", {
      commentId: id,
      postId,
      commentCount,
    });

    io.emit("feed-comment-updated", {
      postId,
      commentCount,
    });

    res.json({
      success: true,
      message: "Comment deleted",
      commentCount,
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

// Get comments for a post
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = await Comment.findByPost(
      postId,
      parseInt(limit),
      parseInt(offset),
    );
    const total = await Comment.getCount(postId);

    res.json({
      comments,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + comments.length,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};
