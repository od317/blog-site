const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const { calculateReadingTime } = require("../utils/readingTime");

// Get all posts (for homepage feed)
exports.getAllPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const posts = await Post.findAll(
      parseInt(limit),
      parseInt(offset),
      req.userId || null,
    );

    // Add reading time to each post
    const postsWithReadingTime = posts.map((post) => ({
      ...post,
      readingTime: calculateReadingTime(post.content || ""),
    }));

    res.json(postsWithReadingTime);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// Get single post (for full post page)
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id, req.userId || null);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await Comment.findByPost(id);

    // Add reading time
    const postWithReadingTime = {
      ...post,
      readingTime: calculateReadingTime(post.content || ""),
    };

    res.json({
      ...postWithReadingTime,
      comments,
    });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

// Create post
exports.createPost = async (req, res) => {
  try {
    console.log("Create post request body:", req.body);
    console.log("User ID:", req.userId);

    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      user_id: req.userId,
    });

    // Get the complete post with user info
    const fullPost = await Post.findById(post.id, req.userId);

    // Add reading time
    const postWithReadingTime = {
      ...fullPost,
      readingTime: calculateReadingTime(fullPost.content || ""),
    };

    // Get the io instance
    const io = req.app.get("io");

    // Emit to ALL connected clients (for feed)
    io.emit("new-post", postWithReadingTime);
    io.emit("feed:new-post", postWithReadingTime);

    console.log(`📢 New post created by ${req.userId}, emitted to all clients`);

    res.status(201).json(postWithReadingTime);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const post = await Post.update(id, req.userId, { title, content });

    if (!post) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    const fullPost = await Post.findById(id, req.userId);
    const postWithReadingTime = {
      ...fullPost,
      readingTime: calculateReadingTime(fullPost.content || ""),
    };

    // Emit update to all clients
    const io = req.app.get("io");
    io.emit("post-updated", postWithReadingTime);
    io.to(`post-${id}`).emit("post-updated", postWithReadingTime);

    res.json(postWithReadingTime);
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.delete(id, req.userId);

    if (!post) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    // Emit deletion to all clients
    const io = req.app.get("io");
    io.emit("post-deleted", { id });
    io.to(`post-${id}`).emit("post-deleted", { id });

    res.status(204).send();
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

// Get user posts
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await Post.findByUser(
      userId,
      parseInt(limit),
      parseInt(offset),
      req.userId || null,
    );

    // Add reading time to each post
    const postsWithReadingTime = posts.map((post) => ({
      ...post,
      readingTime: calculateReadingTime(post.content || ""),
    }));

    res.json(postsWithReadingTime);
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};

exports.getActiveReaders = async (req, res) => {
  try {
    const { id } = req.params;

    // This would need access to the activeReaders Map
    // For now, we'll rely on WebSocket events only
    // The active readers count is managed in memory

    res.json({
      postId: id,
      // Note: This is a simplified version
      // In production, you might want to store this in Redis
    });
  } catch (error) {
    console.error("Get active readers error:", error);
    res.status(500).json({ error: "Failed to get active readers" });
  }
};
