import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { webhookUrl, events } = await req.json();

  const webhook = await prisma.webhook.create({
    data: { userId: session.user.id, webhookUrl, events },
  });

  return NextResponse.json({ id: webhook.id }, { status: 201 });
}
