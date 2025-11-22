import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import prisma from "../../generated/config/prisma";

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
      where: {
        authorId: {
          in: await prisma.userFollow
            .findMany({
              where: { followerId: userId },
              select: { followingId: true },
            })
            .then((list) => list.map((l) => l.followingId)),
        },
      },
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

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const existingLike = await prisma.like.findFirst({
      where: { postId, userId: Number(req.user!.id) },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ liked: false });
    }

    await prisma.like.create({
      data: { postId, userId: Number(req.user!.id) },
    });

    return res.json({ liked: true });
  } catch (error) {
    console.error("❌ Toggle Like error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: Number(req.user!.id),
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error("❌ Create Comment error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    const updated = await prisma.comment.update({
      where: { id: Number(commentId) },
      data: { content },
    });

    return res.json(updated);
  } catch (error) {
    console.error("❌ Update Comment error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    await prisma.comment.delete({ where: { id: Number(commentId) } });
    return res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("❌ Delete Comment error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(comments);
  } catch (error) {
    console.error("❌ Get Comments error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
