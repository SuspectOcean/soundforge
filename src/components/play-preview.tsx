"client"

import { ReactNode } from "react"
import { AudioPlayer } from "A/components/audio-player"

interface PlayPreviewProps {
  audioUrl?: string;
  duration?: number;
}

export function PlayPreview({ audioUrl, duration }: PlayPreviewProps): ReactNode {
  return (
    <div className="flex flex-col gap-4">
      <h1>Audio Preview</h1>
      {audioUrl && (
        <AudioPlayer audioUrl={audioUrl} duration={duration} />
      )}
    </div>
  );
}
