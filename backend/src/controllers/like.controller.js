const Like = require("../models/Like");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const pool = require("../config/database");

exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if already liked
    const alreadyLiked = await Like.hasLiked(postId, userId);

    if (alreadyLiked) {
      return res.status(400).json({ error: "Post already liked" });
    }

    // Add like
    const like = await Like.create(postId, userId);
    const likeCount = await Like.getCount(postId);

    // ✅ Create notification (don't notify yourself)
    // Add this inside likePost, after adding the like, before emitting events:

    // Create notification for post owner (don't notify yourself)
    if (post.user_id !== userId) {
      console.log(
        `📢 Creating like notification: User ${userId} liked post ${postId} owned by ${post.user_id}`,
      );

      await Notification.create({
        userId: post.user_id,
        type: "like",
        actorId: userId,
        postId: postId,
      });

      // Emit real-time notification
      const io = req.app.get("io");
      io.to(`user:${post.user_id}`).emit("new-notification", {
        type: "like",
        postId: postId,
        postTitle: post.title,
      });

      console.log(`📢 Notification emitted to user:${post.user_id}`);
    }

    // Get the io instance for like updates
    const io = req.app.get("io");
    io.to(`post-${postId}`).emit("like-updated", {
      postId,
      likeCount,
      userId,
      action: "liked",
    });

    // Also emit to global feed
    io.to("global-feed").emit("feed-like-updated", {
      postId,
      likeCount,
      userId,
      action: "liked",
    });

    console.log(
      `📢 Like added: post ${postId} by user ${userId}, total: ${likeCount}`,
    );

    res.json({
      success: true,
      liked: true,
      likeCount,
      message: "Post liked",
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ error: "Failed to like post" });
  }
};

// Unlike a post - REQUIRES AUTH
exports.unlikePost = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be logged in to unlike a post",
    });
  }

  try {
    const { postId } = req.params;
    const userId = req.userId;

    const removed = await Like.delete(postId, userId);
    if (!removed) {
      return res.status(400).json({ error: "Post not liked yet" });
    }

    const likeCount = await Like.getCount(postId);

    const io = req.app.get("io");

    io.to(`post-${postId}`).emit("like-updated", {
      postId,
      likeCount,
      userId,
      action: "unliked",
    });

    io.to("global-feed").emit("feed-like-updated", {
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
    });
  } catch (error) {
    console.error("Unlike post error:", error);
    res.status(500).json({ error: "Failed to unlike post" });
  }
};

// Check like status (ADD THIS)
exports.checkLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    // 📋 Log request details
    console.log("\n🔍 ========== CHECK LIKE REQUEST ==========");
    console.log("📌 Timestamp:", new Date().toISOString());
    console.log("📌 Post ID:", postId);
    console.log("📌 User ID from request:", userId);
    console.log("📌 User ID type:", typeof userId);
    console.log("📌 Is user authenticated:", !!userId);

    // 📋 Log cookies (if any)
    console.log("📌 Cookies present:", {
      hasAccessToken: !!req.cookies?.accessToken,
      hasRefreshToken: !!req.cookies?.refreshToken,
      allCookieNames: req.cookies ? Object.keys(req.cookies) : [],
    });

    // 📋 Log headers
    console.log("📌 Authorization header:", {
      present: !!req.headers?.authorization,
      preview: req.headers?.authorization
        ? req.headers.authorization.substring(0, 50) + "..."
        : "none",
    });

    // Check like status
    const hasLiked = await Like.hasLiked(postId, userId);
    const likeCount = await Like.getCount(postId);

    // 📋 Log results
    console.log("📊 Like Status Result:");
    console.log("   - hasLiked:", hasLiked);
    console.log("   - likeCount:", likeCount);
    console.log("   - postId:", postId);
    console.log("   - userId:", userId);
    console.log("🔍 ========== END CHECK LIKE ==========\n");

    res.json({ hasLiked, likeCount });
  } catch (error) {
    console.error("❌ Check like error:", error);
    console.error("❌ Error stack:", error.stack);
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
