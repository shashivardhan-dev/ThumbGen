/*
  Warnings:

  - Added the required column `inputImage` to the `Thumbnail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Thumbnail" ADD COLUMN     "inputImage" TEXT NOT NULL;
