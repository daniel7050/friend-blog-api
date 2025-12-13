import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImage, deleteImage } from "../modules/upload/upload.controller";

vi.mock("../generated/config/env", () => ({
  ENV: {
    CLOUDINARY_URL: "cloudinary://key:secret@cloud",
    CLOUDINARY_CLOUD_NAME: "",
    CLOUDINARY_API_KEY: "",
    CLOUDINARY_API_SECRET: "",
  },
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(async () => ({
        secure_url: "https://cdn/img.jpg",
        public_id: "pid",
      })),
      destroy: vi.fn(async () => ({ result: "ok" })),
    },
    url: vi.fn(() => "https://cdn/img-variant.jpg"),
  },
}));

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("upload routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects missing dataUrl", async () => {
    const req: any = { body: {} };
    const res = mockRes();
    await uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects unsupported mime", async () => {
    const req: any = { body: { dataUrl: "data:text/plain;base64,Zm9v" } };
    const res = mockRes();
    await uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Unsupported image type" });
  });

  it("accepts valid image and returns url + variants", async () => {
    const b64 = Buffer.from("hello").toString("base64");
    const req: any = { body: { dataUrl: `data:image/png;base64,${b64}` } };
    const res = mockRes();
    await uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      url: "https://cdn/img.jpg",
      publicId: "pid",
      variants: {
        small: "https://cdn/img-variant.jpg",
        medium: "https://cdn/img-variant.jpg",
      },
    });
  });

  it("deletes by publicId", async () => {
    const req: any = { body: { publicId: "pid" } };
    const res = mockRes();
    await deleteImage(req, res);
    expect(res.json).toHaveBeenCalledWith({ result: { result: "ok" } });
  });
});
