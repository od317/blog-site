const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require("../models/Like");

// Get all posts
// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    // Pass req.userId (current user) to check if they liked each post
    const posts = await Post.findAll(
      parseInt(limit),
      parseInt(offset),
      req.userId || null,
    );
    res.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id, req.userId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Get comments
    const comments = await Comment.findByPost(id);

    res.json({
      ...post,
      comments,
    });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

// Create post
// Create post
exports.createPost = async (req, res) => {
  try {
    console.log("Create post request body:", req.body); // Debug log
    console.log("User ID:", req.userId); // Debug log

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

    // Get the io instance
    const io = req.app.get("io");

    // Emit to ALL connected clients (for feed)
    io.emit("new-post", fullPost);

    // Also emit to specific user room (for notifications)
    io.emit("feed:new-post", fullPost);

    console.log(`📢 New post created by ${req.userId}, emitted to all clients`);

    res.status(201).json(fullPost);
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

    // Emit update to all clients
    const io = req.app.get("io");
    io.emit("post-updated", fullPost);

    res.json(fullPost);
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
    );
    res.json(posts);
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};
