import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "A/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ webhooks });
}
