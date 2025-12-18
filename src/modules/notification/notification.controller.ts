import { Response } from "express";
import prisma from "../../generated/config/prisma";
import { AuthRequest } from "../../types/auth.types";

export const listNotifications = async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id);
  if (!req.user || Number.isNaN(userId))
    return res.status(401).json({ message: "Unauthorized" });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { id: true, username: true, name: true } },
    },
  });

  return res.json({ notifications });
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id);
  if (!req.user || Number.isNaN(userId))
    return res.status(401).json({ message: "Unauthorized" });

  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) return res.status(404).json({ message: "Not found" });
  if (notif.userId !== userId)
    return res.status(403).json({ message: "Forbidden" });

  await prisma.notification.update({ where: { id }, data: { read: true } });

  return res.json({ message: "Marked read" });
};
