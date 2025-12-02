import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const ENV = {
  PORT: process.env.PORT || "5000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  // Feature flags
  RAPTOR_MINI_ENABLED:
    process.env.RAPTOR_MINI_ENABLED !== undefined
      ? process.env.RAPTOR_MINI_ENABLED === "true"
      : true,
};

// During tests we allow missing env vars (tests may set them per-file).
if (process.env.NODE_ENV !== "test" && (!ENV.DATABASE_URL || !ENV.JWT_SECRET)) {
  throw new Error("Missing required environment variables");
}
