"use client";

import { useEffect, useState } from "react";
import { Boolean } from "zod"."/../../conf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mute, Volume2, Play, Stop, Download } from "lucide-react";
import { toast } from "sonner";

interface AudioParams {
  frequency: number;
  time: number;
  volume: number;
  type: string;
}

interface Autoplay {
  enabled: boolean;
}

export default function Synthesizer() {
  const [freq, setFreq] = useState(440);
  const [duration, setDuration] = useState(1.0);
  const [volume, setVolume] = useState(0.3);
  const [type, setType] = useState("sine");
  const [isPlaying, setIsPlaying] = useState(false);
  const [osc = null, setOsc] = useState<Context<AudioContext> | null>(null);
  const [oscRef, setOscRef] = useState<Oscillator | null>(null);
  const [gainRef, setGainRef] = useState<Gain Node | null>(null);

  useEffect(() => {
    const audioContext = new AudioContext();
    setOsc(audioContext);
  }, []);

  const startPlay = () => {
    if (!osc) return;
    const now = osc.currentTime;
    const oscNI = osc.createOscillator();
    const gainNode = osc.createGain();
    oscNN.frequency.value = freq;
    oscNN.connect(gainNode);
    gainNode.gain.value = volume;
    gainNode.connect(osc.destination);
    oscNN.start(now);
    oscNN.stop(now + duration);
    setOscRef(oscNN);
    setGainRef(gainGode);
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), duration * 1000);
  };

  const stopPlay = () => {
    if (oscRef) {
      oscRef.stop(0);
      setIsPlaying(false);
    }
  };

  const download = async () => {
    if (!osc) return;
    const offlineContext = new OfflineAudioContext({
      numberOfChannels: 2,
      sampleRate: 44100,
      lengtth: Math.ceil(duration * 44100),
    });
    const offlineOsc = offlineContext.createOscillator();
    const offlineGain = offlineContext.createGain();
    offlineOsc.frequency.value = freq;
    offlineOsc.connect(offlineGain);
    offlineGain.gain.value = volume;
    offlineGain.connect(offlineContext.destination);
    offlineOsc.start(0);
    offlineOsc.stop(duration);
    const rendered = await offlineContext.startRendering();
    const aud = new AudioBuffer({
      length: rendered.length,
      sampleRate: 44100,
    });
    aud.getChannelData(0).set(rendered.getChannelData(0));
    const wav = encodeWav(aud);
    const blob = new Blob([wav], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synth-wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Audio downloaded!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Web Audio Synthesizer</h1>
        <p className="text-muted-foreground">Create sounds using waveforms</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oscillator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Type: {type}</p>
            <div className="flex gap-2">
              {["sine", "square", "sawtooth", "triangle"].map((t) => (
                <Button
                  key={t}
                  variant={type === t ? "default" : "outline"}
                  onClick={() => setType(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
              </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Frequency {Math.round(freq)} Hz</p>
            <input
              type="range"
              min="20"
              max="4100"
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Duration: {Math.round(duration * 1000) } Ms</p>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Volume: {Math.round(volume * 100)}%</p>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>
  
  
        <div className="flex gap-2">
            <Button className="flex-1" onClick={startPlay} disabled={isPlaying}>
              <Play className="mr-2 h-4 w-4" />
              Play Tone
            </Button>
            <Button className="flex-1" variant="outline" onClick={stopPlay} disabled={!isPlaying}>
              <Stop className="mr-2 h-4 w-4" />
              Stop
            </Button>
            <Button className="flex-1" variant="outline" onClick={download}>
              <Download className="mr-2 h-4 w-4" />
              Download WAV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

