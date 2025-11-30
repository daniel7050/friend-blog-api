import express from "express";
import { registerUser, loginUser, searchUsers } from "./auth.controller";
import { handleAsync } from "../../utils/handleAsync";
import {
  authLimiter,
  loginLimiter,
} from "../../middlewares/rateLimit.middleware";

const router = express.Router();

router.post("/register", authLimiter, handleAsync(registerUser));
router.post("/login", loginLimiter, handleAsync(loginUser));
router.get("/users", handleAsync(searchUsers));

export default router;
