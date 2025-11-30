import { Request, Response } from "express";
import {
  findUserById,
  findUserByUsername,
  toPublicUser,
  updateUser,
  getMe,
} from "./user.service";
import { updateUserSchema } from "./user.validation";
import { AuthRequest } from "../../types/auth.types";

/**
 * GET /api/users/:id
 * Return public profile by numeric id OR username (detects numeric vs string)
 */
export const getUser = async (req: Request, res: Response) => {
  const raw = req.params.id;
  const byId = Number(raw);

  try {
    let user: any = null;
    if (!Number.isNaN(byId)) {
      user = await findUserById(byId);
    } else {
      user = await findUserByUsername(raw);
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(toPublicUser(user));
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/users/me
 */
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  const rawId = req.user?.id;
  const id = Number(rawId);
  if (!rawId || Number.isNaN(id))
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const profile = await getMe(id);
    if (!profile) return res.status(404).json({ message: "User not found" });
    return res.json(profile);
  } catch (error) {
    console.error("Get my profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/users/me
 * Body: { name?, username?, bio?, avatarUrl? }
 */
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  const rawId = req.user?.id;
  const id = Number(rawId);
  if (!rawId || Number.isNaN(id))
    return res.status(401).json({ message: "Unauthorized" });

  const dto = req.body;

  const parsed = updateUserSchema.safeParse(dto);
  if (!parsed.success) {
    // Format zod issues into { field, message } for client-friendly errors
    const errors = parsed.error.issues.map((issue) => ({
      field: issue.path.join(".") || "",
      message: issue.message,
    }));
    return res.status(400).json({ errors });
  }

  try {
    const updated = await updateUser(id, parsed.data);
    return res.json({
      id: updated.id,
      name: updated.name,
      username: updated.username,
      createdAt: updated.createdAt,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    if (error.code === "USERNAME_TAKEN") {
      return res.status(409).json({ message: "Username already taken" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};
