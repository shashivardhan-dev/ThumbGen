import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { uploadBuffer } from "../../../lib/s3";
import { v4 as uuid } from "uuid";
import { streamToBuffer } from "../../../lib/utils/image";
import AWS from "aws-sdk";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user)
      return new NextResponse(JSON.stringify({ error: "unauth" }), { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (user) {
      try {
        const result = await prisma.channel.findMany({
          where: {
            userId: user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            userId: true,
            name: true,
            category: true,
            brandGuidelines: true,
            logoUrl: true,
            createdAt: false,
            updatedAt: false,
          },
        });
        console.log(result, "result");
        return new NextResponse(
          JSON.stringify({
            channels: result,
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
    } else {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: "unauth" }), { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user)
      return new NextResponse(JSON.stringify({ error: "unauth" }), { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const brandGuidelines = formData.get("brandGuidelines") as string;

    const logoFile = formData.get("logo") as File | null;

    let channelId = uuid();

    let s3: AWS.S3.ManagedUpload.SendData | null = null;
    if (logoFile) {
      const buffer = await streamToBuffer(logoFile.stream());
      const key = `channels/${channelId}.png`;
      s3 = await uploadBuffer(key, buffer, "image/png");
    }

    // const body = await req.json();
    const channel = await prisma.channel.create({
      data: {
        id: uuid(),
        name: name,
        category: category,
        brandGuidelines: brandGuidelines,
        logoUrl: s3 ? s3.Key : null,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        category: true,
        brandGuidelines: true,
        logoUrl: true,
        userId: true,
      },
    });

    return new NextResponse(JSON.stringify(channel), { status: 200 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: "unauth" }), { status: 401 });
  }
}
