export type Generation = {
  id: string;
  status: 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  audioUrl?: string;
  duration?: number;
  createdAt: Date;
};
