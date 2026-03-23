import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();

  const { id, status, output, error } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing prediction id" }, { status: 400 });
  }

  const generation = await prisma.generation.findFirst({
    where: { replicateId: id },
  });

  if (!generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  if (status === "succeeded" && output) {
    const audioUrl = Array.isArray(output) ? output[0] : output;

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "SUCCEEDED",
        audioUrl,
        completedAt: new Date(),
      },
    });
  } else if (status === "failed") {
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        errorMessage: typeof error === "string" ? error : "Generation failed",
      },
    });
  }

  return NextResponse.json({ received: true });
}