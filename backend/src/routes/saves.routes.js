const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const saveController = require("../controllers/save.controller");

// All save routes require authentication
router.use(authMiddleware);

router.post("/:postId/save", saveController.savePost);
router.delete("/:postId/save", saveController.unsavePost);
router.get("/:postId/save", saveController.checkSave);
router.get("/", saveController.getSavedPosts);

module.exports = router;
