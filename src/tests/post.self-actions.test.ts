import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLikeFindFirst = vi.fn();
const mockLikeCreate = vi.fn();
const mockLikeDelete = vi.fn();
const mockPostFindUnique = vi.fn();
const mockCommentCreate = vi.fn();
const mockNotificationCreate = vi.fn();
const mockUserFollowFindUnique = vi.fn();
const mockSafeEmit = vi.fn();

vi.mock("../generated/config/prisma", () => ({
  default: {
    post: { findUnique: mockPostFindUnique },
    like: {
      findFirst: mockLikeFindFirst,
      create: mockLikeCreate,
      delete: mockLikeDelete,
    },
    comment: { create: mockCommentCreate },
    notification: { create: mockNotificationCreate },
    userFollow: { findUnique: mockUserFollowFindUnique },
  },
}));

vi.mock("../generated/config/socket", () => ({
  safeEmit: mockSafeEmit,
}));

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

let prisma: any;
let safeEmit: any;

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  prisma = (await vi.importMock("../generated/config/prisma")).default;
  safeEmit = (await vi.importMock("../generated/config/socket")).safeEmit;
});

describe("post.controller self-actions", () => {
  it("allows liking your own post and toggles on", async () => {
    const req: any = { params: { postId: "p1" }, user: { id: 1 } };
    const res = mockRes();

    mockPostFindUnique.mockResolvedValue({
      id: "p1",
      authorId: 1,
      visibility: "public",
    });
    mockLikeFindFirst.mockResolvedValue(null);
    mockLikeCreate.mockResolvedValue({ id: 10, postId: "p1", userId: 1 });

    const { toggleLike } = await import("../modules/post/post.controller.ts");

    await toggleLike(req, res);

    expect(mockLikeCreate).toHaveBeenCalledWith({
      data: { postId: "p1", userId: 1 },
    });
    expect(res.json).toHaveBeenCalledWith({ liked: true });
    expect(safeEmit.mock.calls.length).toBe(0); // no notifications for self-like
  });

  it("allows commenting on your own post", async () => {
    const req: any = {
      params: { postId: "p1" },
      user: { id: 1 },
      body: { content: "hi" },
    };
    const res = mockRes();

    mockPostFindUnique.mockResolvedValue({
      id: "p1",
      authorId: 1,
      visibility: "friends",
    });
    mockCommentCreate.mockResolvedValue({
      id: 5,
      postId: "p1",
      authorId: 1,
      content: "hi",
    });

    const { createComment } = await import(
      "../modules/post/post.controller.ts"
    );

    await createComment(req, res);

    expect(mockCommentCreate).toHaveBeenCalledWith({
      data: { content: "hi", postId: "p1", authorId: 1 },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 5,
      postId: "p1",
      authorId: 1,
      content: "hi",
    });
    expect(safeEmit.mock.calls.length).toBe(0); // no notifications for self-comment
  });
});
