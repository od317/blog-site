const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Get comments for a post - PUBLIC
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = await Comment.findByPost(
      postId,
      parseInt(limit),
      parseInt(offset),
    );
    const commentCount = await Comment.getCount(postId);

    res.json({ comments, commentCount });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// Add comment - REQUIRES AUTH
exports.addComment = async (req, res) => {
  // Check authentication first
  if (!req.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be logged in to add a comment",
    });
  }

  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = await Comment.create({
      content: content.trim(),
      post_id: postId,
      user_id: req.userId,
    });

    const fullComment = await Comment.findById(comment.id);
    const commentCount = await Comment.getCount(postId);

    const io = req.app.get("io");
    io.to(`post-${postId}`).emit("new-comment", {
      postId,
      comment: fullComment,
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

// Delete comment - REQUIRES AUTH
exports.deleteComment = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be logged in to delete a comment",
    });
  }

  try {
    const { id } = req.params;
    const userId = req.userId;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const postId = comment.post_id;

    const deleted = await Comment.delete(id, userId);

    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Comment not found or unauthorized" });
    }

    const commentCount = await Comment.getCount(postId);

    const io = req.app.get("io");
    io.to(`post-${postId}`).emit("comment-deleted", {
      commentId: id,
      postId,
      commentCount,
    });

    res.json({ success: true, commentCount });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

// Update comment - REQUIRES AUTH
exports.updateComment = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be logged in to update a comment",
    });
  }

  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const updated = await Comment.update(id, userId, content.trim());

    if (!updated) {
      return res
        .status(404)
        .json({ error: "Comment not found or unauthorized" });
    }

    const fullComment = await Comment.findById(id);
    const commentCount = await Comment.getCount(fullComment.post_id);

    const io = req.app.get("io");
    io.to(`post-${fullComment.post_id}`).emit("comment-updated", {
      comment: fullComment,
      postId: fullComment.post_id,
      commentCount,
    });
    console.log(
      `📢 Comment updated event emitted to post-${fullComment.post_id}`,
    );
    console.log("Event data:", {
      comment: fullComment,
      postId: fullComment.post_id,
      commentCount,
    });
    res.json({ success: true, comment: fullComment });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
};
