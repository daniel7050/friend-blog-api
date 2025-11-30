import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./generated/config/db";
import authRoutes from "./modules/auth/auth.routes";
import postRoutes from "./modules/post/post.routes";
import followRoutes from "./modules/follow/follow.routes";
import userRoutes from "./modules/users/user.routes";
import { ENV } from "./generated/config/env";

const app = express();

// Middleware (must be registered before routes)
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
// parse cookies (needed when using cookie-based tokens)
app.use(cookieParser());

// Initialize DB early so handlers can assume it's available
connectDB();

// Global feature flag header: enable Raptor mini for all clients
app.use((req, res, next) => {
  if (ENV.RAPTOR_MINI_ENABLED) {
    res.setHeader("X-Raptor-Mini", "enabled");
  }
  next();
});

// Routes (registered after middleware and DB connect)
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);

// Optional: expose feature flags to clients
app.get("/api/features", (_req, res) => {
  res.json({ raptorMini: ENV.RAPTOR_MINI_ENABLED });
});
app.use("/api/users", userRoutes);

// Error handler (must be registered after all routes)
import errorHandler from "../middlewares/error.middleware";
app.use(errorHandler);

export default app;
