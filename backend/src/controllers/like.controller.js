const Like = require("../models/Like");
const Post = require("../models/Post");

// Like a post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    console.log("🔥 LIKE POST - Start");
    console.log("🔥 Post ID:", postId);
    console.log("🔥 User ID:", userId);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const alreadyLiked = await Like.hasLiked(postId, userId);
    if (alreadyLiked) {
      return res.status(400).json({ error: "Post already liked" });
    }

    await Like.create(postId, userId);
    const likeCount = await Like.getCount(postId);

    console.log("🔥 Like added! New count:", likeCount);

    const io = req.app.get("io");
    console.log("🔥 IO instance exists:", !!io);

    // Get all connected sockets for debugging
    const sockets = await io.fetchSockets();
    console.log("🔥 Connected sockets count:", sockets.length);

    // Emit to ALL connected sockets for testing
    io.emit("like-updated", {
      postId,
      likeCount,
      userId,
      action: "liked",
    });

    console.log(
      `📢 Like added: post ${postId} by user ${userId}, total: ${likeCount}`,
    );
    console.log("🔥 Event emitted to all clients");

    res.json({
      success: true,
      liked: true,
      likeCount,
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ error: "Failed to like post" });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  console.log("🔥 UNLIKE API CALLED");
  console.log("🔥 Post ID:", req.params.postId);
  console.log("🔥 User ID:", req.userId);

  try {
    const { postId } = req.params;
    const userId = req.userId;

    console.log("🔥 Checking if liked...");

    // Check if liked
    const hasLiked = await Like.hasLiked(postId, userId);
    if (!hasLiked) {
      console.log("🔥 Not liked yet!");
      return res.status(400).json({ error: "Post not liked yet" });
    }

    console.log("🔥 Removing like...");
    // Remove like
    const removed = await Like.delete(postId, userId);
    const likeCount = await Like.getCount(postId);

    console.log("🔥 Like removed! New count:", likeCount);

    // Get the io instance
    const io = req.app.get("io");
    console.log("🔥 IO instance:", io ? "exists" : "missing");

    // Emit to post room
    io.emit("like-updated", {
      postId,
      likeCount,
      userId,
      action: "unliked",
    });

    console.log(
      `📢 Like removed: post ${postId} by user ${userId}, total: ${likeCount}`,
    );

    res.json({
      success: true,
      liked: false,
      likeCount,
      message: "Post unliked",
    });
  } catch (error) {
    console.error("🔥 Unlike post error:", error);
    res.status(500).json({ error: "Failed to unlike post" });
  }
};

// Check like status (ADD THIS)
exports.checkLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const hasLiked = await Like.hasLiked(postId, userId);
    const likeCount = await Like.getCount(postId);

    res.json({ hasLiked, likeCount });
  } catch (error) {
    console.error("Check like error:", error);
    res.status(500).json({ error: "Failed to check like status" });
  }
};

// Get bulk likes (optional)
exports.getBulkLikes = async (req, res) => {
  try {
    const { postIds } = req.body;
    const userId = req.userId;

    if (!postIds || !postIds.length) {
      return res.json({ likeCounts: {}, userLikes: [] });
    }

    const { likeCounts, userLikes } = await Like.getBulkLikes(postIds, userId);

    res.json({
      likeCounts,
      userLikes: Array.from(userLikes),
    });
  } catch (error) {
    console.error("Get bulk likes error:", error);
    res.status(500).json({ error: "Failed to get likes" });
  }
};

exports.getLikedPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await Like.getLikedPosts(
      userId,
      parseInt(limit),
      parseInt(offset),
    );

    const total = await Like.getLikedPostsCount(userId);

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
    console.error("Get liked posts error:", error);
    res.status(500).json({ error: "Failed to get liked posts" });
  }
};

// Check if user has liked specific posts (bulk check)
exports.checkLikedPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const { postIds } = req.body;

    if (!postIds || !postIds.length) {
      return res.json({ liked: {} });
    }

    const query = `
      SELECT post_id 
      FROM likes 
      WHERE user_id = $1 AND post_id = ANY($2::uuid[])
    `;
    const result = await pool.query(query, [userId, postIds]);

    const liked = {};
    result.rows.forEach((row) => {
      liked[row.post_id] = true;
    });

    res.json({ liked });
  } catch (error) {
    console.error("Check liked posts error:", error);
    res.status(500).json({ error: "Failed to check liked posts" });
  }
};
