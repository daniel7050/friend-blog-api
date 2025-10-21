import jwt from "jsonwebtoken";
import { ENV } from "../generated/config/env";

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, ENV.JWT_SECRET, { expiresIn: "7d" });
};
