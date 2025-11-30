import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../generated/config/env";
import { AuthRequest } from "../src/types/auth.types";

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  // Prefer Authorization header, fall back to cookie `token` (if cookie-parser is enabled)
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if ((req as any).cookies?.token) {
    token = (req as any).cookies.token as string;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
