"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GENRES, MOODS, ERAS, TEMPOS, INSTRUMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, Loader2, Music, FileAudio } from "lucide-react";
import Link from "next/link";

interface ReferenceTrack {
  id: string;
  originalFilename: string;
  blobUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  duration: number | null;
  genre: string | null;
  mood: string | null;
  energy: string | null;
  bpm: number | null;
  musicalKey: string | null;
  analysisStatus: string;
}

interface SoundTheme {
  id: string;
  name: string;
  description: string;
  genres: string[];
  moods: string[];
  era: string | null;
  tempo: string | null;
  instruments: string[];
  exampleUrls: string[];
  isDefault: boolean;
  promptBase: string;
  referenceTrack?: ReferenceTrack | null;
}

interface FormState {
  name: string;
  description: string;
  genres: string[];
  moods: string[];
  era: string | null;
  tempo: string | null;
  instruments: string[];
  isDefault: boolean;
}

function ToggleBadge({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer select-none",
        selected
          ? "bg-purple-600 border-purple-600 text-white"
          : "border-zinc-700 text-zinc-400 hover:border-purple-500 hover:text-purple-300"
      )}
    >
      {label}
    </button>
  );
}

function SingleSelectBadge({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer select-none",
        selected
          ? "bg-purple-600 border-purple-600 text-white"
          : "border-zinc-700 text-zinc-400 hover:border-purple-500 hover:text-purple-300"
      )}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium text-zinc-300 mb-2">{children}</p>
  );
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EditThemePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [theme, setTheme] = useState<SoundTheme | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    genres: [],
    moods: [],
    era: null,
    tempo: null,
    instruments: [],
    isDefault: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/themes/${id}`);
        if (res.status === 404 || res.status === 403) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load theme");
        const data: SoundTheme = await res.json();
        setTheme(data);
        setForm({
          name: data.name,
          description: data.description,
          genres: data.genres,
          moods: data.moods,
          era: data.era,
          tempo: data.tempo,
          instruments: data.instruments,
          isDefault: data.isDefault,
        });
      } catch {
        toast.error("Could not load theme");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function toggleMulti(field: "genres" | "moods" | "instruments", value: string) {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function toggleSingle(field: "era" | "tempo", value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field] === value ? null : value,
    }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Theme name is required";
    if (form.name.length > 100) e.name = "Max 100 characters";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.description.length > 1000) e.description = "Max 1000 characters";
    if (form.genres.length === 0) e.genres = "Select at least one genre";
    if (form.moods.length === 0) e.moods = "Select at least one mood";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/themes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          genres: form.genres,
          moods: form.moods,
          era: form.era,
          tempo: form.tempo,
          instruments: form.instruments,
          isDefault: form.isDefault,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Save failed");
      }

      toast.success("Theme saved");
      router.push("/themes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save theme");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (notFound || !theme) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-zinc-400">Theme not found.</p>
        <Link href="/themes">
          <Button variant="outline">Back to themes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/themes">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Themes
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Music className="h-5 w-5 text-purple-400" />
          Edit Theme
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Update your Sound Theme&apos;s style, mood, and instrumentation.
        </p>
      </div>

      {/* Reference track — read only */}
      {theme.referenceTrack && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              Reference Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm text-zinc-200 font-medium truncate">
              {theme.referenceTrack.originalFilename}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              {theme.referenceTrack.duration && (
                <span>{theme.referenceTrack.duration}s</span>
              )}
              <span>{formatBytes(theme.referenceTrack.fileSize)}</span>
              {theme.referenceTrack.bpm && (
                <span>{theme.referenceTrack.bpm} BPM</span>
              )}
              {theme.referenceTrack.musicalKey && (
                <span>Key: {theme.referenceTrack.musicalKey}</span>
              )}
              <span
                className={cn(
                  "capitalize",
                  theme.referenceTrack.analysisStatus === "COMPLETED"
                    ? "text-green-400"
                    : theme.referenceTrack.analysisStatus === "FAILED"
                    ? "text-red-400"
                    : "text-yellow-400"
                )}
              >
                {theme.referenceTrack.analysisStatus.toLowerCase()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name" className="text-zinc-300">
          Theme Name
        </Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => {
            setForm((p) => ({ ...p, name: e.target.value }));
            setErrors((p) => ({ ...p, name: undefined }));
          }}
          placeholder="e.g. Chill Sunset Vibes"
          className="bg-zinc-900 border-zinc-700 text-zinc-100"
          maxLength={100}
        />
        {errors.name && (
          <p className="text-xs text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description" className="text-zinc-300">
          Description
        </Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => {
            setForm((p) => ({ ...p, description: e.target.value }));
            setErrors((p) => ({ ...p, description: undefined }));
          }}
          placeholder="Describe your channel's sound and what you create…"
          className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[80px] resize-none"
          maxLength={1000}
        />
        {errors.description && (
          <p className="text-xs text-red-400">{errors.description}</p>
        )}
      </div>

      <Separator className="border-zinc-800" />

      {/* Genres */}
      <div>
        <SectionLabel>Genres</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <ToggleBadge
              key={g}
              label={g}
              selected={form.genres.includes(g)}
              onClick={() => toggleMulti("genres", g)}
            />
          ))}
        </div>
        {errors.genres && (
          <p className="text-xs text-red-400 mt-1">{errors.genres}</p>
        )}
      </div>

      {/* Moods */}
      <div>
        <SectionLabel>Moods</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <ToggleBadge
              key={m}
              label={m}
              selected={form.moods.includes(m)}
              onClick={() => toggleMulti("moods", m)}
            />
          ))}
        </div>
        {errors.moods && (
          <p className="text-xs text-red-400 mt-1">{errors.moods}</p>
        )}
      </div>

      <Separator className="border-zinc-800" />

      {/* Era */}
      <div>
        <SectionLabel>Era <span className="text-zinc-600 font-normal">(optional)</span></SectionLabel>
        <div className="flex flex-wrap gap-2">
          {ERAS.map((e) => (
            <SingleSelectBadge
              key={e}
              label={e}
              selected={form.era === e}
              onClick={() => toggleSingle("era", e)}
            />
          ))}
        </div>
      </div>

      {/* Tempo */}
      <div>
        <SectionLabel>Tempo <span className="text-zinc-600 font-normal">(optional)</span></SectionLabel>
        <div className="flex flex-wrap gap-2">
          {TEMPOS.map((t) => (
            <SingleSelectBadge
              key={t}
              label={t}
              selected={form.tempo === t}
              onClick={() => toggleSingle("tempo", t)}
            />
          ))}
        </div>
      </div>

      <Separator className="border-zinc-800" />

      {/* Instruments */}
      <div>
        <SectionLabel>Instruments <span className="text-zinc-600 font-normal">(optional)</span></SectionLabel>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENTS.map((i) => (
            <ToggleBadge
              key={i}
              label={i}
              selected={form.instruments.includes(i)}
              onClick={() => toggleMulti("instruments", i)}
            />
          ))}
        </div>
      </div>

      <Separator className="border-zinc-800" />

      {/* Default theme toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={form.isDefault}
          onClick={() => setForm((p) => ({ ...p, isDefault: !p.isDefault }))}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            form.isDefault ? "bg-purple-600" : "bg-zinc-700"
          )}
        >
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
              form.isDefault ? "translate-x-[18px]" : "translate-x-1"
            )}
          />
        </button>
        <div>
          <p className="text-sm font-medium text-zinc-300">Default theme</p>
          <p className="text-xs text-zinc-500">
            Auto-selected when you start a new generation
          </p>
        </div>
      </div>

      {/* Prompt preview */}
      <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-3">
        <p className="text-xs text-zinc-500 mb-1">Current AI prompt base</p>
        <p className="text-xs text-zinc-400 font-mono leading-relaxed">
          {theme.promptBase}
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          Saving will regenerate this from your updated settings.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button
          variant="ghost"
          disabled={saving}
          className="text-zinc-400 hover:text-zinc-100"
          onClick={() => router.push("/themes")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
