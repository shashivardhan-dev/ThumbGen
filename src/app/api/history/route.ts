import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
       const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated)
      return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });



    const thumbnails = await prisma.thumbnail.findMany({
      where: {
        userId: userId,
        versions: {
          some: {},
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

    if (!thumbnails) {
      return new NextResponse(JSON.stringify({ message: "No thumbnails found" }), {
        status: 404,
      });
    }

    return new NextResponse(JSON.stringify({ designs: thumbnails }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
