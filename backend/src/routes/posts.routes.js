const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const postController = require("../controllers/post.controller");
const commentController = require("../controllers/comment.controller");
const likeController = require("../controllers/like.controller");
const { uploadPostImage } = require("../middleware/upload");
router.use(express.json());

// ========== IMPORTANT: Apply auth middleware FIRST ==========
// This will set req.userId for ALL routes, even public ones
router.use(authMiddleware);

// ========== POST ROUTES ==========
// Public read routes
router.get("/", postController.getAllPosts);
router.get("/user/:userId", postController.getUserPosts);
router.get("/:id", postController.getPost);
router.get("/:id/active-readers", postController.getActiveReaders);

// Protected write routes (auth required)
router.post("/", uploadPostImage.single("image"), postController.createPost);
router.put(
  "/:id",
  authMiddleware,
  uploadPostImage.single("image"),
  postController.updatePost,
);
router.delete("/:id", postController.deletePost);

// ========== COMMENT ROUTES ==========
// Public read route
router.get("/:postId/comments", commentController.getPostComments);

// Protected write routes (auth required)
router.post("/:postId/comments", commentController.addComment);
router.put("/comments/:id", commentController.updateComment); //
router.delete("/comments/:id", commentController.deleteComment);
router.get("/comments/:commentId/replies", commentController.getCommentReplies);
router.get("/:postId/comments/nested", commentController.getNestedComments);

module.exports = router;
