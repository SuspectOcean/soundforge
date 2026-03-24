import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const generations = await prisma.generation.findMany(
    {
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    },
    100
  );

  return NextResponse.json({
    generations: generations.map(g => ({
      id: g.id,
      status: g.status,
      audioUrl: g.audioUrl,
      duration: g.duration,
      createdAt: g.createdAt,
    })),
  });
}
