import express from "express";
import { protect } from "../../middlewares/auth.middleware";
import {
  createPost,
  getUserPosts,
  updatePost,
  deletePost,
} from "./post.controller";

const router = express.Router();

router.post("/", protect, createPost); // Create post
router.get("/", protect, getUserPosts); // Get posts
router.put("/:id", protect, updatePost); // Update post
router.delete("/:id", protect, deletePost); // Delete post

export default router;
