import express from "express";
import {
  uploadImage,
  deleteImage,
  getUploadSignature,
} from "./upload.controller";
import { protect } from "../../../middlewares/auth.middleware";
import { uploadLimiter } from "../../middlewares/rateLimit.middleware";

const router = express.Router();

router.post("/image", protect, uploadLimiter, uploadImage);
router.delete("/image", protect, deleteImage);
router.get("/signature", protect, getUploadSignature);

export default router;
