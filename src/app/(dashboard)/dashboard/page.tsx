import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Wand2, Piano, Music } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to SoundForge. Create your channel&apos;s signature sound.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sound Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Generations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0s</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/themes/new">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">New Theme</p>
                  <p className="text-xs text-muted-foreground">
                    Define your sound style
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/generate">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Generate Music</p>
                  <p className="text-xs text-muted-foreground">
                    Create AI-powered tracks
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/synthesizer">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Piano className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Synthesizer</p>
                  <p className="text-xs text-muted-foreground">
                    Create sounds manually
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Generations</h2>
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
      </div>
    </div>
  );
}
