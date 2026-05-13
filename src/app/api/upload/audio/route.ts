import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
]);

const MAX_FILE_SIZE_BYTES =
  parseInt(process.env.MAX_AUDIO_UPLOAD_MB ?? "25") * 1024 * 1024;

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // Parse client-provided metadata before issuing the upload token.
        // We forward it via tokenPayload so it's available in onUploadCompleted,
        // because onUploadCompleted only receives { blob, tokenPayload }.
        let meta: { trackId?: string; duration?: number; fileSize?: number } = {};
        try {
          meta = clientPayload ? JSON.parse(clientPayload) : {};
        } catch {
          // ignore parse errors
        }

        if (!meta.trackId) {
          throw new Error("Missing trackId in clientPayload");
        }

        return {
          allowedContentTypes: [...ALLOWED_MIME_TYPES],
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          // Forward all metadata through tokenPayload so onUploadCompleted can use it
          tokenPayload: JSON.stringify({
            userId,
            trackId: meta.trackId,
            duration: meta.duration ?? null,
            fileSize: meta.fileSize ?? null,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let parsed: {
          userId: string;
          trackId: string;
          duration: number | null;
          fileSize: number | null;
        } = { userId: "", trackId: "", duration: null, fileSize: null };

        try {
          parsed = JSON.parse(tokenPayload ?? "{}");
        } catch {
          throw new Error("Failed to parse token payload");
        }

        if (!parsed.trackId || !parsed.userId) {
          throw new Error("Missing required metadata in token payload");
        }

        // Validate MIME type from the completed blob
        const mimeType = blob.contentType ?? "audio/mpeg";
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
          throw new Error(`Disallowed content type: ${mimeType}`);
        }

        await prisma.referenceTrack.create({
          data: {
            id: parsed.trackId,
            userId: parsed.userId,
            originalFilename: blob.pathname.split("/").pop() ?? "audio",
            blobUrl: blob.url,
            mimeType,
            fileSize: typeof parsed.fileSize === "number" ? parsed.fileSize : 0,
            duration: typeof parsed.duration === "number" ? parsed.duration : null,
            instrumentation: [],
            descriptors: [],
            analysisStatus: "PENDING",
          },
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
