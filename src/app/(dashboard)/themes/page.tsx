"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Palette,
  Star,
  Trash2,
  Loader2,
  Music,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { toast } from "sonner";

interface SoundTheme {
  id: string;
  name: string;
  description: string;
  genres: string[];
  moods: string[];
  era: string | null;
  tempo: string | null;
  instruments: string[];
  isDefault: boolean;
  createdAt: string;
  promptBase: string;
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<SoundTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchThemes() {
    const res = await fetch("/api/themes");
    if (res.ok) {
      const data = await res.json();
      setThemes(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchThemes();
  }, []);

  async function handleDelete(themeId: string) {
    if (!confirm("Delete this theme? This cannot be undone.")) return;

    setDeletingId(themeId);
    try {
      const res = await fetch(`/api/themes/${themeId}`, { method: "DELETE" });
      if (res.ok) {
        setThemes((prev) => prev.filter((t) => t.id !== themeId));
        toast.success("Theme deleted");
      } else {
        toast.error("Failed to delete theme");
      }
    } catch {
      toast.error("Failed to delete theme");
    }
    setDeletingId(null);
  }

  async function handleSetDefault(themeId: string) {
    try {
      const res = await fetch(`/api/themes/${themeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        setThemes((prev) =>
          prev.map((t) => ({ ...t, isDefault: t.id === themeId }))
        );
        toast.success("Default theme updated");
      }
    } catch {
      toast.error("Failed to update default theme");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sound Themes</h1>
          <p className="text-muted-foreground">
            Your channel&apos;s sound identity. Each theme defines a consistent
            style.
          </p>
        </div>
        <Link href="/themes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Theme
          </Button>
        </Link>
      </div>

      {themes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Palette className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No themes yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a sound theme to establish your channel&apos;s musical
              identity.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <Card
              key={theme.id}
              className={`relative group transition-colors ${
                theme.isDefault ? "border-primary/40" : "hover:border-primary/20"
              }`}
            >
              {theme.isDefault && (
                <div className="absolute top-3 right-12">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Default
                  </Badge>
                </div>
              )}

              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!theme.isDefault && (
                      <DropdownMenuItem
                        onClick={() => handleSetDefault(theme.id)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Link href="/generate" className="flex items-center w-full">
                        <Music className="mr-2 h-4 w-4" />
                        Generate with this theme
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(theme.id)}
                      className="text-destructive focus:text-destructive"
                      disabled={deletingId === theme.id}
                    >
                      {deletingId === theme.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardHeader className="pb-2 pr-24">
                <CardTitle className="text-lg">{theme.name}</CardTitle>
                {theme.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {theme.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {theme.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {theme.genres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
                {theme.moods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {theme.moods.map((mood) => (
                      <Badge
                        key={mood}
                        variant="outline"
                        className="text-xs"
                      >
                        {mood}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {theme.era && <span>{theme.era}</span>}
                  {theme.tempo && <span>{theme.tempo}</span>}
                  {theme.instruments.length > 0 && (
                    <span>
                      {theme.instruments.length} instrument
                      {theme.instruments.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
