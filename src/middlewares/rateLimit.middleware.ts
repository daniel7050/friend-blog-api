import rateLimit from "express-rate-limit";

// General auth rate limiter (register, search users)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Login limiter - stricter to protect from brute force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload limiter - protect Cloudinary and storage costs
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each IP to 20 uploads per window
  message: { error: "Too many uploads, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export default { authLimiter, loginLimiter, uploadLimiter };
