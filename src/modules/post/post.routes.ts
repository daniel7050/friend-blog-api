import express from "express";
import { protect } from "../../../middlewares/auth.middleware";
import {
  createPost,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  createComment,
  updateComment,
  deleteComment,
  getComments,
} from "./post.controller";

const router = express.Router();

router.post("/", protect, createPost); // Create post
router.get("/", protect, getUserPosts); // Get posts
router.get("/:id", protect, getPostById); // Get single post
router.put("/:id", protect, updatePost); // Update post
router.delete("/:id", protect, deletePost); // Delete post
router.post("/:postId/like", protect, toggleLike);
router.post("/:postId/comments", protect, createComment);
router.put("/:postId/comments/:commentId", protect, updateComment);
router.delete("/:postId/comments/:commentId", protect, deleteComment);
router.get("/:postId/comments", protect, getComments);

export default router;
