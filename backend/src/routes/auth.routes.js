const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth");

// Validation rules
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be 3-50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscore"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("full_name").optional().isLength({ max: 100 }),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.get("/verify/:token", authController.verifyEmail);
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
