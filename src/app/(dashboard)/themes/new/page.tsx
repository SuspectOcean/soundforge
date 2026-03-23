"use client";

import { useState } from "react";
import { Button } from "A/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "A/components/ui/input";
import { Textarea } from "A/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "A/components/ui/slider";
import { cn } from "A/lib/utils";
import { GENRES, MOODS, ERAS, TEMPOS, INSTRUMENTS, CONTENT_TYPES } from "A/lib/constants";
import { buildPromptBase } from "A/lib/prompt-builder";
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
        <h1>Create Theme</h1>
      </div>
    </div>
  
 "»
}
