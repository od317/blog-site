const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = await Comment.create({
      content: content.trim(),
      post_id: postId,
      user_id: req.userId,
    });

    // Get comment with user info
    const [fullComment] = await Comment.findByPost(postId, 1, 0);

    // Emit to all clients in the post room
    const io = req.app.get("io");
    io.to(`post-${postId}`).emit("new-comment", {
      ...fullComment,
      post_id: postId,
    });

    res.status(201).json(fullComment);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.delete(id, req.userId);

    if (!comment) {
      return res
        .status(404)
        .json({ error: "Comment not found or unauthorized" });
    }

    const io = req.app.get("io");
    io.emit("comment-deleted", { id });

    res.status(204).send();
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
    res.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};
