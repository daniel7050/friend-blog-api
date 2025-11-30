import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMyProfile } from "../modules/users/user.controller";

// Mock the user service used by the controller
vi.mock("../modules/users/user.service", () => ({
  updateUser: vi.fn(),
  getMe: vi.fn(),
  findUserById: vi.fn(),
  findUserByUsername: vi.fn(),
  toPublicUser: vi.fn(),
}));

let userService: any;

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("user.controller - updateMyProfile", () => {
  beforeEach(async () => {
    userService = await vi.importMock("../modules/users/user.service");
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const req: any = { user: undefined, body: {} };
    const res = mockRes();

    await updateMyProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("returns 400 on validation error", async () => {
    const req: any = { user: { id: 1 }, body: { username: "ab" } };
    const res = mockRes();

    await updateMyProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    // error shape: { errors: [{ field, message }, ...] }
    const call = res.json.mock.calls[0][0];
    expect(call).toHaveProperty("errors");
    expect(Array.isArray(call.errors)).toBe(true);
    expect(call.errors[0]).toHaveProperty("field", "username");
  });

  it("updates user successfully", async () => {
    const req: any = { user: { id: 1 }, body: { username: "alice" } };
    const res = mockRes();

    userService.updateUser.mockResolvedValue({
      id: 1,
      name: "Alice",
      username: "alice",
      createdAt: new Date(),
    });

    await updateMyProfile(req, res);

    expect(userService.updateUser).toHaveBeenCalledWith(1, {
      username: "alice",
    });
    expect(res.json).toHaveBeenCalled();
    const returned = res.json.mock.calls[0][0];
    expect(returned).toHaveProperty("id", 1);
    expect(returned).toHaveProperty("username", "alice");
  });
});
