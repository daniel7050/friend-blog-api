import express from "express";
import { protect } from "../../middlewares/auth.middleware";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "./follow.controller";

const router = express.Router();

router.post("/:id", protect, followUser); // follow user
router.delete("/:id", protect, unfollowUser); // unfollow user

router.get("/:id/followers", getFollowers); // list followers
router.get("/:id/following", getFollowing); // list following

export default router;
