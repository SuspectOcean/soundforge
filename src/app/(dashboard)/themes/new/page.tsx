"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { GENRES, MOODS, ERAS, TEMPOS, INSTRUMENTS, CONTENT_TYPES } from "@/lib/constants";
import { buildPromptBase } from "@/lib/prompt-builder";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STEPS = ["Channel Info", "Style", "Instruments", "Review"];

export default function NewThemePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [selectedTempo, setSelectedTempo] = useState<string | null>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [exampleUrls, setExampleUrls] = useState("");

  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  }

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
    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: contentType ? `${contentType} channel. ${description}` : description,
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create theme");
      }

      toast.success("Theme created!");
      router.push("/themes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create theme");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Sound Theme</h1>
        <p className="text-muted-foreground">
          Define your channel&apos;s musical identity in a few steps.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
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
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Channel Info */}
      {step === 0 && (
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

      {/* Step 2: Style */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Style & Mood</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Genres (select at least one)</Label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleItem(selectedGenres, genre, setSelectedGenres)}
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
                    variant={selectedMoods.includes(mood) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleItem(selectedMoods, mood, setSelectedMoods)}
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

      {/* Step 3: Instruments */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Instruments & References</CardTitle>
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

      {/* Step 4: Review */}
      {step === 3 && (
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
            <div>
              <p className="text-sm text-muted-foreground">Genres</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedGenres.map((g) => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
                {selectedGenres.length === 0 && (
                  <span className="text-muted-foreground text-sm">None selected</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Moods</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedMoods.map((m) => (
                  <Badge key={m} variant="secondary">{m}</Badge>
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
                    <Badge key={i} variant="secondary">{i}</Badge>
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
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && !name}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving || !name || selectedGenres.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            {saving ? "Creating..." : "Create Theme"}
          </Button>
        )}
      </div>
    </div>
  );
}
