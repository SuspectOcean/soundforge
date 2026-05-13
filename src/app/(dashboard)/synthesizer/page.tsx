"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Circle, Square, Triangle, Waves, Mic, StopCircle } from "lucide-react";

type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";

const OSCILLATOR_TYPES: { type: OscillatorType; icon: React.ElementType; label: string }[] = [
  { type: "sine", icon: Waves, label: "Sine" },
  { type: "square", icon: Square, label: "Square" },
  { type: "sawtooth", icon: Triangle, label: "Saw" },
  { type: "triangle", icon: Triangle, label: "Tri" },
];

const WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_KEYS = [
  { note: "C#", offset: 1 },
  { note: "D#", offset: 2 },
  { note: "F#", offset: 4 },
  { note: "G#", offset: 5 },
  { note: "A#", offset: 6 },
];

const KEY_MAP: Record<string, string> = {
  a: "C4", s: "D4", d: "E4", f: "F4", g: "G4", h: "A4", j: "B4", k: "C5",
  w: "C#4", e: "D#4", t: "F#4", y: "G#4", u: "A#4",
};

function sv(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

export default function SynthesizerPage() {
  const [toneLoaded, setToneLoaded] = useState(false);
  const [oscType, setOscType] = useState<OscillatorType>("sine");
  const [volume, setVolume] = useState(-6);
  const [attack, setAttack] = useState(0.1);
  const [decay, setDecay] = useState(0.2);
  const [sustain, setSustain] = useState(0.5);
  const [release, setRelease] = useState(0.8);
  const [filterFreq, setFilterFreq] = useState(2000);
  const [reverb, setReverb] = useState(0.3);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);

  const synthRef = useRef<any>(null);
  const reverbRef = useRef<any>(null);
  const filterRef = useRef<any>(null);
  const recorderRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Initialize Tone.js on first interaction
  const initTone = useCallback(async () => {
    if (toneLoaded) return;

    const Tone = await import("tone");
    await Tone.start();

    const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
    const filter = new Tone.Filter(2000, "lowpass").connect(reverb);
    const analyser = new Tone.Analyser("waveform", 256);
    filter.connect(analyser);

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 },
      volume: -6,
    }).connect(filter);

    synthRef.current = synth;
    reverbRef.current = reverb;
    filterRef.current = filter;
    analyserRef.current = analyser;

    // Recorder
    const recorder = new Tone.Recorder();
    Tone.getDestination().connect(recorder);
    recorderRef.current = recorder;

    setToneLoaded(true);

    // Start visualizer
    drawWaveform(analyser);
  }, [toneLoaded]);

  function drawWaveform(analyser: any) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      const values = analyser.getValue() as Float32Array;
      const w = canvas!.width;
      const h = canvas!.height;

      ctx!.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx!.fillRect(0, 0, w, h);
      ctx!.strokeStyle = "#7c3aed";
      ctx!.lineWidth = 2;
      ctx!.beginPath();

      for (let i = 0; i < values.length; i++) {
        const x = (i / values.length) * w;
        const y = (values[i] + 1) / 2 * h;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }

      ctx!.stroke();
      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
  }

  // Update synth params when controls change
  useEffect(() => {
    if (!synthRef.current) return;
    synthRef.current.set({
      oscillator: { type: oscType },
      envelope: { attack, decay, sustain, release },
      volume,
    });
  }, [oscType, volume, attack, decay, sustain, release]);

  useEffect(() => {
    if (filterRef.current) filterRef.current.frequency.value = filterFreq;
  }, [filterFreq]);

  useEffect(() => {
    if (reverbRef.current) reverbRef.current.wet.value = reverb;
  }, [reverb]);

  // Keyboard input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const note = KEY_MAP[e.key.toLowerCase()];
      if (!note || !synthRef.current) return;
      synthRef.current.triggerAttack(note);
      setActiveNotes((prev) => new Set(prev).add(note));
    }

    function handleKeyUp(e: KeyboardEvent) {
      const note = KEY_MAP[e.key.toLowerCase()];
      if (!note || !synthRef.current) return;
      synthRef.current.triggerRelease(note);
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  function playNote(note: string) {
    if (!synthRef.current) return;
    synthRef.current.triggerAttackRelease(note, "8n");
    setActiveNotes((prev) => new Set(prev).add(note));
    setTimeout(() => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }, 200);
  }

  async function toggleRecording() {
    if (!recorderRef.current) return;
    if (recording) {
      const blob = await recorderRef.current.stop();
      setRecording(false);
      // Download the recording
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synth-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      recorderRef.current.start();
      setRecording(true);
    }
  }

  return (
    <div className="space-y-4" onClick={initTone}>
      <div>
        <h1 className="text-2xl font-bold">Synthesizer</h1>
        <p className="text-muted-foreground">
          {toneLoaded
            ? "Use your keyboard (A-K) or click the keys to play."
            : "Click anywhere to activate audio, then start playing!"}
        </p>
      </div>

      {/* Visualizer */}
      <Card>
        <CardContent className="p-2">
          <canvas
            ref={canvasRef}
            width={800}
            height={120}
            className="w-full h-24 rounded bg-black/50"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Oscillator */}
            <div className="space-y-2">
              <Label className="text-xs">Oscillator</Label>
              <div className="grid grid-cols-4 gap-1">
                {OSCILLATOR_TYPES.map(({ type, label }) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={oscType === type ? "default" : "outline"}
                    onClick={() => setOscType(type)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <Label className="text-xs">Volume: {volume}dB</Label>
              <Slider min={-30} max={0} step={1} value={[volume]} onValueChange={(v) => setVolume(sv(v))} />
            </div>

            {/* Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Filter: {filterFreq}Hz</Label>
              <Slider min={100} max={8000} step={50} value={[filterFreq]} onValueChange={(v) => setFilterFreq(sv(v))} />
            </div>

            {/* ADSR */}
            <div className="space-y-2">
              <Label className="text-xs">Envelope</Label>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">A</p>
                  <Slider orientation="vertical" min={0.01} max={1} step={0.01} value={[attack]} onValueChange={(v) => setAttack(sv(v))} className="h-16 mx-auto" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">D</p>
                  <Slider orientation="vertical" min={0.01} max={1} step={0.01} value={[decay]} onValueChange={(v) => setDecay(sv(v))} className="h-16 mx-auto" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">S</p>
                  <Slider orientation="vertical" min={0} max={1} step={0.01} value={[sustain]} onValueChange={(v) => setSustain(sv(v))} className="h-16 mx-auto" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">R</p>
                  <Slider orientation="vertical" min={0.01} max={2} step={0.01} value={[release]} onValueChange={(v) => setRelease(sv(v))} className="h-16 mx-auto" />
                </div>
              </div>
            </div>

            {/* Reverb */}
            <div className="space-y-2">
              <Label className="text-xs">Reverb: {Math.round(reverb * 100)}%</Label>
              <Slider min={0} max={1} step={0.05} value={[reverb]} onValueChange={(v) => setReverb(sv(v))} />
            </div>

            {/* Record */}
            <Button
              variant={recording ? "destructive" : "outline"}
              className="w-full"
              onClick={toggleRecording}
              disabled={!toneLoaded}
            >
              {recording ? (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Record
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Keyboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              Keyboard
              {recording && (
                <Badge variant="destructive" className="animate-pulse">
                  REC
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-48">
              {/* White keys */}
              <div className="flex h-full gap-0.5">
                {[4, 5].map((octave) =>
                  WHITE_KEYS.map((note) => {
                    const fullNote = `${note}${octave}`;
                    return (
                      <button
                        key={fullNote}
                        className={cn(
                          "flex-1 rounded-b-lg border border-border transition-colors relative",
                          activeNotes.has(fullNote)
                            ? "bg-primary/30"
                            : "bg-card hover:bg-muted"
                        )}
                        onMouseDown={() => playNote(fullNote)}
                      >
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                          {note}
                          {octave}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Black keys */}
              <div className="absolute top-0 left-0 right-0 h-[60%] flex pointer-events-none">
                {[4, 5].map((octave, octaveIdx) =>
                  BLACK_KEYS.map(({ note, offset }) => {
                    const fullNote = `${note}${octave}`;
                    const leftPercent =
                      ((octaveIdx * 7 + offset) / 14) * 100 + 100 / 14 / 2;
                    return (
                      <button
                        key={fullNote}
                        className={cn(
                          "absolute w-[5%] h-full rounded-b pointer-events-auto z-10 transition-colors",
                          activeNotes.has(fullNote)
                            ? "bg-primary"
                            : "bg-foreground/90 hover:bg-foreground/70"
                        )}
                        style={{ left: `${leftPercent - 2.5}%` }}
                        onMouseDown={() => playNote(fullNote)}
                      />
                    );
                  })
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Keyboard mapping: A-K (white keys), W-E-T-Y-U (black keys)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
