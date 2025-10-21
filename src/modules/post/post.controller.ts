import { Request, Response } from "express";
import { prisma } from "../../config/db";

// 🟢 Create Post
export const createPost = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const userId = (req as any).user.id; // from auth middleware

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
    const userId = (req as any).user.id;

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
    const userId = (req as any).user.id;

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
    const userId = (req as any).user.id;

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
