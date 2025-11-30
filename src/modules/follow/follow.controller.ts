import { Request, Response } from "express";
import prisma from "../../generated/config/prisma";
import { AuthRequest } from "../../types/auth.types";

// 🟢 Follow a user
export const followUser = async (req: AuthRequest, res: Response) => {
  const followerId = parseInt(String(req.user?.id), 10);
  const followingId = parseInt(req.params.id, 10);

  if (!followerId || isNaN(followerId)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (isNaN(followingId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (followerId === followingId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    // prevent duplicates
    const existing = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    await prisma.userFollow.create({
      data: { followerId, followingId },
    });

    res.json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔴 Unfollow a user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  const followerId = parseInt(String(req.user?.id), 10);
  const followingId = parseInt(req.params.id, 10);

  if (!followerId || isNaN(followerId)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (isNaN(followingId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    await prisma.userFollow.deleteMany({
      where: { followerId, followingId },
    });

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🧑‍🤝‍🧑 Get followers
export const getFollowers = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const followers = await prisma.userFollow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: { id: true, username: true },
        },
      },
    });

    res.json(followers.map((f) => f.follower));
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🧑‍🤝‍🧑 Get following
export const getFollowing = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const following = await prisma.userFollow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, username: true },
        },
      },
    });

    res.json(following.map((f) => f.following));
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
