import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { thumbnailQueue } from "../../../../lib/queue";
import { streamToBuffer } from "../../../../lib/utils/image";
import { uploadBuffer } from "../../../../lib/s3";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated)
      return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const style = formData.get("style") as string;
    const thumbnailText = formData.get("thumbnailText") as string;

    const channelId = formData.get("channelId") as string;
    const imageFile = formData.get("image") as File | null;

    let imageUrl: string;

    const thumbnailVersionId = uuid();

    if (imageFile) {
      const buffer = await streamToBuffer(imageFile.stream());
      const key = `input/thumbnailVersion/${channelId}.png`;
      const s3 = await uploadBuffer(key, buffer, "image/png");
      imageUrl = s3.Key;
    }

    const input = [
      {
        type: "user",
        message: `title:${title}; description:${description}; style:${style}; thumbnailText:${thumbnailText}`,
      },
    ];

    try {
      const result = await prisma.$transaction(async (tx) => {
        const thumbnail = await tx.thumbnail.create({
          data: { userId: userId, title, channelId, inputImage: imageUrl },
        });
        const thumbnailVersion = await tx.thumbnailVersion.create({
          data: {
            id: thumbnailVersionId,
            thumbnailId: thumbnail.id,
            input,
          },
        });
        return { thumbnail, thumbnailVersion };
      });
      // enqueue job for worker to process
      await thumbnailQueue.add("generate", {
        thumbnailId: result.thumbnail.id,
        thumbnailVersionId: result.thumbnailVersion.id,
      });

      console.log(
        {
          thumbnailId: result.thumbnail.id,
          thumbnailVersionId: result.thumbnailVersion.id,
          queued: true,
        },
        "Generated thumbnail version queued"
      );
      return new Response(
        JSON.stringify({
          thumbnailId: result.thumbnail.id,
          thumbnailVersionId: result.thumbnailVersion.id,
          queued: true,
        }),
        {
          status: 200,
        }
      );
    } catch (e) {
      return new NextResponse(JSON.stringify({ error: "Bad Request" }), {
        status: 400,
      });
    }
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: "unauth" }), {
      status: 401,
    });
  }
}
