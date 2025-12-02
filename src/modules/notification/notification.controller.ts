import { Request, Response } from "express";
import prisma from "../../generated/config/prisma";

export const listNotifications = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ notifications });
};

export const markAsRead = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) return res.status(404).json({ message: "Not found" });
  if (notif.userId !== user.id) return res.status(403).json({ message: "Forbidden" });

  await prisma.notification.update({ where: { id }, data: { read: true } });

  return res.json({ message: "Marked read" });
};
