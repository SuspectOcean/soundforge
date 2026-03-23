"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Wand2, Loader2, Play, Download } from "lucide-react";
import { toast } from "sonner";

export default function GeneratePage() {
  const [contextDescription, setContextDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    audioUrl?: string;
    status: string;
  } | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextDescription,
          duration,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setResult(data);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/generate/${data.id}`);
        const statusData = await statusRes.json();

        if (statusData.status === "SUCCEEDED") {
          clearInterval(pollInterval);
          setResult(statusData);
          setGenerating(false);
          toast.success("Music generated!");
        } else if (statusData.status === "FAILED") {
          clearInterval(pollInterval);
          setResult(statusData);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generate Music</h1>
        <p className="text-muted-foreground">
          Describe the scene and we&apos;ll create the perfect soundtrack.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What&apos;s the music for?</CardTitle>
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
            <Label>Duration: {duration} seconds</Label>
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
            disabled={generating}
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

      {/* Result */}
      {result && result.status === "SUCCEEDED" && result.audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Generated Track
              <Badge variant="secondary">
                {duration}s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <audio controls className="w-full" src={result.audioUrl}>
              Your browser does not support audio playback.
            </audio>
            <div className="flex gap-2">
              <a
                href={result.audioUrl}
                download
                className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                Download MP3
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {result && result.status === "PROCESSING" && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
            <span className="text-muted-foreground">
              AI is composing your track...
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
