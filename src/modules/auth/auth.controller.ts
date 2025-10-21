// backend/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import prisma from "../../generated/config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      token: generateToken(user.id.toString(), user.email),
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
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      token: generateToken(user.id.toString(), user.email),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
