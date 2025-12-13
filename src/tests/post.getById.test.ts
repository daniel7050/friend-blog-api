import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPostById } from "../modules/post/post.controller";

vi.mock("../generated/config/prisma", () => ({
  default: {
    post: { findUnique: vi.fn() },
    userFollow: { findUnique: vi.fn() },
  },
}));

let prisma: any;

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("getPostById", () => {
  beforeEach(async () => {
    const mocked = await vi.importMock("../generated/config/prisma");
    prisma = mocked.default;
    vi.resetAllMocks();
  });

  it("allows author to fetch their friends-only post", async () => {
    const req: any = { params: { id: "p1" }, user: { id: 10 } };
    const res = mockRes();

    prisma.post.findUnique.mockResolvedValue({
      id: "p1",
      authorId: 10,
      visibility: "friends",
      author: { id: 10, username: "me", name: "Me" },
    });

    await getPostById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1", authorId: 10 })
    );
  });

  it("blocks non-follower from friends-only post", async () => {
    const req: any = { params: { id: "p2" }, user: { id: 20 } };
    const res = mockRes();

    prisma.post.findUnique.mockResolvedValue({
      id: "p2",
      authorId: 11,
      visibility: "friends",
      author: { id: 11, username: "u11", name: "User 11" },
    });
    prisma.userFollow.findUnique.mockResolvedValue(null);

    await getPostById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized" });
  });

  it("allows follower to fetch friends-only post", async () => {
    const req: any = { params: { id: "p3" }, user: { id: 20 } };
    const res = mockRes();

    prisma.post.findUnique.mockResolvedValue({
      id: "p3",
      authorId: 11,
      visibility: "friends",
      author: { id: 11, username: "u11", name: "User 11" },
    });
    prisma.userFollow.findUnique.mockResolvedValue({ id: "f1" });

    await getPostById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p3", authorId: 11 })
    );
  });
});
