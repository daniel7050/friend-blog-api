-- CreateEnum
CREATE TYPE "public"."PostVisibility" AS ENUM ('friends', 'public');

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "visibility" "public"."PostVisibility" NOT NULL DEFAULT 'friends';
