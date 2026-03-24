"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  Loader2,
  Play,
  Pause,
  Download,
  Palette,
  Plus,
  Clock,
  Music,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Theme {
  id: string;
  name: string;
  genres: string[];
  moods: string[];
  isDefault: boolean;
}

interface GenerationResult {
  id: string;
  audioUrl?: string;
  status: string;
  contextDescription?: string;
  duration?: number;
}

export default function GeneratePage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [contextDescription, setContextDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadThemes() {
      const res = await fetch("/api/themes");
      if (res.ok) {
        const data = await res.json();
        setThemes(data);
        const defaultTheme = data.find((t: Theme) => t.isDefault);
        if (defaultTheme) {
          setSelectedThemeId(defaultTheme.id);
        } else if (data.length > 0) {
          setSelectedThemeId(data[0].id);
        }
      }
      setLoadingThemes(false);
    }
    loadThemes();
  }, []);

  async function handleGenerate() {
    if (!selectedThemeId) {
      toast.error("Please select a theme first");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: selectedThemeId,
          contextDescription,
          duration,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      const newResult: GenerationResult = {
        ...data,
        contextDescription,
        duration,
      };
      setResults((prev) => [newResult, ...prev]);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/generate/${data.id}`);
        const statusData = await statusRes.json();

        if (statusData.status === "SUCCEEDED") {
          clearInterval(pollInterval);
          setResults((prev) =>
            prev.map((r) =>
              r.id === data.id
                ? { ...r, ...statusData }
                : r
            )
          );
          setGenerating(false);
          toast.success("Music generated!");
        } else if (statusData.status === "FAILED") {
          clearInterval(pollInterval);
          setResults((prev) =>
            prev.map((r) =>
              r.id === data.id
                ? { ...r, ...statusData }
                : r
            )
          );
          setGenerating(false);
          toast.error("Generation failed");
        }
      }, 3000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Generation failed"
      );
      setGenerating(false);
    }
  }

  function handlePlay(result: GenerationResult) {
    if (playingId === result.id) {
      audioEl?.pause();
      setPlayingId(null);
      return;
    }
    if (audioEl) audioEl.pause();

    const audio = new Audio(result.audioUrl!);
    audio.addEventListener("ended", () => setPlayingId(null));
    audio.play();
    setAudioEl(audio);
    setPlayingId(result.id);
  }

  function handleRegenerate(result: GenerationResult) {
    if (result.contextDescription) {
      setContextDescription(result.contextDescription);
    }
    if (result.duration) {
      setDuration(result.duration);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Settings loaded â tweak and regenerate!");
  }

  const selectedTheme = themes.find((t) => t.id === selectedThemeId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generate Music</h1>
        <p className="text-muted-foreground">
          Describe the scene and we&apos;ll create the perfect soundtrack.
        </p>
      </div>

      {/* Theme selector */}
      {loadingThemes ? (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : themes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Palette className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-medium mb-1">No themes yet</p>
            <p className="text-sm text-muted-foreground mb-3">
              You need at least one theme to generate music.
            </p>
            <Link href="/themes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Theme
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={selectedThemeId}
              onValueChange={setSelectedThemeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a theme..." />
              </SelectTrigger>
              <SelectContent>
                {themes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.isDefault ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTheme && (
              <div className="flex flex-wrap gap-1.5">
                {selectedTheme.genres.map((g) => (
                  <Badge key={g} variant="secondary" className="text-xs">
                    {g}
                  </Badge>
                ))}
                {selectedTheme.moods.slice(0, 3).map((m) => (
                  <Badge key={m} variant="outline" className="text-xs">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generation form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What&apos;s the music for?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Describe the scene or moment</Label>
            <Textarea
              placeholder='e.g., "Background music for setting up a tent in the woods at sunset"'
              value={contextDescription}
              onChange={(e) => setContextDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Duration: {duration} seconds
            </Label>
            <Slider
              min={5}
              max={30}
              step={5}
              value={[duration]}
              onValueChange={(v) => setDuration(Array.isArray(v) ? v[0] : v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5s</span>
              <span>15s</span>
              <span>30s</span>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={generating || !selectedThemeId}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Music
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {results.map((result) => (
            <Card key={result.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {result.status === "SUCCEEDED" && result.audioUrl ? (
                    <button
                      onClick={() => handlePlay(result)}
                      className="rounded-full bg-primary/10 p-2.5 shrink-0 hover:bg-primary/20 transition-colors"
                    >
                      {playingId === result.id ? (
                        <Pause className="h-4 w-4 text-primary" />
                      ) : (
                        <Play className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ) : result.status === "PROCESSING" ? (
                    <div className="rounded-full bg-amber-500/10 p-2.5 shrink-0">
                      <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                    </div>
                  ) : result.status === "FAILED" ? (
                    <div className="rounded-full bg-red-500/10 p-2.5 shrink-0">
                      <Music className="h-4 w-4 text-red-500" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-muted p-2.5 shrink-0">
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.contextDescription || "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.duration}s &middot; {result.status.toLowerCase()}
                    </p>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {result.status === "SUCCEEDED" && result.audioUrl && (
                      <>
                        <a
                          href={result.audioUrl}
                          download
                          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleRegenerate(result)}
                          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Regenerate with tweaks"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {playingId === result.id && result.audioUrl && (
                  <audio
                    controls
                    autoPlay
                    className="w-full h-8"
                    src={result.audioUrl}
                    onEnded={() => setPlayingId(null)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
