import { ResponseCmode, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GetOutputResponseType } from "A/components/inputs/output-selector";
declare const Replicate: any;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ generationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { generationId } = await params;

  const generation = await prisma.generation.findFirst({
    where: { id: generationId, userId: session.user.id },
  });

  if (!generation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: generation.id,
    status: generation.status,
    audioUrl: generation.audioUrl,
    duration: generation.duration,
  });
}
