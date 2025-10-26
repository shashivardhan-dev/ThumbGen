import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated)
      return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });

    const { id } = await params;

    const updatedThumbnail = await prisma.thumbnail.update({
      where: {
        id: id,
      },
      data: {
        isFavourite: true,
      },
    });

    return NextResponse.json(updatedThumbnail);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated)
      return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });

    const { id } = await params;

    const updatedThumbnail = await prisma.thumbnail.update({
      where: {
        id: id,
      },
      data: {
        isFavourite: false,
      },
    });

    return NextResponse.json(updatedThumbnail);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
