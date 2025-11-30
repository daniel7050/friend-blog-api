import prisma from "../../generated/config/prisma";
import { UpdateUserDto, PublicUser } from "./user.types";

/**
 * Fetch user by id (internal use)
 */
export const findUserById = async (id: number) => {
  return prisma.user.findUnique({ where: { id } });
};

/**
 * Fetch user by username
 */
export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({ where: { username } });
};

/**
 * Public-safe user projection
 */
export const toPublicUser = (user: any): PublicUser => {
  if (!user) return null as any;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    // omit email in public view, include when necessary elsewhere
    createdAt: user.createdAt.toISOString(),
  };
};

/**
 * Update the current user's profile
 */
export const updateUser = async (id: number, dto: UpdateUserDto) => {
  // If username is present, ensure uniqueness
  if (dto.username) {
    const existing = await prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing && existing.id !== id) {
      const e: any = new Error("Username already taken");
      e.code = "USERNAME_TAKEN";
      throw e;
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: dto.name ?? undefined,
      username: dto.username ?? undefined,
      // add optional columns if present in your schema (bio, avatarUrl)
      // bio: dto.bio ?? undefined,
      // avatarUrl: dto.avatarUrl ?? undefined,
    },
  });

  return updated;
};

/**
 * Get authenticated user's full profile (with counts)
 */
export const getMe = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      createdAt: true,
      posts: { select: { id: true } },
      followers: { select: { followerId: true } },
      following: { select: { followingId: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    counts: {
      posts: user.posts.length,
      followers: user.followers.length,
      following: user.following.length,
    },
  };
};
