import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createThemeSchema } from "@/lib/validators";
import { buildPromptBase } from "@/lib/prompt-builder";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const themes = await prisma.soundTheme.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(themes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createThemeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const promptBase = buildPromptBase({
    genres: data.genres,
    moods: data.moods,
    era: data.era ?? null,
    tempo: data.tempo ?? null,
    instruments: data.instruments,
    description: data.description,
  });

  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await prisma.soundTheme.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const theme = await prisma.soundTheme.create({
    data: {
      userId: session.user.id,
      name: data.name,
      genres: data.genres,
      moods: data.moods,
      era: data.era ?? null,
      tempo: data.tempo ?? null,
      instruments: data.instruments,
      description: data.description,
      promptBase,
      isDefault: data.isDefault || false,
    },
  });

  return NextResponse.json(theme, { status: 201 });
}
