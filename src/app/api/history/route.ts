import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";
import { versions } from "process";

export async function GET(req: Request, res: Response) {
  try {
    const session = await getServerSession(authOptions);
    console.log(session);

    if (!session?.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
      //    return res.status(401).json({ message: "Unauthorized" });
    }

const thumbnails = await prisma.thumbnail.findMany({
  where: {
    userId: session.user.id,
        versions: {
      some: {}, // This ensures that the 'versions' list is NOT empty for the result to be included
    },
 
  },
  orderBy: {
    createdAt: "desc",
  },
  select: {
    id: true,
    createdAt: true,
    isFavourite: true,
    userId: true,
    title: true,
    versions: {
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        thumbnailId: true,
        input: true,
        s3Key: true,
        isSelected: true,
        createdAt: true,
      },
    },
  },
});


    // const designs = thumbnail.map((thumbnail) =>{
    //   const versions = thumbnail.versions.map((version) => ({
    //     id
    //   }))
    //   return {
    //     id: thumbnail.id,
    //     versions: [

    //     ]
    //   }
    // });

    // naive: return all thumbnails for session user
    
    return new Response(JSON.stringify({ designs: thumbnails }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
