"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Library as LibraryIcon,
  Search,
  Download,
  Music,
  Loader2,
  Play,
  Pause,
  Clock,
  Wand2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface Generation {
  id: string;
  status: string;
  prompt: string;
  contextDescription: string | null;
  duration: number;
  audioUrl: string | null;
  audioFormat: string;
  createdAt: string;
  completedAt: string | null;
  theme: { name: string } | null;
}

export default function LibraryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "50");

    const res = await fetch(`/api/generations?${params}`);
    if (res.ok) {
      const data = await res.json();
      setGenerations(data.generations);
      setTotal(data.total);
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function handlePlay(gen: Generation) {
    if (playingId === gen.id) {
      audioRef?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef) {
      audioRef.pause();
    }

    const audio = new Audio(gen.audioUrl!);
    audio.addEventListener("ended", () => setPlayingId(null));
    audio.play();
    setAudioRef(audio);
    setPlayingId(gen.id);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const statusColor: Record<string, string> = {
    SUCCEEDED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PROCESSING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    PENDING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
    CANCELLED: "bg-muted text-muted-foreground border-border",
  };

  const succeededCount = generations.filter(
    (g) => g.status === "SUCCEEDED"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-muted-foreground">
          All your generated and recorded sounds in one place.{" "}
          {total > 0 && `${total} total tracks.`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : generations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LibraryIcon className="h-10 w-10 text-muted-foreground mb-3" />
            {search || statusFilter !== "all" ? (
              <>
                <p className="font-medium mb-1">No matching tracks</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search or filter.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium mb-1">Your library is empty</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Generated tracks will appear here once you create some music.
                </p>
                <Link href="/generate">
                  <Button>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Your First Track
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {generations.map((gen) => (
            <Card
              key={gen.id}
              className="group hover:border-primary/30 transition-colors"
            >
              <CardContent className="flex items-center gap-4 p-4">
                {/* Play button */}
                {gen.status === "SUCCEEDED" && gen.audioUrl ? (
                  <button
                    onClick={() => handlePlay(gen)}
                    className="rounded-full bg-primary/10 p-2.5 shrink-0 hover:bg-primary/20 transition-colors"
                  >
                    {playingId === gen.id ? (
                      <Pause className="h-4 w-4 text-primary" />
                    ) : (
                      <Play className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ) : (
                  <div className="rounded-full bg-muted p-2.5 shrink-0">
                    <Music className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {gen.contextDescription || "Untitled generation"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {gen.theme?.name && (
                      <span className="text-xs text-muted-foreground">
                        {gen.theme.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {gen.duration}s
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(gen.createdAt)} at {formatTime(gen.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <Badge
                  variant="outline"
                  className={`shrink-0 ${statusColor[gen.status] || ""}`}
                >
                  {gen.status === "PROCESSING" && (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  )}
                  {gen.status.toLowerCase()}
                </Badge>

                {/* Actions */}
                {gen.status === "SUCCEEDED" && gen.audioUrl && (
                  <a
                    href={gen.audioUrl}
                    download
                    className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </CardContent>

              {/* Audio player (shown when playing) */}
              {playingId === gen.id && gen.audioUrl && (
                <div className="px-4 pb-4">
                  <audio
                    controls
                    autoPlay
                    className="w-full h-8"
                    src={gen.audioUrl}
                    onEnded={() => setPlayingId(null)}
                  />
                </div>
              )}
            </Card>
          ))}

          {total > generations.length && (
            <p className="text-center text-sm text-muted-foreground pt-2">
              Showing {generations.length} of {total} tracks
            </p>
          )}
        </div>
      )}
    </div>
  );
}
