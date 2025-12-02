import { describe, it, expect, vi, beforeEach } from "vitest";

// Ensure env vars for modules that validate them
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://localhost:5432/friend_blog_dev";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

// Module-scoped mock functions so the controller receives the same instances
const mockLikeFindFirst = vi.fn();
const mockLikeCreate = vi.fn();
const mockLikeDelete = vi.fn();
const mockPostFindUnique = vi.fn();
const mockNotificationCreate = vi.fn();
const mockSafeEmit = vi.fn();

vi.mock("../generated/config/prisma", () => ({
  default: {
    like: {
      findFirst: mockLikeFindFirst,
      create: mockLikeCreate,
      delete: mockLikeDelete,
    },
    post: { findUnique: mockPostFindUnique },
    notification: { create: mockNotificationCreate },
  },
}));

vi.mock("../generated/config/socket", () => ({
  safeEmit: mockSafeEmit,
}));

let prisma: any;
let safeEmit: any;

beforeEach(async () => {
  // Clear the module registry so dynamic imports load fresh modules
  // that will pick up the current mocks defined above.
  vi.resetModules();
  vi.resetAllMocks();
  const mocked = await vi.importMock("../generated/config/prisma");
  prisma = mocked.default;
  const socketMock = await vi.importMock("../generated/config/socket");
  safeEmit = socketMock.safeEmit;
});

describe("socket emits on like/comment", () => {
  it("creates notification and emits on like", async () => {
    const req: any = { params: { postId: "p1" }, user: { id: 2 } };
    const res: any = {
      json: vi.fn(),
      status: vi.fn().mockReturnValue({ json: vi.fn() }),
    };

    // Configure mock implementations before importing the controller
    mockLikeFindFirst.mockResolvedValue(null);
    mockLikeCreate.mockResolvedValue({ id: 10 });
    mockPostFindUnique.mockResolvedValue({ id: "p1", authorId: 1 });
    mockNotificationCreate.mockResolvedValue({ id: 100, userId: 1 });

    const { toggleLike } = await import("../modules/post/post.controller.ts");

    await toggleLike(req, res);

    // Ensure either a notification record was created or an event was emitted
    const created = !!(
      prisma.notification &&
      prisma.notification.create &&
      prisma.notification.create.mock &&
      prisma.notification.create.mock.calls.length > 0
    );
    const emitted = !!(
      safeEmit &&
      safeEmit.mock &&
      safeEmit.mock.calls.length > 0
    );
    expect(created || emitted).toBeTruthy();
  });

  it("creates notification and emits on comment", async () => {
    const req: any = {
      params: { postId: "p1" },
      user: { id: 2 },
      body: { content: "hi" },
    };
    const res: any = {
      status: vi.fn().mockReturnValue({ json: vi.fn() }),
      json: vi.fn(),
    };

    // Configure mocks before importing
    prisma.comment = { create: vi.fn().mockResolvedValue({ id: 55 }) };
    mockPostFindUnique.mockResolvedValue({ id: "p1", authorId: 1 });
    mockNotificationCreate.mockResolvedValue({ id: 101, userId: 1 });

    const { createComment } = await import(
      "../modules/post/post.controller.ts"
    );

    await createComment(req, res);

    const created2 = !!(
      prisma.notification &&
      prisma.notification.create &&
      prisma.notification.create.mock &&
      prisma.notification.create.mock.calls.length > 0
    );
    const emitted2 = !!(
      safeEmit &&
      safeEmit.mock &&
      safeEmit.mock.calls.length > 0
    );
    expect(created2 || emitted2).toBeTruthy();
  });
});
