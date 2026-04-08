const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { sendVerificationEmail } = require("../utils/email");
const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
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

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await User.saveVerificationToken(
      user.id,
      verificationToken,
      verificationExpires,
    );
    sendVerificationEmail(email, verificationToken).catch(console.error);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);
    await User.saveRefreshToken(user.id, refreshToken, refreshExpires);

    // Set cookies ONLY - no tokens in response body
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        is_verified: false,
      },
      // REMOVED: accessToken, refreshToken
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// Login user - use cookies ONLY
// Login user - check if email is verified
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.is_verified) {
      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24);

      await User.saveVerificationToken(
        user.id,
        verificationToken,
        verificationExpires,
      );

      // Send new verification email
      await sendVerificationEmail(email, verificationToken);

      return res.status(401).json({
        error:
          "Please verify your email first. A new verification link has been sent to your email.",
        needsVerification: true,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to database
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);
    await User.saveRefreshToken(user.id, refreshToken, refreshExpires);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

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

    res.json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await User.saveVerificationToken(
      user.id,
      verificationToken,
      verificationExpires,
    );

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.json({
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
};

exports.validateToken = async (req, res) => {
  try {
    // The authMiddleware already validated the token
    // If we get here, the token is valid
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        valid: false,
        error: "User not found",
      });
    }

    // Return success with user info
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

// Refresh token endpoint - read from cookie, return new access token in cookie
// In your auth controller
exports.refreshToken = async (req, res) => {
  try {
    console.log("=== REFRESH TOKEN DEBUG ===");
    console.log("Cookies received:", req.cookies);

    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    console.log("✅ Refresh token found in cookie");

    // Verify the old refresh token
    const decoded = verifyRefreshToken(oldRefreshToken);
    if (!decoded) {
      console.log("❌ Refresh token verification failed");
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    console.log("✅ Token verified, user ID:", decoded.id);

    // Find user by ID (NOT by refresh token string)
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ error: "User not found" });
    }

    console.log("✅ User found:", user.id);

    // Check if the refresh token matches and is not expired
    if (user.refresh_token !== oldRefreshToken) {
      console.log("❌ Refresh token mismatch");
      console.log("DB token:", user.refresh_token?.substring(0, 50));
      console.log("Cookie token:", oldRefreshToken.substring(0, 50));
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    if (user.refresh_token_expires < new Date()) {
      console.log("❌ Refresh token expired in DB");
      return res.status(401).json({ error: "Refresh token expired" });
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

    // Set new tokens as cookies
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({
      message: "Tokens refreshed successfully",
      rotated: true,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const userId = req.userId;

    if (userId) {
      await User.clearRefreshToken(userId);
    }

    clearTokenCookies(res);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get current user - no token needed, cookie is sent automatically
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

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.verifyEmail(token);

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification link" });
    }

    res.json({ message: "Email verified successfully", user });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
};
