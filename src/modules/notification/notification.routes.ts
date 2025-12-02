import express from "express";
import { protect } from "../../../middlewares/auth.middleware";
import { listNotifications, markAsRead } from "./notification.controller";

const router = express.Router();

router.get("/", protect, listNotifications);
router.post("/:id/read", protect, markAsRead);

export default router;
