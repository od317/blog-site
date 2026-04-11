const User = require("../models/User");
const { calculateReadingTime } = require("../utils/readingTime");

// Get user profile with stats
exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;

    // First find user by username
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get full profile with stats
    const profile = await User.getProfile(user.id);

    // Check if current user is following this profile
    let isFollowing = false;
    if (req.userId) {
      const followCheck = await pool.query(
        "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
        [req.userId, user.id],
      );
      isFollowing = followCheck.rows.length > 0;
    }

    res.json({
      ...profile,
      isFollowing,
      isOwnProfile: req.userId === user.id,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

// Get user's posts (paginated)
exports.getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Find user by username
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await User.getUserPosts(
      user.id,
      parseInt(limit),
      parseInt(offset),
      req.userId || null,
    );

    const total = await User.getUserPostsCount(user.id);

    // Add reading time to each post
    const postsWithReadingTime = posts.map((post) => ({
      ...post,
      readingTime: calculateReadingTime(post.content || ""),
    }));

    res.json({
      posts: postsWithReadingTime,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + posts.length,
      },
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ error: "Failed to get user posts" });
  }
};

// Update profile (bio, full_name)
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, bio } = req.body;
    const userId = req.userId;

    const query = `
      UPDATE users 
      SET full_name = $1, bio = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, email, full_name, bio, avatar_url
    `;

    const result = await pool.query(query, [full_name, bio, userId]);

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    if (userId === followerId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    const checkQuery = `
      SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [followerId, userId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Add follow
    await pool.query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)",
      [followerId, userId],
    );

    // Update counts
    await pool.query(
      "UPDATE users SET followers_count = followers_count + 1 WHERE id = $1",
      [userId],
    );
    await pool.query(
      "UPDATE users SET following_count = following_count + 1 WHERE id = $1",
      [followerId],
    );

    res.json({ message: "User followed successfully" });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.userId;

    // Remove follow
    const result = await pool.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING id",
      [followerId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Not following this user" });
    }

    // Update counts
    await pool.query(
      "UPDATE users SET followers_count = followers_count - 1 WHERE id = $1",
      [userId],
    );
    await pool.query(
      "UPDATE users SET following_count = following_count - 1 WHERE id = $1",
      [followerId],
    );

    res.json({ message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};
