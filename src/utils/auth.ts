import * as jwt from "jsonwebtoken";
import { ENV } from "../generated/config/env";

// Ensure the secret is typed as jwt.Secret to satisfy TypeScript overloads
const JWT_SECRET = ENV.JWT_SECRET as jwt.Secret;

export const generateToken = (payload: object, expiresIn = "7d") =>
  (jwt.sign as any)(payload, JWT_SECRET, { expiresIn });

export const verifyToken = (token: string) =>
  (jwt.verify as any)(token, JWT_SECRET) as any;
