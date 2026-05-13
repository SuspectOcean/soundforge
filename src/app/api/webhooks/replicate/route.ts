import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

/**
 * Verify a Replicate webhook signature.
 * https://replicate.com/docs/topics/webhooks#verifying-webhooks
 *
 * Set REPLICATE_WEBHOOK_SECRET in your environment (from replicate.com/account).
 * If the variable is unset the check is skipped — acceptable for development,
 * but MUST be set in production.
 */
async function verifySignature(req: Request, body: string): Promise<boolean> {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!secret) {
    // Not configured — allow in development, warn in production
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[webhook] REPLICATE_WEBHOOK_SECRET is not set — skipping signature verification in production is insecure"
      );
    }
    return true;
  }

  const webhookId = req.headers.get("webhook-id");
  const webhookTimestamp = req.headers.get("webhook-timestamp");
  const webhookSignature = req.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  // Reject replays older than 5 minutes
  const ts = parseInt(webhookTimestamp, 10);
  if (Math.abs(Date.now() / 1000 - ts) > 300) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedContent)
  );

  const computed =
    "v1," +
    btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // Replicate may send multiple signatures separated by spaces
  const receivedSignatures = webhookSignature.split(" ");
  return receivedSignatures.some((sig) => sig === computed);
}

/**
 * Download audio from a temporary URL (e.g. Replicate's CDN) and
 * re-upload it to Vercel Blob for permanent storage.
 */
async function persistAudio(
  temporaryUrl: string,
  generationId: string
): Promise<string> {
  const response = await fetch(temporaryUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch audio from Replicate: ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "audio/mpeg";
  const buffer = await response.arrayBuffer();

  const ext = contentType.includes("wav") ? "wav" : "mp3";
  const filename = `generations/${generationId}.${ext}`;

  const blob = await put(filename, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });

  return blob.url;
}

export async function POST(req: Request) {
  // Read body as text first so we can verify the signature
  const rawBody = await req.text();

  const isValid = await verifySignature(req, rawBody);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  let body: { id?: string; status?: string; output?: unknown; error?: unknown };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status, output, error } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Missing prediction id" },
      { status: 400 }
    );
  }

  const generation = await prisma.generation.findFirst({
    where: { replicateId: id },
  });

  if (!generation) {
    // Unknown prediction — acknowledge without error (Replicate retries on non-2xx)
    return NextResponse.json({ received: true });
  }

  if (status === "succeeded" && output) {
    const temporaryUrl = Array.isArray(output)
      ? (output[0] as string)
      : (output as string);

    let permanentUrl = temporaryUrl;

    // Persist to Vercel Blob so the URL never expires
    try {
      permanentUrl = await persistAudio(temporaryUrl, generation.id);
    } catch (err) {
      console.error("[webhook] Failed to persist audio to Blob:", err);
      // Fall back to the temporary URL rather than failing the whole webhook
    }

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "SUCCEEDED",
        audioUrl: permanentUrl,
        completedAt: new Date(),
      },
    });
  } else if (status === "failed") {
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        errorMessage:
          typeof error === "string" ? error : "Generation failed",
      },
    });
  }

  return NextResponse.json({ received: true });
}
