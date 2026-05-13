import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSchema } from "@/lib/validators";
import { buildGenerationPrompt } from "@/lib/prompt-builder";
import { startMusicGeneration } from "@/lib/replicate";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { themeId, contextDescription, duration } = parsed.data;

  // Load theme
  const theme = await prisma.soundTheme.findFirst({
    where: { id: themeId, userId: session.user.id },
  });

  if (!theme) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }

  // Build prompt
  const prompt = buildGenerationPrompt(theme.promptBase, contextDescription);

  // Webhook URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const webhookUrl = appUrl
    ? `${appUrl}/api/webhooks/replicate`
    : undefined;

  // Start generation
  let predictionId: string;
  try {
    const prediction = await startMusicGeneration({
      prompt,
      duration,
      webhookUrl,
    });
    predictionId = prediction.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Replicate API error";
    console.error("[generate] Replicate error:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Save to database
  try {
    const generation = await prisma.generation.create({
      data: {
        userId: session.user.id,
        themeId,
        prompt,
        contextDescription,
        duration,
        replicateId: predictionId,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({
      id: generation.id,
      status: generation.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    console.error("[generate] DB error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
