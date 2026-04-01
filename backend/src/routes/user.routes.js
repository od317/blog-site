const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// Placeholder for now - we'll implement these later
router.get("/profile/:username", (req, res) => {
  res.json({ message: "Profile endpoint - coming soon" });
});

router.put("/profile", authMiddleware, (req, res) => {
  res.json({ message: "Update profile - coming soon" });
});

module.exports = router;
