import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Wand2, Download, Palette } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">SoundForge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/synthesizer">
            <Button variant="ghost" size="sm">
              Try Synthesizer
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="rounded-full bg-primary-/10 p-4 mb-6">
          <Music className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Create Your Channel&apos;s
          <br />
          <span className="text-primary">Signature Sound</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          AI-powered music creation for YouTubers and content creators.
          Generate custom intros, background music, and themes that perfectly
          match your unique style.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/login">
            <Button size="lg" className="text-base px-8">
              Get Started Free
            </Button>
          </Link>
          <Link href="/synthesizer">
            <Button size="lg" variant="outline" className="text-base px-8">
              Try the Synthesizer
            </Button>
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">1. Define Your Vibe</h3>
            <p className="text-sm text-muted-foreground">
              Select genres, moods, era, and instruments to create your
              channel&apos;s unique sound theme.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">2. Generate Music</h3>
            <p className="text-sm text-muted-foreground">
              Describe the moment and our AI creates music that fits your
              scene while matching your established style.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">3. Download & Use</h3>
            <p className="text-sm text-muted-foreground">
              Stream directly or download as MP3. Use for intros, outros,
              background music, transitions, and more.
            </p>
          </div>
        </div>
      </section>
  
             `             `<footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        SoundForge - AI Music for Content Creators
      </footer>
    </div>
  );
}
