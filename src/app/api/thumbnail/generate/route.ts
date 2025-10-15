import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { thumbnailQueue } from "../../../../lib/queue";
import { streamToBuffer } from "../../../../lib/utils/image";
import { uploadBuffer } from "../../../../lib/s3";
import { v4 as uuid } from "uuid";

export async function POST(req: Request, res: Response) {
  try {
    console.log("testing");
    const session = await getServerSession(authOptions);
    if (!session)
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
      }
    ]

    const user = await prisma.user.findUnique({
      where: { email: session.user.email},
    });

    if (user) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const thumbnail = await tx.thumbnail.create({
            data: { userId: user.id, title, channelId, inputImage: imageUrl },
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
          thumbnailVersionId: result.thumbnailVersion.id
        });

        console.log({
            thumbnailId: result.thumbnail.id,
            thumbnailVersionId: result.thumbnailVersion.id,
            queued: true,
          }, "Generated thumbnail version queued");
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
        return new Response(JSON.stringify({ error: "Bad Request" }), {
          status: 400,
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });
  }
}
