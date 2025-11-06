import express from "express";
import cors from "cors";
import { connectDB } from "./generated/config/db";
import authRoutes from "./modules/auth/auth.routes";
import postRoutes from "./modules/post/post.routes";
import { ENV } from "./generated/config/env";

const app = express();

// Middleware (must be registered before routes)
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Initialize DB early so handlers can assume it's available
connectDB();

// Routes (registered after middleware and DB connect)
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

export default app;
