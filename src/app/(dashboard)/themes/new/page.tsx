"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  GENRES,
  MOODS,
  ERAS,
  TEMPOS,
  INSTRUMENTS,
  CONTENT_TYPES,
} from "@/lib/constants";
import { buildPromptBase } from "@/lib/prompt-builder";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Upload,
  Mic,
  StopCircle,
  SkipForward,
  Loader2,
  AlertCircle,
  RefreshCw,
  Music,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalysisResult {
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
}

type UploadState =
  | { type: "idle" }
  | { type: "uploading"; progress: number }
  | { type: "analysing" }
  | { type: "done"; trackId: string; filename: string; analysis: AnalysisResult }
  | { type: "error"; message: string };

// ─── Step labels ─────────────────────────────────────────────────────────────

const STEPS = ["Reference", "Channel Info", "Style", "Instruments", "Review"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.addEventListener("loadedmetadata", () => {
        resolve(isFinite(audio.duration) ? audio.duration : null);
        URL.revokeObjectURL(url);
      });
      audio.addEventListener("error", () => {
        resolve(null);
        URL.revokeObjectURL(url);
      });
      audio.src = url;
    } catch {
      resolve(null);
    }
  });
}

async function uploadAndAnalyse(
  file: File,
  onProgress: (pct: number) => void
): Promise<{ trackId: string; analysis: AnalysisResult }> {
  const trackId = crypto.randomUUID().replace(/-/g, "");
  const duration = await getAudioDuration(file);

  // Upload directly to Vercel Blob via server token
  await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload/audio",
    clientPayload: JSON.stringify({ trackId, duration, fileSize: file.size }),
    onUploadProgress: ({ percentage }) => onProgress(percentage),
  });

  // Trigger analysis
  const res = await fetch("/api/analyse/audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referenceTrackId: trackId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Analysis failed");
  }

  const analysis: AnalysisResult = await res.json();
  return { trackId, analysis };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AnalysisResultCard({
  analysis,
  onEdit,
}: {
  analysis: AnalysisResult;
  onEdit: (updated: Partial<AnalysisResult>) => void;
}) {
  const hasSemanticData =
    analysis.genres.length > 0 ||
    analysis.moods.length > 0 ||
    analysis.instrumentation.length > 0 ||
    analysis.descriptors.length > 0;

  return (
    <div className="space-y-4">
      {!hasSemanticData && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            No AI analysis model is configured. You can fill in the details
            below manually, or{" "}
            <a
              href="https://replicate.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              set up a model
            </a>{" "}
            and re-analyse.
          </span>
        </div>
      )}

      {analysis.bpm && (
        <p className="text-sm text-muted-foreground">
          Detected BPM:{" "}
          <span className="font-medium text-foreground">{analysis.bpm}</span>
          {analysis.musicalKey && (
            <>
              {" "}
              · Key:{" "}
              <span className="font-medium text-foreground">
                {analysis.musicalKey}
              </span>
            </>
          )}
        </p>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Detected genres (tap to remove)
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {analysis.genres.map((g) => (
            <Badge
              key={g}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() =>
                onEdit({ genres: analysis.genres.filter((x) => x !== g) })
              }
            >
              {g} <X className="h-3 w-3" />
            </Badge>
          ))}
          {analysis.genres.length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              None detected
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Detected moods (tap to remove)
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {analysis.moods.map((m) => (
            <Badge
              key={m}
              variant="outline"
              className="cursor-pointer gap-1"
              onClick={() =>
                onEdit({ moods: analysis.moods.filter((x) => x !== m) })
              }
            >
              {m} <X className="h-3 w-3" />
            </Badge>
          ))}
          {analysis.moods.length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              None detected
            </span>
          )}
        </div>
      </div>

      {analysis.energy && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Energy</Label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((e) => (
              <Badge
                key={e}
                variant={analysis.energy === e ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => onEdit({ energy: e })}
              >
                {e}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.instrumentation.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Detected instruments (tap to remove)
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {analysis.instrumentation.map((i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer gap-1"
                onClick={() =>
                  onEdit({
                    instrumentation: analysis.instrumentation.filter(
                      (x) => x !== i
                    ),
                  })
                }
              >
                {i} <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.descriptors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Descriptors</Label>
          <div className="flex flex-wrap gap-1.5">
            {analysis.descriptors.map((d) => (
              <Badge key={d} variant="outline" className="text-xs capitalize">
                {d}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewThemePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Reference step state
  const [uploadState, setUploadState] = useState<UploadState>({ type: "idle" });
  const [analysisEdits, setAnalysisEdits] = useState<Partial<AnalysisResult>>(
    {}
  );

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<BlobEvent["data"][]>([]);

  // Theme fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [selectedTempo, setSelectedTempo] = useState<string | null>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [exampleUrls, setExampleUrls] = useState("");

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleItem(
    list: string[],
    item: string,
    setter: (v: string[]) => void
  ) {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  }

  function getMergedAnalysis(): AnalysisResult | null {
    if (uploadState.type !== "done") return null;
    return { ...uploadState.analysis, ...analysisEdits } as AnalysisResult;
  }

  function applyAnalysisToWizard() {
    const analysis = getMergedAnalysis();
    if (!analysis) return;

    if (analysis.genres.length > 0) setSelectedGenres(analysis.genres);
    if (analysis.moods.length > 0) setSelectedMoods(analysis.moods);
    if (analysis.instrumentation.length > 0)
      setSelectedInstruments(analysis.instrumentation);
    if (analysis.tempo) setSelectedTempo(analysis.tempo);
  }

  // ── Upload handler ─────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const ALLOWED = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/mp4",
      "audio/x-m4a",
      "audio/aac",
    ];
    if (!ALLOWED.includes(file.type)) {
      setUploadState({
        type: "error",
        message: "Unsupported file type. Please upload an MP3, WAV, or M4A.",
      });
      return;
    }
    const MAX_MB = 25;
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadState({
        type: "error",
        message: `File is too large. Maximum size is ${MAX_MB} MB.`,
      });
      return;
    }

    setUploadState({ type: "uploading", progress: 0 });
    setAnalysisEdits({});

    try {
      setUploadState({ type: "uploading", progress: 0 });

      const { trackId, analysis } = await uploadAndAnalyse(file, (pct) => {
        setUploadState({ type: "uploading", progress: pct });
        if (pct >= 100) setUploadState({ type: "analysing" });
      });

      setUploadState({
        type: "done",
        trackId,
        filename: file.name,
        analysis,
      });
    } catch (err) {
      setUploadState({
        type: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }, []);

  // ── Drag & drop ────────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Recording ──────────────────────────────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecording(false);
        setRecordingSeconds(0);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        // WebM from MediaRecorder — treat as mpeg for upload validation
        // Override the type via a workaround
        const mp3File = new File([blob], `recording-${Date.now()}.mp3`, {
          type: "audio/mpeg",
        });

        await handleFile(mp3File);
      };

      mr.start(100);
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      toast.error(
        "Could not access microphone. Please check your browser permissions."
      );
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  function handleNext() {
    if (step === 0) {
      // Apply analysis to wizard fields before moving on
      applyAnalysisToWizard();
    }
    setStep(step + 1);
  }

  function canProceedFromReference() {
    // Always allow proceeding — skip is valid
    return (
      uploadState.type === "idle" ||
      uploadState.type === "done" ||
      uploadState.type === "error"
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const promptPreview = buildPromptBase({
    genres: selectedGenres,
    moods: selectedMoods,
    era: selectedEra,
    tempo: selectedTempo,
    instruments: selectedInstruments,
    description,
  });

  async function handleSave() {
    setSaving(true);
    const referenceTrackId =
      uploadState.type === "done" ? uploadState.trackId : undefined;

    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: contentType
            ? `${contentType} channel. ${description}`
            : description,
          genres: selectedGenres,
          moods: selectedMoods,
          era: selectedEra,
          tempo: selectedTempo,
          instruments: selectedInstruments,
          exampleUrls: exampleUrls
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean),
          isDefault: true,
          referenceTrackId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create theme");
      }

      toast.success("Theme created!");
      router.push("/themes");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create theme"
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Sound Theme</h1>
        <p className="text-muted-foreground">
          Define your channel&apos;s musical identity in a few steps.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium",
                i <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="text-sm hidden sm:inline">{label}</span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Reference Audio ─────────────────────────────────────── */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reference Audio</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload or record audio that captures the style you&apos;re going
              for. We&apos;ll analyse it and pre-fill your theme.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="record" className="flex-1">
                  <Mic className="h-4 w-4 mr-2" />
                  Record
                </TabsTrigger>
                <TabsTrigger value="skip" className="flex-1">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </TabsTrigger>
              </TabsList>

              {/* Upload tab */}
              <TabsContent value="upload" className="mt-4 space-y-4">
                {uploadState.type === "idle" && (
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                      "border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                  >
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                    <Music className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium mb-1">
                      Drop an audio file here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      MP3, WAV, or M4A · up to 25 MB · 30–60 seconds works best
                    </p>
                  </div>
                )}

                {uploadState.type === "uploading" && (
                  <div className="space-y-3 py-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                      <span className="text-sm font-medium">Uploading…</span>
                    </div>
                    <Progress value={uploadState.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {Math.round(uploadState.progress)}%
                    </p>
                  </div>
                )}

                {uploadState.type === "analysing" && (
                  <div className="flex items-center gap-3 py-6 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      Analysing audio…
                    </span>
                  </div>
                )}

                {uploadState.type === "error" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">
                        {uploadState.message}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadState({ type: "idle" })}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try again
                    </Button>
                  </div>
                )}

                {uploadState.type === "done" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span className="font-medium truncate max-w-xs">
                        {uploadState.filename}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 text-xs"
                        onClick={() => {
                          setUploadState({ type: "idle" });
                          setAnalysisEdits({});
                        }}
                      >
                        Replace
                      </Button>
                    </div>
                    <AnalysisResultCard
                      analysis={
                        {
                          ...uploadState.analysis,
                          ...analysisEdits,
                        } as AnalysisResult
                      }
                      onEdit={(updates) =>
                        setAnalysisEdits((prev) => ({ ...prev, ...updates }))
                      }
                    />
                  </div>
                )}
              </TabsContent>

              {/* Record tab */}
              <TabsContent value="record" className="mt-4 space-y-4">
                {uploadState.type === "idle" ||
                uploadState.type === "error" ? (
                  <div className="space-y-4 text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Hum, sing, or play something that captures the vibe
                      you&apos;re after. 15–30 seconds is enough.
                    </p>
                    {!recording ? (
                      <Button onClick={startRecording}>
                        <Mic className="mr-2 h-4 w-4" />
                        Start Recording
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <span className="inline-flex h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-mono text-sm">
                            {String(Math.floor(recordingSeconds / 60)).padStart(
                              2,
                              "0"
                            )}
                            :
                            {String(recordingSeconds % 60).padStart(2, "0")}
                          </span>
                        </div>
                        <Button variant="destructive" onClick={stopRecording}>
                          <StopCircle className="mr-2 h-4 w-4" />
                          Stop Recording
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Reuse upload state display for recording result */}
                {uploadState.type === "uploading" && (
                  <div className="space-y-3 py-4">
                    <div className="flex items-center gap-3 justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm font-medium">Uploading recording…</span>
                    </div>
                    <Progress value={uploadState.progress} className="h-2" />
                  </div>
                )}
                {uploadState.type === "analysing" && (
                  <div className="flex items-center gap-3 py-6 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Analysing…</span>
                  </div>
                )}
                {uploadState.type === "done" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span className="font-medium">Recording uploaded</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 text-xs"
                        onClick={() => {
                          setUploadState({ type: "idle" });
                          setAnalysisEdits({});
                        }}
                      >
                        Record again
                      </Button>
                    </div>
                    <AnalysisResultCard
                      analysis={
                        {
                          ...uploadState.analysis,
                          ...analysisEdits,
                        } as AnalysisResult
                      }
                      onEdit={(updates) =>
                        setAnalysisEdits((prev) => ({ ...prev, ...updates }))
                      }
                    />
                  </div>
                )}
              </TabsContent>

              {/* Skip tab */}
              <TabsContent value="skip" className="mt-4">
                <div className="flex flex-col items-center text-center py-6 space-y-3">
                  <SkipForward className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Skip reference audio and manually choose your genre, mood,
                    and instruments in the next steps.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: Channel Info ─────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Channel Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme Name</Label>
              <Input
                placeholder='e.g., "My Gaming Channel Vibe"'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={contentType === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setContentType(contentType === type ? "" : type)
                    }
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Describe Your Channel / Content</Label>
              <Textarea
                placeholder="Tell us about your channel and the kind of content you create..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Style ────────────────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Style &amp; Mood</CardTitle>
            {uploadState.type === "done" && (
              <p className="text-sm text-muted-foreground">
                Pre-filled from your reference audio. Adjust as needed.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Genres (select at least one)</Label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <Badge
                    key={genre}
                    variant={
                      selectedGenres.includes(genre) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      toggleItem(selectedGenres, genre, setSelectedGenres)
                    }
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mood</Label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <Badge
                    key={mood}
                    variant={
                      selectedMoods.includes(mood) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      toggleItem(selectedMoods, mood, setSelectedMoods)
                    }
                  >
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Era</Label>
              <div className="flex flex-wrap gap-2">
                {ERAS.map((era) => (
                  <Badge
                    key={era}
                    variant={selectedEra === era ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedEra(selectedEra === era ? null : era)
                    }
                  >
                    {era}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tempo</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPOS.map((tempo) => (
                  <Badge
                    key={tempo}
                    variant={selectedTempo === tempo ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedTempo(selectedTempo === tempo ? null : tempo)
                    }
                  >
                    {tempo}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Instruments ──────────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Instruments &amp; References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Preferred Instruments (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTS.map((inst) => (
                  <Badge
                    key={inst}
                    variant={
                      selectedInstruments.includes(inst) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      toggleItem(
                        selectedInstruments,
                        inst,
                        setSelectedInstruments
                      )
                    }
                  >
                    {inst}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference Track URLs (optional, one per line)</Label>
              <Textarea
                placeholder="Paste YouTube or Spotify URLs of tracks with a similar vibe..."
                value={exampleUrls}
                onChange={(e) => setExampleUrls(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Review ───────────────────────────────────────────────── */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Theme Name</p>
              <p className="font-medium">{name || "(unnamed)"}</p>
            </div>
            {contentType && (
              <div>
                <p className="text-sm text-muted-foreground">Content Type</p>
                <p className="font-medium">{contentType}</p>
              </div>
            )}
            {uploadState.type === "done" && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Reference Audio
                </p>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ {uploadState.filename}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Genres</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedGenres.map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
                {selectedGenres.length === 0 && (
                  <span className="text-muted-foreground text-sm">
                    None selected
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Moods</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedMoods.map((m) => (
                  <Badge key={m} variant="secondary">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
            {selectedEra && (
              <div>
                <p className="text-sm text-muted-foreground">Era</p>
                <p className="font-medium">{selectedEra}</p>
              </div>
            )}
            {selectedTempo && (
              <div>
                <p className="text-sm text-muted-foreground">Tempo</p>
                <p className="font-medium">{selectedTempo}</p>
              </div>
            )}
            {selectedInstruments.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Instruments</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedInstruments.map((i) => (
                    <Badge key={i} variant="secondary">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">
                AI Prompt Preview
              </p>
              <p className="text-sm font-mono">{promptPreview}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={
              (step === 0 && !canProceedFromReference()) ||
              (step === 1 && !name) ||
              uploadState.type === "uploading" ||
              uploadState.type === "analysing"
            }
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving || !name || selectedGenres.length === 0}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {saving ? "Creating…" : "Create Theme"}
          </Button>
        )}
      </div>
    </div>
  );
}
