import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Wand2,
  Piano,
  Music,
  Clock,
  Play,
  Download,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [themeCount, generationCount, totalDurationResult, recentGenerations] =
    await Promise.all([
      prisma.soundTheme.count({ where: { userId } }),
      prisma.generation.count({ where: { userId } }),
      prisma.generation.aggregate({
        where: { userId, status: "SUCCEEDED" },
        _sum: { duration: true },
      }),
      prisma.generation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { theme: { select: { name: true } } },
      }),
    ]);

  const totalDuration = totalDurationResult._sum.duration || 0;

  function formatDuration(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  function formatTimeAgo(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const statusColor: Record<string, string> = {
    SUCCEEDED:
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PROCESSING:
      "bg-amber-500/10 text-amber-500 border-amber-500/20",
    PENDING:
      "bg-blue-500/10 text-blue-500 border-blue-500/20",
    FAILED:
      "bg-red-500/10 text-red-500 border-red-500/20",
    CANCELLED:
      "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name?.split(" ")[0] || "Creator"}. Here&apos;s your studio at a glance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Sound Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{themeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {themeCount === 0
                ? "Create your first theme"
                : `${themeCount} style${themeCount !== 1 ? "s" : ""} defined`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{generationCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {generationCount === 0
                ? "No tracks yet"
                : `${generationCount} track${generationCount !== 1 ? "s" : ""} created`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatDuration(totalDuration)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of generated audio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/themes/new">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">New Theme</p>
                  <p className="text-xs text-muted-foreground">
                    Define your sound style
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/generate">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Generate Music</p>
                  <p className="text-xs text-muted-foreground">
                    Create AI-powered tracks
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/synthesizer">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                  <Piano className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Synthesizer</p>
                  <p className="text-xs text-muted-foreground">
                    Create sounds manually
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Generations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Generations</h2>
          {generationCount > 0 && (
            <Link
              href="/library"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentGenerations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-3">
                No generations yet. Create a theme to get started!
              </p>
              <Link href="/themes/new">
                <Button>Create Your First Theme</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentGenerations.map((gen) => (
              <Card key={gen.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                    <Music className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {gen.contextDescription || "Untitled generation"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {gen.theme?.name && (
                        <span className="text-xs text-muted-foreground">
                          {gen.theme.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {gen.duration}s
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(gen.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={statusColor[gen.status] || ""}
                  >
                    {gen.status.toLowerCase()}
                  </Badge>
                  {gen.status === "SUCCEEDED" && gen.audioUrl && (
                    <div className="flex gap-1 shrink-0">
                      <a
                        href={gen.audioUrl}
                        download
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
