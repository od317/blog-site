const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const { calculateReadingTime } = require("../utils/readingTime");

// Get all posts (for homepage feed) - PUBLIC
exports.getAllPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const posts = await Post.findAll(
      parseInt(limit),
      parseInt(offset),
      req.userId || null,
    );

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

// Get single post (for full post page) - PUBLIC
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id, req.userId || null);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await Comment.findByPost(id);

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

// Create post - REQUIRES AUTH
exports.createPost = async (req, res) => {
  try {
    console.log("Create post request body:", req.body);
    console.log("Create post file:", req.file);
    console.log("User ID:", req.userId);

    const { title, content } = req.body;
    const image_url = req.file ? req.file.path : null;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      image_url,
      user_id: req.userId,
    });

    const fullPost = await Post.findById(post.id, req.userId);

    const postWithReadingTime = {
      ...fullPost,
      readingTime: calculateReadingTime(fullPost.content || ""),
    };

    const io = req.app.get("io");
    io.emit("new-post", postWithReadingTime);
    io.emit("feed:new-post", postWithReadingTime);

    console.log(
      `📢 New post created by ${req.userId}, image: ${image_url ? "yes" : "no"}`,
    );

    res.status(201).json(postWithReadingTime);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// Update post - REQUIRES AUTH
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing post to check current image
    const existingPost = await Post.findById(id, req.userId);
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Prepare update data
    let title = req.body.title;
    let content = req.body.content;
    let image_url = existingPost.image_url; // Keep existing image by default

    // Handle different cases
    if (req.file) {
      // New image uploaded
      image_url = req.file.path;
    } else if (req.body.removeImage === "true") {
      // Explicitly remove image
      image_url = null;
    }
    // Otherwise, keep existing image (no change)

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const post = await Post.update(id, req.userId, {
      title: title.trim(),
      content: content.trim(),
      image_url: image_url,
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    const fullPost = await Post.findById(id, req.userId);
    const postWithReadingTime = {
      ...fullPost,
      readingTime: calculateReadingTime(fullPost.content || ""),
    };

    const io = req.app.get("io");
    io.emit("post-updated", postWithReadingTime);
    io.to(`post-${id}`).emit("post-updated", postWithReadingTime);

    res.json(postWithReadingTime);
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
};

// Delete post - REQUIRES AUTH
exports.deletePost = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be logged in to delete a post",
    });
  }

  try {
    const { id } = req.params;
    const post = await Post.delete(id, req.userId);

    if (!post) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    const io = req.app.get("io");
    io.emit("post-deleted", { id });
    io.to(`post-${id}`).emit("post-deleted", { id });

    res.status(204).send();
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

// Get user posts - PUBLIC
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
    res.json({ postId: id });
  } catch (error) {
    console.error("Get active readers error:", error);
    res.status(500).json({ error: "Failed to get active readers" });
  }
};
