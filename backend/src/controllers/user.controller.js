const User = require("../models/User");
const Follow = require("../models/Follow");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if current user follows this profile
    let isFollowing = false;
    if (req.userId) {
      isFollowing = await Follow.checkFollow(req.userId, user.id);
    }

    res.json({ ...user, isFollowing });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, bio, avatar_url } = req.body;
    const user = await User.updateProfile(req.userId, {
      full_name,
      bio,
      avatar_url,
    });
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

exports.follow = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.userId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    await User.follow(req.userId, userId);
    res.json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
};

exports.unfollow = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.unfollow(req.userId, userId);
    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const followers = await Follow.getFollowers(userId, limit, offset);
    res.json(followers);
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Failed to get followers" });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const following = await Follow.getFollowing(userId, limit, offset);
    res.json(following);
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ error: "Failed to get following" });
  }
};
