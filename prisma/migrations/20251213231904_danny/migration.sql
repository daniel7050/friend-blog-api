-- CreateEnum
CREATE TYPE "public"."FollowRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "public"."UserFollowRequest" (
    "id" TEXT NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "status" "public"."FollowRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFollowRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFollowRequest_requesterId_targetId_key" ON "public"."UserFollowRequest"("requesterId", "targetId");

-- AddForeignKey
ALTER TABLE "public"."UserFollowRequest" ADD CONSTRAINT "UserFollowRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserFollowRequest" ADD CONSTRAINT "UserFollowRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
