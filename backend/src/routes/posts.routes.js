const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const postController = require("../controllers/post.controller");
const commentController = require("../controllers/comment.controller");
const likeController = require("../controllers/like.controller");

// Public routes
router.get("/", postController.getAllPosts);
router.get("/user/:userId", postController.getUserPosts);
router.get("/:id", postController.getPost);

// Protected routes
router.use(authMiddleware);

// Post CRUD
router.post("/", postController.createPost);
router.put("/:id", postController.updatePost);
router.delete("/:id", postController.deletePost);

// Comments
router.post("/:postId/comments", commentController.addComment);
router.delete("/comments/:id", commentController.deleteComment);
router.get("/:postId/comments", commentController.getPostComments);

// Likes
router.post("/:postId/like", likeController.likePost);
router.delete("/:postId/like", likeController.unlikePost);
router.get("/:postId/like", likeController.checkLike);

module.exports = router;
