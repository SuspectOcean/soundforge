import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateThemeSchema } from "@/lib/validators";
import { buildPromptBase } from "@/lib/prompt-builder";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { themeId } = await params;

  const theme = await prisma.soundTheme.findFirst({
    where: { id: themeId, userId: session.user.id },
  });

  if (!theme) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }

  return NextResponse.json(theme);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { themeId } = await params;

  const existing = await prisma.soundTheme.findFirst({
    where: { id: themeId, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateThemeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const merged = {
    genres: data.genres ?? existing.genres,
    moods: data.moods ?? existing.moods,
    era: data.era !== undefined ? data.era ?? null : existing.era,
    tempo: data.tempo !== undefined ? data.tempo ?? null : existing.tempo,
    instruments: data.instruments ?? existing.instruments,
    description: data.description ?? existing.description,
  };

  const promptBase = buildPromptBase(merged);

  const updated = await prisma.soundTheme.update({
    where: { id: themeId },
    data: {
      ...data,
      promptBase,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { themeId } = await params;

  const existing = await prisma.soundTheme.findFirst({
    where: { id: themeId, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }

  await prisma.soundTheme.delete({ where: { id: themeId } });

  return NextResponse.json({ success: true });
}