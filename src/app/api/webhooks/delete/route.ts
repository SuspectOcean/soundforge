import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "A/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  await prisma.webhook.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
