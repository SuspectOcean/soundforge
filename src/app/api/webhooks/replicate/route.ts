import { NextResponse } from "next/server";
import { WebhookEvent } from "@/types/webhooks";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json() as WebhookEvent;

  if (body.event === "song.creation.complete") {
    const generation = await prisma.generation.update({
      where: { replicateId: body.data.replicate_id },
      data: { status: "SUCCEEDED", audioUrl: body.data.output },
    });
  }

  if (body.event === "song.creation.failed") {
    const generation = await prisma.generation.update({
      where: { replicateId: body.data.replicate_id },
      data: { status: "FAILED", errorMessage: body.data.error },
    });
  }

  return Response.json({ success: true });
}
