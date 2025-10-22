import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const userId = (session.user as { id: string }).id;

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
