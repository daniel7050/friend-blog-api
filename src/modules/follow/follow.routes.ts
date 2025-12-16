import express from "express";
import { protect } from "../../../middlewares/auth.middleware";
import {
  requestFollow,
  unfollowUser,
  getFollowers,
  getFollowing,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingFollowRequests,
} from "./follow.controller";

const router = express.Router();

router.post("/:id", protect, requestFollow); // send follow request
router.delete("/:id", protect, unfollowUser); // unfollow user

router.get("/requests/pending", protect, getPendingFollowRequests); // get pending requests
router.post("/requests/:requestId/accept", protect, acceptFollowRequest);
router.post("/requests/:requestId/reject", protect, rejectFollowRequest);

router.get("/:id/followers", getFollowers); // list followers
router.get("/:id/following", getFollowing); // list following

export default router;
