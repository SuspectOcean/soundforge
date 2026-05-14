import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkPrediction } from "@/lib/replicate";

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

  // If still processing, check Replicate directly as fallback
  if (generation.status === "PROCESSING" && generation.replicateId) {
    try {
      const prediction = await checkPrediction(generation.replicateId);

      if (prediction.status === "succeeded" && prediction.output) {
        const audioUrl = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;

        const updated = await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: "SUCCEEDED",
            audioUrl: audioUrl as string,
            completedAt: new Date(),
          },
        });

        return NextResponse.json({
          id: updated.id,
          status: updated.status,
          audioUrl: updated.audioUrl,
          duration: updated.duration,
        });
      }

      if (prediction.status === "failed") {
        const updated = await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: "FAILED",
            errorMessage: prediction.error as string | undefined,
          },
        });

        return NextResponse.json({
          id: updated.id,
          status: updated.status,
          error: updated.errorMessage,
        });
      }
    } catch (err) {
      console.error("[poll] Replicate check failed for", generationId, err);
      // Fall through and return current DB status
    }
  }

  return NextResponse.json({
    id: generation.id,
    status: generation.status,
    audioUrl: generation.audioUrl,
    duration: generation.duration,
  });
}
