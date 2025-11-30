import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateComment, deleteComment } from "../modules/post/post.controller";

// Mock the generated prisma client using the path from the test file
vi.mock("../generated/config/prisma", () => ({
  default: {
    comment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe("post.controller - comments auth", () => {
  beforeEach(async () => {
    const mocked = await vi.importMock("../generated/config/prisma");
    prisma = mocked.default;
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated for update", async () => {
    const req: any = {
      user: undefined,
      params: { postId: "p1", commentId: "10" },
      body: { content: "x" },
    };
    const res = mockRes();

    await updateComment(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized" });
  });

  it("returns 404 when comment not found on update", async () => {
    const req: any = {
      user: { id: 1 },
      params: { postId: "p1", commentId: "10" },
      body: { content: "x" },
    };
    const res = mockRes();

    prisma.comment.findUnique.mockResolvedValue(null);

    await updateComment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Comment not found" });
  });

  it("returns 403 when updating someone else's comment", async () => {
    const req: any = {
      user: { id: 1 },
      params: { postId: "p1", commentId: "10" },
      body: { content: "x" },
    };
    const res = mockRes();

    prisma.comment.findUnique.mockResolvedValue({
      id: 10,
      authorId: 2,
      content: "old",
    });

    await updateComment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized" });
  });

  it("updates comment when owner", async () => {
    const req: any = {
      user: { id: 1 },
      params: { postId: "p1", commentId: "10" },
      body: { content: "new" },
    };
    const res = mockRes();

    prisma.comment.findUnique.mockResolvedValue({
      id: 10,
      authorId: 1,
      content: "old",
    });
    prisma.comment.update.mockResolvedValue({
      id: 10,
      authorId: 1,
      content: "new",
    });

    await updateComment(req, res);

    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: Number("10") },
      data: { content: "new" },
    });
    expect(res.json).toHaveBeenCalledWith({
      id: 10,
      authorId: 1,
      content: "new",
    });
  });

  it("returns 401 when unauthenticated for delete", async () => {
    const req: any = { user: undefined, params: { commentId: "10" } };
    const res = mockRes();

    await deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized" });
  });

  it("returns 404 when comment not found on delete", async () => {
    const req: any = { user: { id: 1 }, params: { commentId: "10" } };
    const res = mockRes();

    prisma.comment.findUnique.mockResolvedValue(null);

    await deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Comment not found" });
  });

  it("returns 403 when deleting someone else's comment", async () => {
    const req: any = { user: { id: 1 }, params: { commentId: "10" } };
    const res = mockRes();

    prisma.comment.findUnique.mockResolvedValue({
      id: 10,
      authorId: 2,
      content: "old",
    });

    await deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized" });
  });

  it("deletes comment when owner", async () => {
    const req: any = { user: { id: 1 }, params: { commentId: "10" } };
    const res = mockRes();

    prisma.comment.findUnique.mockResolvedValue({
      id: 10,
      authorId: 1,
      content: "old",
    });
    prisma.comment.delete.mockResolvedValue({
      id: 10,
      authorId: 1,
      content: "old",
    });

    await deleteComment(req, res);

    expect(prisma.comment.delete).toHaveBeenCalledWith({
      where: { id: Number("10") },
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Comment deleted" });
  });
});
