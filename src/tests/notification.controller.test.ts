import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../generated/config/prisma", () => ({
  default: {
    notification: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

let prisma: any;

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

import {
  listNotifications,
  markAsRead,
} from "../modules/notification/notification.controller";

describe("notification.controller", () => {
  beforeEach(async () => {
    const mocked = await vi.importMock("../generated/config/prisma");
    prisma = mocked.default;
    vi.resetAllMocks();
  });

  it("lists notifications for user", async () => {
    const req: any = { user: { id: 1 } };
    const res = mockRes();

    prisma.notification.findMany.mockResolvedValue([{ id: 1, userId: 1 }]);

    await listNotifications(req, res);

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { createdAt: "desc" },
    });
    expect(res.json).toHaveBeenCalledWith({
      notifications: [{ id: 1, userId: 1 }],
    });
  });

  it("marks notification as read", async () => {
    const req: any = { user: { id: 1 }, params: { id: "1" } };
    const res = mockRes();

    prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 1 });
    prisma.notification.update.mockResolvedValue({ id: 1, read: true });

    await markAsRead(req, res);

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { read: true },
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Marked read" });
  });

  it("returns 401 when unauthenticated", async () => {
    const req: any = { user: undefined };
    const res = mockRes();

    await listNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });
});
