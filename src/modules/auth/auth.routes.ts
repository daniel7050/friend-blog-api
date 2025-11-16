import express from "express";
import { registerUser, loginUser } from "./auth.controller";
import { searchUsers } from "./auth.controller";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", searchUsers);

export default router;
