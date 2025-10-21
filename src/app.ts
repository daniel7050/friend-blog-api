import express from "express";
import cors from "cors";
import { connectDB } from "./generated/config/db";
import authRoutes from "./modules/auth/auth.routes";
import postRoutes from "./modules/post/post.routes";
import { ENV } from "./generated/config/env";

const app = express();

app.use("/api/posts", postRoutes);

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
connectDB();

export default app;

// after auth routes
