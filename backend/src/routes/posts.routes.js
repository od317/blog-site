const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const postController = require("../controllers/post.controller");
const commentController = require("../controllers/comment.controller");
const likeController = require("../controllers/like.controller");

// ========== IMPORTANT: Apply auth middleware FIRST ==========
// This will set req.userId for ALL routes, even public ones
router.use(authMiddleware);

// Now all routes will have access to req.userId
router.get("/", postController.getAllPosts);
router.get("/user/:userId", postController.getUserPosts);
router.get("/:id", postController.getPost);

// Post CRUD (these require auth, handled by middleware)
router.post("/", postController.createPost);
router.put("/:id", postController.updatePost);
router.delete("/:id", postController.deletePost);

// Comments
router.post("/:postId/comments", commentController.addComment);
router.delete("/comments/:id", commentController.deleteComment);
router.get("/:postId/comments", commentController.getPostComments);

router.get("/:id/active-readers", postController.getActiveReaders);

module.exports = router;
