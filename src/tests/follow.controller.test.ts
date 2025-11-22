import { describe, it, expect, vi, beforeEach } from "vitest";
import { followUser, unfollowUser } from "../modules/follow/follow.controller";

// Mock prisma client used by controllers
vi.mock("../generated/config/prisma", () => ({
  default: {
    userFollow: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// import the mocked prisma (will be imported in beforeEach)
let prisma: any;

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("follow.controller", () => {
  beforeEach(() => {
    // require the mocked prisma after vi.mock has been hoisted
    // using require avoids ESM file-extension issues in the test runner
    // vitest will return the mock provided in vi.mock above
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    prisma = require("../generated/config/prisma").default;
    vi.resetAllMocks();
  });

  it("creates a follow when not existing", async () => {
    const req: any = { user: { id: 1 }, params: { id: "2" } };
    const res = mockRes();

    prisma.userFollow.findUnique.mockResolvedValue(null);
    prisma.userFollow.create.mockResolvedValue({
      id: "uuid",
      followerId: 1,
      followingId: 2,
    });

    await followUser(req, res);

    expect(prisma.userFollow.findUnique).toHaveBeenCalled();
    expect(prisma.userFollow.create).toHaveBeenCalledWith({
      data: { followerId: 1, followingId: 2 },
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Followed successfully" });
  });

  it("returns 400 when already following", async () => {
    const req: any = { user: { id: 1 }, params: { id: "2" } };
    const res = mockRes();

    prisma.userFollow.findUnique.mockResolvedValue({
      id: "uuid",
      followerId: 1,
      followingId: 2,
    });

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Already following this user",
    });
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

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });
});
