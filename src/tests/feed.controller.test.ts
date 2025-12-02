import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserPosts } from "../modules/post/post.controller";

vi.mock("../generated/config/prisma", () => ({
  default: {
    userFollow: { findMany: vi.fn() },
    post: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

let prisma: any;

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("post feed", () => {
  beforeEach(async () => {
    const mocked = await vi.importMock("../generated/config/prisma");
    prisma = mocked.default;
    vi.resetAllMocks();
  });

  it("returns user's own posts when following none", async () => {
    const req: any = { user: { id: 5 }, params: {} };
    const res = mockRes();

    prisma.userFollow.findMany.mockResolvedValue([]);
    prisma.post.findMany.mockResolvedValue([
      { id: "p1", authorId: 5, content: "mine" },
    ]);

    await getUserPosts(req, res);

    expect(prisma.userFollow.findMany).toHaveBeenCalledWith({
      where: { followerId: 5 },
      select: { followingId: true },
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: { in: [5] } },
      })
    );

    expect(res.json).toHaveBeenCalledWith({
      items: [{ id: "p1", authorId: 5, content: "mine" }],
      nextCursor: null,
      hasNext: false,
    });
  });

  it("returns 400 when cursor is invalid", async () => {
    const req: any = { user: { id: 5 }, params: {}, query: { cursor: "bad" } };
    const res = mockRes();

    prisma.userFollow.findMany.mockResolvedValue([]);
    // cursor validation call
    prisma.post.findUnique.mockResolvedValue(null);

    await getUserPosts(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid cursor" });
  });
});
