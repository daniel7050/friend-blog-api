import prismaClient from "./prisma";

// Re-export the single PrismaClient instance from `prisma.ts` to avoid
// creating multiple clients across the app.
export const prisma = prismaClient;

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed", error);
    process.exit(1);
  }
};
