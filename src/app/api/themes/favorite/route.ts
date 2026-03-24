import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  const theme = await prisma.soundTheme.update({
    where: { id },
    data: { isFavorited: true },
  });

  return NextResponse.json({ id: theme.id });
}
