import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Wand2, Download, Palette, Headphones, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Music className="h-5 w-5 text-primary" />
          </div>
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

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8">
          <Zap className="h-3.5 w-3.5" />
          AI-powered music for creators
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.1]">
          Create Your Channel&apos;s
          <br />
          <span className="text-primary">Signature Sound</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Generate custom intros, background music, and themes that perfectly
          match your unique style. Powered by AI, tailored to your brand.
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

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-3">How It Works</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Three simple steps to create professional-quality music for your content.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
            <div className="rounded-xl bg-primary/10 p-3.5 mb-4">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">1. Define Your Vibe</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select genres, moods, era, and instruments to create your
              channel&apos;s unique sound theme.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
            <div className="rounded-xl bg-primary/10 p-3.5 mb-4">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">2. Generate Music</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Describe the moment and AI creates music that fits your
              scene while matching your established style.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
            <div className="rounded-xl bg-primary/10 p-3.5 mb-4">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">3. Download &amp; Use</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Stream directly or download as MP3. Use for intros, outros,
              background music, transitions, and more.
            </p>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0 mt-0.5">
              <Headphones className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Brand Consistency</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every track matches your established sound identity.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0 mt-0.5">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Instant Creation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate custom tracks in seconds, not hours.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0 mt-0.5">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Royalty Free</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full rights to use in your content, no claims.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Music className="h-4 w-4" />
          <span className="font-medium">SoundForge</span>
        </div>
        AI Music for Content Creators
      </footer>
    </div>
  );
}
