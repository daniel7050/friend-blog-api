import express from "express";
import { protect } from "../../../middlewares/auth.middleware";
import { getUser, getMyProfile, updateMyProfile } from "./user.controller";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

// get by id or username
router.get("/:id", getUser);

export default router;
