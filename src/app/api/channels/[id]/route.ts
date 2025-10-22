

// app/api/channels/[id]/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth"; 
import {prisma} from "../../../../lib/prisma";
import { uploadBuffer } from "../../../../lib/s3";
import { streamToBuffer } from "../../../../lib/utils/image";

export async function PUT(req: NextRequest,    { params }: { params: Promise<{ id: string }> }  ) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user)
      return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
   const { id  } = await params;
    const channelId =  id;
    const formData = await req.formData();

    const name = formData.get("channelName") as string | null;
    const category = formData.get("channelCategory") as string | null;
    const brandGuidelines = formData.get("brandGuidelines") as string | null;
    const selectedProfile = formData.get("selectedProfile") as string | null;
    const logoFile = formData.get("logo") as File | null;

    let logoUrl: string | undefined;

    if (logoFile) {
      const buffer = await streamToBuffer(logoFile.stream());
      const key =  `channels/${channelId}.png`;
      const s3 = await uploadBuffer(key, buffer, "image/png");
      logoUrl = s3.Key;
    }

    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(name ? { name } : {}),
        ...(category ? { category } : {}),
        ...(brandGuidelines ? { brandGuidelines } : {}),
        ...(logoUrl ? { logoUrl } : {}),
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
    console.log("Updated Channel:", updatedChannel);
    return new Response(JSON.stringify(updatedChannel), { status: 200 });
  } catch (err) {
    console.error("Update Channel Error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}



export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "unauth" }), { status: 401 });
    }

    // find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }
const { id } = await params;
    // ensure the channel belongs to the user
    const channel = await prisma.channel.findUnique({
      where: { id: id },
    });

    if (!channel || channel.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Channel not found or unauthorized" }), {
        status: 404,
      });
    }

    await prisma.channel.delete({
      where: { id: id },
    });

    return new Response(JSON.stringify({ success: true, id: id }), { status: 200 });
  } catch (err) {
    console.error("Delete channel error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
