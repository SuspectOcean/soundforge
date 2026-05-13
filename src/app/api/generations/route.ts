import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const themeId = searchParams.get("themeId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (themeId) where.themeId = themeId;
  if (status) where.status = status;
  if (search) {
    where.contextDescription = { contains: search, mode: "insensitive" };
  }

  const [generations, total] = await Promise.all([
    prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: { theme: { select: { name: true } } },
    }),
    prisma.generation.count({ where }),
  ]);

  return NextResponse.json({ generations, total });
}
