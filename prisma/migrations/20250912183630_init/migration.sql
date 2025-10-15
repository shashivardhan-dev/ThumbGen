/*
  Warnings:

  - You are about to drop the column `prompt` on the `Thumbnail` table. All the data in the column will be lost.
  - You are about to drop the column `ratio` on the `Thumbnail` table. All the data in the column will be lost.
  - You are about to drop the column `s3Key` on the `Thumbnail` table. All the data in the column will be lost.
  - You are about to drop the column `seriesId` on the `Thumbnail` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `Thumbnail` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Thumbnail` table. All the data in the column will be lost.
  - You are about to drop the `Analytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Brand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Edit` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Thumbnail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Brand" DROP CONSTRAINT "Brand_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Edit" DROP CONSTRAINT "Edit_thumbnailId_fkey";

-- AlterTable
ALTER TABLE "public"."Thumbnail" DROP COLUMN "prompt",
DROP COLUMN "ratio",
DROP COLUMN "s3Key",
DROP COLUMN "seriesId",
DROP COLUMN "style",
DROP COLUMN "title",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "public"."Analytics";

-- DropTable
DROP TABLE "public"."Brand";

-- DropTable
DROP TABLE "public"."Edit";

-- CreateTable
CREATE TABLE "public"."Channel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "palette" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ThumbnailVersion" (
    "id" TEXT NOT NULL,
    "thumbnailId" TEXT NOT NULL,
    "s3Key" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ThumbnailVersion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Channel" ADD CONSTRAINT "Channel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThumbnailVersion" ADD CONSTRAINT "ThumbnailVersion_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "public"."Thumbnail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
