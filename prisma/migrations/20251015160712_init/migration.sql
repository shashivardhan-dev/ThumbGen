/*
  Warnings:

  - The `input` column on the `ThumbnailVersion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ThumbnailVersion" DROP COLUMN "input",
ADD COLUMN     "input" JSONB[];
