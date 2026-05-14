import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyseAudio } from "@/lib/audio-analysis";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let referenceTrackId: string;
  try {
    const body = await req.json();
    referenceTrackId = body?.referenceTrackId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!referenceTrackId || typeof referenceTrackId !== "string") {
    return NextResponse.json(
      { error: "referenceTrackId is required" },
      { status: 400 }
    );
  }

  // Verify ownership
  const track = await prisma.referenceTrack.findFirst({
    where: { id: referenceTrackId, userId: session.user.id },
  });

  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Don't re-analyse a completed track unless explicitly requested
  if (track.analysisStatus === "COMPLETED") {
    return NextResponse.json({
      status: "COMPLETED",
      genre: track.genre,
      genres: [],
      mood: track.mood,
      moods: [],
      energy: track.energy,
      tempo: null,
      instrumentation: track.instrumentation,
      descriptors: track.descriptors,
      bpm: track.bpm,
      musicalKey: track.musicalKey,
    });
  }

  // Run analysis — synchronous with internal timeout
  let result;
  try {
    result = await analyseAudio(referenceTrackId);
  } catch (err) {
    console.error("[analyse] Analysis failed for track", referenceTrackId, err);
    await prisma.referenceTrack.update({
      where: { id: referenceTrackId },
      data: { analysisStatus: "FAILED" },
    });
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    status: "COMPLETED",
    ...result,
  });
}
