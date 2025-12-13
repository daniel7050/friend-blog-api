import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { ENV } from "../../generated/config/env";

function initCloudinary() {
  if (ENV.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: ENV.CLOUDINARY_URL });
    return true;
  }
  if (
    ENV.CLOUDINARY_CLOUD_NAME &&
    ENV.CLOUDINARY_API_KEY &&
    ENV.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
      api_key: ENV.CLOUDINARY_API_KEY,
      api_secret: ENV.CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
}

// POST /api/uploads/image
// body: { dataUrl: string } (e.g., "data:image/png;base64,....")
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const ok = initCloudinary();
    if (!ok)
      return res.status(400).json({ error: "Cloudinary not configured" });

    const { dataUrl } = req.body as { dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ error: "dataUrl is required" });
    }

    const match = /^data:(.+?);base64,(.+)$/.exec(dataUrl);
    if (!match)
      return res.status(400).json({ error: "Invalid dataUrl format" });
    const mime = match[1];
    const b64 = match[2];
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(mime)) {
      return res.status(400).json({ error: "Unsupported image type" });
    }
    const estimatedBytes = Math.floor((b64.length * 3) / 4);
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    if (estimatedBytes > MAX_BYTES) {
      return res.status(413).json({ error: "Image too large (max 5MB)" });
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "friend-blog",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    // Generate responsive variants via Cloudinary URLs
    const base = result.secure_url;
    const publicId = result.public_id;
    // Small and medium thumbnails
    const small = cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: 320,
          height: 320,
          crop: "fill",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });
    const medium = cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: 800,
          height: 800,
          crop: "fill",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });

    return res.status(201).json({
      url: base,
      publicId,
      variants: { small, medium },
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const ok = initCloudinary();
    if (!ok)
      return res.status(400).json({ error: "Cloudinary not configured" });
    const { publicId } = req.body as { publicId?: string };
    if (!publicId)
      return res.status(400).json({ error: "publicId is required" });
    const result = await cloudinary.uploader.destroy(publicId);
    return res.json({ result });
  } catch (error) {
    console.error("❌ Delete image error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/uploads/signature
// Returns { timestamp, signature, cloudName, apiKey }
export const getUploadSignature = async (_req: Request, res: Response) => {
  try {
    // Ensure Cloudinary is configured via explicit creds
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      ENV;
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      return res
        .status(400)
        .json({ error: "Cloudinary explicit credentials not configured" });
    }

    // Generate signature for a simple upload preset-less upload
    const timestamp = Math.floor(Date.now() / 1000);
    // Build the string to sign: for basic uploads, it's just 'timestamp={timestamp}'
    const toSign = `timestamp=${timestamp}`;
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(toSign + CLOUDINARY_API_SECRET)
      .digest("hex");

    return res.json({
      timestamp,
      signature,
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("❌ Signature error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
