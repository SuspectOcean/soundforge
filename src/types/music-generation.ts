export type MusicGeneration = {
  prompt: string;
  duration: number;
  outputFormat: 'mp3' | 'wav' | 'aac' | 'flac';
  model: string;
  seed?: number;
};