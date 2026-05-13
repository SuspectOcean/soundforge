/**
 * Audio Analysis Service
 *
 * Hybrid approach:
 *   1. AI semantic analysis via Replicate (genre, mood, energy, instrumentation, descriptors)
 *   2. Basic technical metadata already captured at upload (duration, fileSize, mimeType)
 *
 * To enable AI analysis, set REPLICATE_ANALYSIS_MODEL in your environment.
 * Recommended model: andreasjansson/instruct-music-decoder
 * Leave unset to skip AI analysis — all fields remain editable by the user.
 */

import Replicate from "replicate";
import { prisma } from "@/lib/db";
import { GENRES, MOODS, INSTRUMENTS, TEMPOS } from "@/lib/constants";

export interface AudioAnalysisResult {
  genre: string | null;
  genres: string[];
  mood: string | null;
  moods: string[];
  energy: "low" | "medium" | "high" | null;
  tempo: string | null;
  instrumentation: string[];
  descriptors: string[];
  bpm: number | null;
  musicalKey: string | null;
  rawText: string | null;
}

// ─── Text Parsing Utilities ──────────────────────────────────────────────────

const ENERGY_PATTERNS: Record<"high" | "medium" | "low", RegExp> = {
  high: /\b(high[ -]energy|energetic|intense|driving|powerful|aggressive|upbeat|fast|lively|vibrant|uplifting)\b/i,
  medium: /\b(moderate|balanced|mid[ -]tempo|steady|flowing|medium energy)\b/i,
  low: /\b(low[ -]energy|calm|relaxed|mellow|ambient|soft|gentle|quiet|slow|downtempo|laid[- ]back|peaceful)\b/i,
};

const KEY_PATTERN =
  /\b([A-G][b#]?\s*(?:major|minor|maj|min)?)\b/i;

const BPM_PATTERN = /\b(\d{2,3})\s*(?:bpm|beats per minute)\b/i;

function extractEnergy(text: string): "low" | "medium" | "high" | null {
  for (const [level, pattern] of Object.entries(ENERGY_PATTERNS) as [
    "high" | "medium" | "low",
    RegExp
  ][]) {
    if (pattern.test(text)) return level;
  }
  return null;
}

function extractBpm(text: string): number | null {
  const match = text.match(BPM_PATTERN);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  return value >= 40 && value <= 220 ? value : null;
}

function extractKey(text: string): string | null {
  const match = text.match(KEY_PATTERN);
  return match ? match[1].trim() : null;
}

function matchAgainst(text: string, candidates: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return candidates.filter((c) => lower.includes(c.toLowerCase()));
}

function extractTempo(text: string): string | null {
  const tempoWords: Record<string, string> = {
    "very slow": "Very Slow",
    slow: "Slow",
    "mid-tempo": "Medium",
    "mid tempo": "Medium",
    medium: "Medium",
    moderate: "Medium",
    upbeat: "Upbeat",
    fast: "Fast",
    "very fast": "Very Fast",
    rapid: "Fast",
    quick: "Fast",
  };
  const lower = text.toLowerCase();
  for (const [word, label] of Object.entries(tempoWords)) {
    if (lower.includes(word)) return label;
  }
  return null;
}

function extractDescriptors(text: string): string[] {
  const candidates = [
    "cinematic",
    "atmospheric",
    "lo-fi",
    "vintage",
    "retro",
    "modern",
    "organic",
    "electronic",
    "acoustic",
    "hybrid",
    "minimalist",
    "lush",
    "sparse",
    "textured",
    "groovy",
    "soulful",
    "dark",
    "bright",
    "warm",
    "cool",
    "ethereal",
    "haunting",
    "anthemic",
    "experimental",
  ];
  return matchAgainst(text, candidates);
}

function parseAnalysisText(raw: string): Omit<AudioAnalysisResult, "rawText"> {
  const genres = matchAgainst(raw, GENRES as unknown as string[]);
  const moods = matchAgainst(raw, MOODS as unknown as string[]);
  const instrumentation = matchAgainst(raw, INSTRUMENTS as unknown as string[]);

  return {
    genre: genres[0] ?? null,
    genres,
    mood: moods[0] ?? null,
    moods,
    energy: extractEnergy(raw),
    tempo: extractTempo(raw),
    instrumentation,
    descriptors: extractDescriptors(raw),
    bpm: extractBpm(raw),
    musicalKey: extractKey(raw),
  };
}

// ─── Replicate Call ──────────────────────────────────────────────────────────

async function callReplicateAnalysis(audioUrl: string): Promise<string | null> {
  const modelId = process.env.REPLICATE_ANALYSIS_MODEL;
  if (!modelId) return null;

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const ANALYSIS_TIMEOUT_MS = 60_000;

  const output = await Promise.race([
    replicate.run(modelId as `${string}/${string}`, {
      input: {
        audio: audioUrl,
        audio_input: audioUrl,       // support different model param names
        model_instructions:
          "Describe this music in detail. Include: genre, mood, energy level, tempo, key instruments, BPM if detectable, musical key if detectable, and general atmosphere. Be specific.",
      },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Analysis timed out")), ANALYSIS_TIMEOUT_MS)
    ),
  ]);

  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.join("");
  if (output && typeof output === "object") return JSON.stringify(output);
  return null;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Runs audio analysis for a given ReferenceTrack.
 * Updates the DB record with results.
 * Returns the structured result (or a minimal result on failure).
 */
export async function analyseAudio(
  referenceTrackId: string
): Promise<AudioAnalysisResult> {
  // Fetch track record
  const track = await prisma.referenceTrack.findUnique({
    where: { id: referenceTrackId },
  });

  if (!track) {
    throw new Error(`ReferenceTrack not found: ${referenceTrackId}`);
  }

  // Mark as processing
  await prisma.referenceTrack.update({
    where: { id: referenceTrackId },
    data: { analysisStatus: "PROCESSING" },
  });

  try {
    // Attempt AI analysis
    const rawText = await callReplicateAnalysis(track.blobUrl);

    let parsed: Omit<AudioAnalysisResult, "rawText">;

    if (rawText) {
      parsed = parseAnalysisText(rawText);
    } else {
      // No model configured — return empty semantic fields, keep for manual entry
      parsed = {
        genre: null,
        genres: [],
        mood: null,
        moods: [],
        energy: null,
        tempo: null,
        instrumentation: [],
        descriptors: [],
        bpm: null,
        musicalKey: null,
      };
    }

    // Persist results
    await prisma.referenceTrack.update({
      where: { id: referenceTrackId },
      data: {
        analysisStatus: "COMPLETED",
        genre: parsed.genre,
        mood: parsed.mood,
        energy: parsed.energy,
        instrumentation: parsed.instrumentation,
        descriptors: parsed.descriptors,
        bpm: parsed.bpm,
        musicalKey: parsed.musicalKey,
        analysisRawResponse: rawText
          ? { text: rawText }
          : { note: "No analysis model configured" },
      },
    });

    return { ...parsed, rawText };
  } catch (err) {
    // Mark as failed but don't throw — let the user manually fill fields
    await prisma.referenceTrack.update({
      where: { id: referenceTrackId },
      data: {
        analysisStatus: "FAILED",
        analysisRawResponse: {
          error: err instanceof Error ? err.message : "Unknown error",
        },
      },
    });

    return {
      genre: null,
      genres: [],
      mood: null,
      moods: [],
      energy: null,
      tempo: null,
      instrumentation: [],
      descriptors: [],
      bpm: null,
      musicalKey: null,
      rawText: null,
    };
  }
}
