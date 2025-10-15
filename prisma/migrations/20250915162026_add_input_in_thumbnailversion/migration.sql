/*
  Warnings:

  - Added the required column `input` to the `ThumbnailVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ThumbnailVersion" ADD COLUMN     "input" JSONB NOT NULL;
