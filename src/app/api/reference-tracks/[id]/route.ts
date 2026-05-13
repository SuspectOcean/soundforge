import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const track = await prisma.referenceTrack.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      analysisStatus: true,
      originalFilename: true,
      blobUrl: true,
      mimeType: true,
      fileSize: true,
      duration: true,
      bpm: true,
      musicalKey: true,
      genre: true,
      mood: true,
      energy: true,
      instrumentation: true,
      descriptors: true,
      createdAt: true,
    },
  });

  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(track);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.referenceTrack.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Build a typed update payload — only semantic fields the user may edit
  const data: {
    genre?: string | null;
    mood?: string | null;
    energy?: string | null;
    instrumentation?: string[];
    descriptors?: string[];
    bpm?: number | null;
    musicalKey?: string | null;
    duration?: number | null;
  } = {};

  if ("genre" in body)
    data.genre = typeof body.genre === "string" ? body.genre : null;
  if ("mood" in body)
    data.mood = typeof body.mood === "string" ? body.mood : null;
  if ("energy" in body)
    data.energy = typeof body.energy === "string" ? body.energy : null;
  if ("instrumentation" in body && Array.isArray(body.instrumentation))
    data.instrumentation = (body.instrumentation as unknown[]).filter(
      (v): v is string => typeof v === "string"
    );
  if ("descriptors" in body && Array.isArray(body.descriptors))
    data.descriptors = (body.descriptors as unknown[]).filter(
      (v): v is string => typeof v === "string"
    );
  if ("bpm" in body)
    data.bpm = typeof body.bpm === "number" ? body.bpm : null;
  if ("musicalKey" in body)
    data.musicalKey = typeof body.musicalKey === "string" ? body.musicalKey : null;
  if ("duration" in body)
    data.duration = typeof body.duration === "number" ? body.duration : null;

  const updated = await prisma.referenceTrack.update({
    where: { id },
    data,
    select: {
      id: true,
      analysisStatus: true,
      genre: true,
      mood: true,
      energy: true,
      instrumentation: true,
      descriptors: true,
      bpm: true,
      musicalKey: true,
      duration: true,
    },
  });

  return NextResponse.json(updated);
}
