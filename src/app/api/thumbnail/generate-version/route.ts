import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { thumbnailQueue } from "../../../../lib/queue";
import { streamToBuffer } from "../../../../lib/utils/image";
import { uploadBuffer } from "../../../../lib/s3";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user)
      return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });

    const data = await req.json();
    const thumbnailId = data.thumbnailId;
    const messages = data.messages;

    const thumbnail = await prisma.thumbnail.findUnique({
      where: { id: thumbnailId },
    });

    if (!thumbnail)
      return new Response(JSON.stringify({ error: "Thumbnail not found" }), {
        status: 404,
      });

      const userId = (session.user as { id: string }).id;

    if (thumbnail.userId !== userId)
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });

    const thumbnailVersion = await prisma.thumbnailVersion.create({
      data: {
        thumbnailId: thumbnail.id,
        input: messages,
      },
    });

    await thumbnailQueue.add("edit", {
      thumbnailId: thumbnail.id,
      thumbnailVersionId: thumbnailVersion.id,
    });

    return new NextResponse(
      JSON.stringify({ thumbnailVersionId: thumbnailVersion.id }),
      { status: 200 }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: "unauth" }), { status: 401 });
  }
}
