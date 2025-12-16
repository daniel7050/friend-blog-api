import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestFollow,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
} from "../modules/follow/follow.controller";

// Mock prisma client used by controllers
// IMPORTANT: mock the resolved path to the generated client; use the same relative
// module specifier that controller modules use when importing the generated client.
vi.mock("../generated/config/prisma", () => ({
  default: {
    userFollow: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    userFollowRequest: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../generated/config/socket", () => ({
  safeEmit: vi.fn(),
}));

// import the mocked prisma (will be imported in beforeEach)
let prisma: any;
let safeEmit: any;

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("follow.controller", () => {
  beforeEach(async () => {
    // import the mocked prisma module provided by vi.mock above
    const mocked = await vi.importMock("../generated/config/prisma");
    prisma = mocked.default;
    const socketMock = await vi.importMock("../generated/config/socket");
    safeEmit = socketMock.safeEmit;
    vi.resetAllMocks();
  });

  it("creates a follow request when not existing", async () => {
    const req: any = { user: { id: 1 }, params: { id: "2" } };
    const res = mockRes();

    prisma.userFollow.findUnique.mockResolvedValue(null);
    prisma.userFollowRequest.findUnique.mockResolvedValue(null);
    prisma.userFollowRequest.create.mockResolvedValue({
      id: "req-uuid",
      requesterId: 1,
      targetId: 2,
      status: "pending",
    });
    prisma.notification.create.mockResolvedValue({ id: 100, userId: 2 });

    await requestFollow(req, res);

    expect(prisma.userFollow.findUnique).toHaveBeenCalled();
    expect(prisma.userFollowRequest.findUnique).toHaveBeenCalled();
    expect(prisma.userFollowRequest.create).toHaveBeenCalledWith({
      data: { requesterId: 1, targetId: 2, status: "pending" },
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 2,
        actorId: 1,
        type: "follow_request",
        data: { requestId: "req-uuid" },
      },
    });
    expect(safeEmit).toHaveBeenCalledWith("user:2", "notification", {
      id: 100,
      userId: 2,
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Follow request sent" });
  });

  it("returns 400 when already following", async () => {
    const req: any = { user: { id: 1 }, params: { id: "2" } };
    const res = mockRes();

    prisma.userFollow.findUnique.mockResolvedValue({
      id: "uuid",
      followerId: 1,
      followingId: 2,
    });

    await requestFollow(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Already following",
    });
  });

  it("accepts a pending follow request and emits notification", async () => {
    const req: any = { user: { id: 2 }, params: { requestId: "req1" } };
    const res = mockRes();

    prisma.userFollowRequest.findUnique.mockResolvedValue({
      id: "req1",
      requesterId: 1,
      targetId: 2,
      status: "pending",
    });
    prisma.userFollowRequest.update.mockResolvedValue({});
    prisma.userFollow.create.mockResolvedValue({ id: "f1" });
    prisma.notification.create.mockResolvedValue({ id: 101, userId: 1 });

    prisma.$transaction = vi.fn(async (ops) => {
      for (const op of ops) await op;
      return true;
    });

    await acceptFollowRequest(req, res);

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        actorId: 2,
        type: "follow_accepted",
        data: { requestId: "req1" },
      },
    });
    expect(safeEmit).toHaveBeenCalledWith("user:1", "notification", {
      id: 101,
      userId: 1,
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Request accepted" });
  });

  it("rejects a pending follow request", async () => {
    const req: any = { user: { id: 2 }, params: { requestId: "req1" } };
    const res = mockRes();

    prisma.userFollowRequest.findUnique.mockResolvedValue({
      id: "req1",
      requesterId: 1,
      targetId: 2,
      status: "pending",
    });
    prisma.userFollowRequest.update.mockResolvedValue({});

    await rejectFollowRequest(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: "Request rejected" });
  });

  it("unfollows a user", async () => {
    const req: any = { user: { id: 1 }, params: { id: "2" } };
    const res = mockRes();

    prisma.userFollow.deleteMany.mockResolvedValue({ count: 1 });

    await unfollowUser(req, res);

    expect(prisma.userFollow.deleteMany).toHaveBeenCalledWith({
      where: { followerId: 1, followingId: 2 },
    });
    expect(res.json).toHaveBeenCalledWith({
      message: "Unfollowed successfully",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const req: any = { user: undefined, params: { id: "2" } };
    const res = mockRes();

    await requestFollow(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });
});
