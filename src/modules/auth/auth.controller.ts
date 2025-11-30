// backend/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import prisma from "../../generated/config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper: simple password strength check
const isStrongPassword = (pw: string) => {
  // at least 8 chars, one upper, one lower, one digit, one special
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return re.test(pw);
};

// 🔑 Generate JWT
const generateToken = (id: string, email: string) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET as string, {
    expiresIn: "30d", // adjust as needed
  });
};

// 🟢 Register User
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, username } = req.body;

  // 1️⃣ Validate inputs
  if (!name || !email || !password || !username) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // 1.1️⃣ Enforce password strength
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    });
  }

  try {
    // 2️⃣ Check if user exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, username },
    });

    // 5️⃣ Respond with safe user data + token
    const token = generateToken(user.id.toString(), user.email);

    // Optionally set token in secure cookie when enabled via env
    if (process.env.SEND_TOKEN_IN_COOKIE === "true") {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      });
    }

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// 🟠 Login User
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1️⃣ Validate inputs
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 2️⃣ Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 3️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 4️⃣ Respond with safe user data + token
    const token = generateToken(user.id.toString(), user.email);

    if (process.env.SEND_TOKEN_IN_COOKIE === "true") {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  const q = req.query.q as string;

  try {
    const users = await prisma.user.findMany({
      where: q ? { username: { contains: q, mode: "insensitive" } } : {},
      select: {
        id: true,
        username: true,
        name: true,
      },
      take: 20,
    });

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
