import { Request, Response } from "express";
import { AuthRequest } from "../../types/auth.types";
import prisma from "../../generated/config/prisma";
import { findComment, isCommentOwner } from "../../utils/ownership";
import { safeEmit } from "../../generated/config/socket";

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

    const following = await prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const ids = following.length ? following.map((f) => f.followingId) : [];
    // always include self
    ids.push(userId);

    // Cursor-based pagination
    const limitRaw = (req.query && (req.query as any).limit) as
      | string
      | undefined;
    const cursorRaw = (req.query && (req.query as any).cursor) as
      | string
      | undefined;
    const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 10;
    const cursor = cursorRaw || undefined;

    const findArgs: any = {
      where: { authorId: { in: ids } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }

    // If a cursor is provided, validate it points to an existing post
    if (cursor) {
      const cursorExists = await prisma.post.findUnique({
        where: { id: cursor },
      });
      if (!cursorExists) {
        return res.status(400).json({ error: "Invalid cursor" });
      }
    }

    const results = await prisma.post.findMany(findArgs);

    let nextCursor: string | null = null;
    let items = results;
    let hasNext = false;
    if (results.length > limit) {
      const next = results[results.length - 1];
      nextCursor = next.id;
      items = results.slice(0, -1);
      hasNext = true;
    }

    return res.json({ items, nextCursor, hasNext });
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

    try {
      // create a notification for the post author
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (post && post.authorId !== Number(req.user!.id)) {
        const notification = await prisma.notification.create({
          data: {
            userId: post.authorId,
            actorId: Number(req.user!.id),
            type: "like",
            data: { postId },
          },
        });
        console.log("DEBUG: toggleLike created notification", { notification });
        safeEmit(`user:${post.authorId}`, "notification", notification);
        console.log("DEBUG: toggleLike safeEmit called");
      } else {
        console.log(
          "DEBUG: toggleLike not creating notification (self-like or missing post)"
        );
      }
    } catch (e) {
      console.error("Failed to create/emit notification", e);
    }

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

    try {
      // create a notification for the post author
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (post && post.authorId !== Number(req.user!.id)) {
        const notification = await prisma.notification.create({
          data: {
            userId: post.authorId,
            actorId: Number(req.user!.id),
            type: "comment",
            data: { postId, commentId: comment.id },
          },
        });
        console.log("DEBUG: createComment created notification", {
          notification,
        });
        safeEmit(`user:${post.authorId}`, "notification", notification);
        console.log("DEBUG: createComment safeEmit called");
      } else {
        console.log(
          "DEBUG: createComment not creating notification (self-comment or missing post)"
        );
      }
    } catch (e) {
      console.error("Failed to create/emit notification", e);
    }

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

    const rawUserId = (req as any).user?.id;
    const userId = Number(rawUserId);
    if (!rawUserId || Number.isNaN(userId))
      return res.status(401).json({ error: "Not authorized" });

    const comment = await findComment(Number(commentId));
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // If a postId param is provided and the comment has a postId, ensure they match
    if (postId && comment.postId !== undefined && comment.postId !== postId)
      return res
        .status(400)
        .json({ error: "Comment does not belong to the specified post" });

    // Ensure the authenticated user is the author of the comment
    if (comment.authorId !== userId)
      return res.status(403).json({ error: "Not authorized" });

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
    const { commentId, postId } = req.params;

    const rawUserId = (req as any).user?.id;
    const userId = Number(rawUserId);
    if (!rawUserId || Number.isNaN(userId))
      return res.status(401).json({ error: "Not authorized" });

    const comment = await findComment(Number(commentId));
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // If a postId param is provided and the comment has a postId, ensure they match
    if (postId && comment.postId !== undefined && comment.postId !== postId)
      return res
        .status(400)
        .json({ error: "Comment does not belong to the specified post" });

    if (comment.authorId !== userId)
      return res.status(403).json({ error: "Not authorized" });

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
