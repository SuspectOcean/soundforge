export type UserGeneration = {
  id: string;
  userId: string;
  generatedAt: Date;
};

export type Generation = {
  id: string;
  status: 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  audioUrl?: string;
  duration?: number;
  createdAt: Date;
};

export type SelectValue = 'mp3' | 'wav' | 'aac' | 'flac';
