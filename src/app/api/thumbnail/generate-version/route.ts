import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { thumbnailQueue } from "../../../../lib/queue";

export async function POST(req: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated)
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
    return new NextResponse(JSON.stringify({ error: "unauth" }), {
      status: 401,
    });
  }
}
