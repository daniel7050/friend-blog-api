import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./modules/auth/auth.routes";
import { ENV } from "./config/env";

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
connectDB();

export default app;
