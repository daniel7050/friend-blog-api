import { describe, it, expect, vi } from "vitest";
import { getUploadSignature } from "../modules/upload/upload.controller";

vi.mock("../generated/config/env", () => ({
  ENV: {
    CLOUDINARY_CLOUD_NAME: "demo",
    CLOUDINARY_API_KEY: "123456",
    CLOUDINARY_API_SECRET: "s3cr3t",
  },
}));

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("getUploadSignature", () => {
  it("returns timestamp and signature", async () => {
    const req: any = {};
    const res = mockRes();
    await getUploadSignature(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ cloudName: "demo", apiKey: "123456" })
    );
    const payload = res.json.mock.calls[0][0];
    expect(typeof payload.timestamp).toBe("number");
    expect(typeof payload.signature).toBe("string");
    expect(payload.signature.length).toBe(40); // sha1 hex length
  });
});
