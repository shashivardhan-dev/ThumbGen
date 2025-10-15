import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { thumbnailQueue } from "../../../../lib/queue";
import { streamToBuffer } from "../../../../lib/utils/image";
import { uploadBuffer } from "../../../../lib/s3";
import { v4 as uuid } from "uuid";

export async function POST(req: Request, res: Response) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
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

    if (thumbnail.userId !== session.user.id)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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

    return new Response(
      JSON.stringify({ thumbnailVersionId: thumbnailVersion.id }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });
  }
}
