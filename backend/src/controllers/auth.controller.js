const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { sendVerificationEmail } = require("../utils/email");
const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokens");

// Register new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const user = await User.create({
      username,
      email,
      password,
      full_name,
    });

    // Auto-verify users (no email verification needed)
    await User.setVerified(user.id, true);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);
    await User.saveRefreshToken(user.id, refreshToken, refreshExpires);

    // Return tokens in response body (NO COOKIES!)
    res.status(201).json({
      message: "Registration successful! You are now logged in.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        is_verified: true,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// Login user - returns tokens in response body
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to database
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);
    await User.saveRefreshToken(user.id, refreshToken, refreshExpires);

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      is_verified: user.is_verified,
      followers_count: user.followers_count,
      following_count: user.following_count,
      created_at: user.created_at,
    };

    // Return tokens in response body (NO COOKIES!)
    res.json({
      message: "Login successful",
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

// Validate token endpoint
exports.validateToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        valid: false,
        error: "User not found",
      });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified,
      },
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(401).json({
      valid: false,
      error: "Invalid token",
    });
  }
};

// Refresh token endpoint - receives refresh token in request body
exports.refreshToken = async (req, res) => {
  try {
    console.log("=== REFRESH TOKEN DEBUG ===");
    console.log("Request body:", req.body);

    // Get refresh token from request body (not cookie!)
    const { refreshToken: oldRefreshToken } = req.body;

    if (!oldRefreshToken) {
      return res.status(401).json({
        success: false,
        error: "No refresh token provided",
      });
    }

    console.log("✅ Refresh token found in request body");

    // Verify the old refresh token
    const decoded = verifyRefreshToken(oldRefreshToken);
    if (!decoded) {
      console.log("❌ Refresh token verification failed");
      return res.status(401).json({
        success: false,
        error: "Invalid or expired refresh token",
      });
    }

    console.log("✅ Token verified, user ID:", decoded.id);

    // Find user by ID
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    console.log("✅ User found:", user.id);

    // Check if the refresh token matches and is not expired
    if (user.refresh_token !== oldRefreshToken) {
      console.log("❌ Refresh token mismatch");
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    if (user.refresh_token_expires < new Date()) {
      console.log("❌ Refresh token expired in DB");
      return res.status(401).json({
        success: false,
        error: "Refresh token expired",
      });
    }

    console.log("✅ Refresh token valid");

    // Generate NEW tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update database with the NEW refresh token
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);
    await User.saveRefreshToken(user.id, newRefreshToken, refreshExpires);

    console.log("✅ New tokens generated and saved");

    // Return new tokens in response body (NO COOKIES!)
    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const userId = req.userId;

    if (userId) {
      await User.clearRefreshToken(userId);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user data" });
  }
};
