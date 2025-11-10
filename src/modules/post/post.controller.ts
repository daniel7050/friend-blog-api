import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Create Post
export const createPost = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const rawUserId = (req as any).user?.id; // from auth middleware
    const userId = Number(rawUserId);
    if (!rawUserId || Number.isNaN(userId))
      return res.status(401).json({ error: "Not authorized" });

    if (!content) return res.status(400).json({ error: "Content is required" });

    const post = await prisma.post.create({
      data: { content, authorId: userId },
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error("❌ Create Post error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// 🔵 Get All Posts by a User
export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const rawUserId = (req as any).user?.id;
    const userId = Number(rawUserId);
    if (!rawUserId || Number.isNaN(userId))
      return res.status(401).json({ error: "Not authorized" });

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(posts);
  } catch (error) {
    console.error("❌ Fetch Posts error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// 🟡 Update Post
export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const rawUserId = (req as any).user?.id;
    const userId = Number(rawUserId);
    if (!rawUserId || Number.isNaN(userId))
      return res.status(401).json({ error: "Not authorized" });

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post || post.authorId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { content },
    });

    return res.json(updatedPost);
  } catch (error) {
    console.error("❌ Update Post error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// 🔴 Delete Post
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawUserId = (req as any).user?.id;
    const userId = Number(rawUserId);
    if (!rawUserId || Number.isNaN(userId))
      return res.status(401).json({ error: "Not authorized" });

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post || post.authorId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.post.delete({ where: { id } });

    return res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Post error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
