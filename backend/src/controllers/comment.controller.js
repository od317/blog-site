const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

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

// Get replies for a comment - PUBLIC
exports.getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const replies = await Comment.getReplies(
      commentId,
      parseInt(limit),
      parseInt(offset),
    );
    const replyCount = await Comment.getReplyCount(commentId);

    res.json({ replies, replyCount });
  } catch (error) {
    console.error("Get replies error:", error);
    res.status(500).json({ error: "Failed to fetch replies" });
  }
};

// Add comment or reply - REQUIRES AUTH
exports.addComment = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be logged in to add a comment",
    });
  }

  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // If parentId is provided, verify the parent comment exists
    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
    }

    const comment = await Comment.create({
      content: content.trim(),
      post_id: postId,
      user_id: req.userId,
      parent_id: parentId || null,
    });

    const fullComment = await Comment.findById(comment.id);
    const commentCount = await Comment.getCount(postId);

    const io = req.app.get("io");
    const currentUserId = req.userId;

    // Emit to post room for new comment or reply
    io.to(`post-${postId}`).emit(parentId ? "new-reply" : "new-comment", {
      postId,
      comment: fullComment,
      commentCount,
      parentId,
    });

    // 🔔 CREATE NOTIFICATIONS (only increment unread count, don't show full notification yet)

    // 1. Notify the post owner (if someone commented on their post and it's not their own comment)
    if (post.user_id !== currentUserId) {
      await Notification.create({
        userId: post.user_id,
        type: parentId ? "reply_on_post" : "comment",
        actorId: currentUserId,
        postId: postId,
        commentId: comment.id, // ✅ Add comment ID
      });

      io.to(`user:${post.user_id}`).emit("new-notification", {
        type: parentId ? "reply_on_post" : "comment",
        postId: postId,
        postTitle: post.title,
        commentId: comment.id, // ✅ Add comment ID
      });
    }

    // 2. If it's a reply, notify the parent comment author
    if (parentId && parentComment && parentComment.user_id !== currentUserId) {
      if (parentComment.user_id !== post.user_id) {
        await Notification.create({
          userId: parentComment.user_id,
          type: "reply",
          actorId: currentUserId,
          postId: postId,
          commentId: comment.id, // ✅ Add comment ID
        });

        io.to(`user:${parentComment.user_id}`).emit("new-notification", {
          type: "reply",
          postId: postId,
          postTitle: post.title,
          commentId: comment.id, // ✅ Add comment ID
          parentCommentId: parentId,
        });
      }
    }

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

// Delete comment - REQUIRES AUTH (with cascade handling)
// Delete comment - REQUIRES AUTH (with cascade handling)
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
    const post = await Post.findById(postId);
    const parentId = comment.parent_id;

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
      parentId,
    });

    // ✅ Delete notifications related to this comment
    // 1. Delete the notification for the post owner (if this was a comment on their post)
    await Notification.deleteByPostAndComment(postId, userId, 'comment');
    
    // 2. If this was a reply, delete the notification for the parent comment author
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (parentComment && parentComment.user_id !== userId) {
        await Notification.deleteByPostAndComment(postId, userId, 'reply', parentId);
      }
    }

    // 3. Notify users to remove notifications from UI
    io.to(`user:${post.user_id}`).emit("notification-removed", {
      type: parentId ? "reply_on_post" : "comment",
      postId: postId,
      commentId: id,
      actorId: userId,
    });

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (parentComment && parentComment.user_id !== userId) {
        io.to(`user:${parentComment.user_id}`).emit("notification-removed", {
          type: "reply",
          postId: postId,
          commentId: id,
          parentCommentId: parentId,
          actorId: userId,
        });
      }
    }

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

    res.json({ success: true, comment: fullComment });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
};

// Get nested comments with replies - PUBLIC
exports.getNestedComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Get all comments for this post
    const allComments = await Comment.findByPostWithReplies(
      postId,
      parseInt(limit),
      parseInt(offset),
    );

    // Build nested structure
    const commentMap = new Map();
    const nestedComments = [];

    // First, create a map of all comments
    allComments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Then, build the tree
    allComments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        const parent = commentMap.get(comment.parent_id);
        parent.replies.push(commentWithReplies);
      } else if (!comment.parent_id) {
        nestedComments.push(commentWithReplies);
      }
    });

    res.json({
      comments: nestedComments,
      totalCount: allComments.length,
    });
  } catch (error) {
    console.error("Get nested comments error:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};
