import { Request, Response } from "express";
import prisma from "../../generated/config/prisma";
import { AuthRequest } from "../../types/auth.types";

// 🟢 Request to follow a user
export const requestFollow = async (req: AuthRequest, res: Response) => {
  const requesterId = parseInt(String(req.user?.id), 10);
  const targetId = parseInt(req.params.id, 10);

  if (!requesterId || isNaN(requesterId)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (isNaN(targetId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (requesterId === targetId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    // Already following?
    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: requesterId,
          followingId: targetId,
        },
      },
    });
    if (existing) return res.status(400).json({ message: "Already following" });

    // Existing request?
    const existingReq = await prisma.userFollowRequest.findUnique({
      where: { requesterId_targetId: { requesterId, targetId } },
    });
    if (existingReq)
      return res.status(400).json({ message: "Request already sent" });

    await prisma.userFollowRequest.create({
      data: { requesterId, targetId, status: "pending" },
    });

    res.json({ message: "Follow request sent" });
  } catch (error) {
    console.error("Follow request error:", error);
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

// ✅ Accept follow request
export const acceptFollowRequest = async (req: AuthRequest, res: Response) => {
  const userId = parseInt(String(req.user?.id), 10);
  const requestId = req.params.requestId;

  if (!userId || isNaN(userId))
    return res.status(401).json({ message: "Unauthorized" });

  const request = await prisma.userFollowRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.targetId !== userId)
    return res.status(403).json({ message: "Not authorized" });
  if (request.status !== "pending")
    return res.status(400).json({ message: "Request already processed" });

  await prisma.$transaction([
    prisma.userFollowRequest.update({
      where: { id: requestId },
      data: { status: "accepted" },
    }),
    prisma.userFollow.create({
      data: { followerId: request.requesterId, followingId: request.targetId },
    }),
  ]);

  res.json({ message: "Request accepted" });
};

// ❌ Reject follow request
export const rejectFollowRequest = async (req: AuthRequest, res: Response) => {
  const userId = parseInt(String(req.user?.id), 10);
  const requestId = req.params.requestId;

  if (!userId || isNaN(userId))
    return res.status(401).json({ message: "Unauthorized" });

  const request = await prisma.userFollowRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.targetId !== userId)
    return res.status(403).json({ message: "Not authorized" });
  if (request.status !== "pending")
    return res.status(400).json({ message: "Request already processed" });

  await prisma.userFollowRequest.update({
    where: { id: requestId },
    data: { status: "rejected" },
  });

  res.json({ message: "Request rejected" });
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
