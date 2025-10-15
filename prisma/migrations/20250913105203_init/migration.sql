/*
  Warnings:

  - You are about to drop the column `palette` on the `Channel` table. All the data in the column will be lost.
  - Added the required column `category` to the `Channel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Channel" DROP COLUMN "palette",
ADD COLUMN     "brandGuidelines" TEXT,
ADD COLUMN     "category" TEXT NOT NULL;
