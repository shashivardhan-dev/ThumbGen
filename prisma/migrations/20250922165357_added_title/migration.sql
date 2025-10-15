-- AlterTable
ALTER TABLE "public"."Thumbnail" ADD COLUMN     "channelId" TEXT NOT NULL DEFAULT 'null';

-- CreateTable
CREATE TABLE "public"."_ChannelToThumbnail" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChannelToThumbnail_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ChannelToThumbnail_B_index" ON "public"."_ChannelToThumbnail"("B");

-- AddForeignKey
ALTER TABLE "public"."_ChannelToThumbnail" ADD CONSTRAINT "_ChannelToThumbnail_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChannelToThumbnail" ADD CONSTRAINT "_ChannelToThumbnail_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Thumbnail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
