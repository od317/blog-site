const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { sendVerificationEmail } = require("../utils/email");
const crypto = require("crypto");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      full_name,
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // Save verification token
    await User.saveVerificationToken(
      user.id,
      verificationToken,
      verificationExpires,
    );

    // Send verification email (don't await to avoid blocking)
    sendVerificationEmail(email, verificationToken).catch(console.error);

    // Generate JWT
    const token = generateToken(user.id);

    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
      user,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// Login user
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

    // if (!user.is_verified) {
    //   return res
    //     .status(401)
    //     .json({
    //       error:
    //         "Please verify your email first. Check your inbox for the verification link.",
    //     });
    // }

    const token = generateToken(user.id);

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
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
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
