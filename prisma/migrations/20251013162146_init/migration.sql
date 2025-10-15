/*
  Warnings:

  - You are about to drop the `_ChannelToThumbnail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_ChannelToThumbnail" DROP CONSTRAINT "_ChannelToThumbnail_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ChannelToThumbnail" DROP CONSTRAINT "_ChannelToThumbnail_B_fkey";

-- DropTable
DROP TABLE "public"."_ChannelToThumbnail";

-- AddForeignKey
ALTER TABLE "public"."Thumbnail" ADD CONSTRAINT "Thumbnail_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
