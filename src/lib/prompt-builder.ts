interface ThemeData {
  genres: string[];
  moods: string[];
  era: string | null;
  tempo: string | null;
  instruments: string[];
  description: string;
}

export function buildPromptBase(theme: ThemeData): string {
  const parts: string[] = [];

  if (theme.genres.length) {
    parts.push(theme.genres.join(", ") + " music");
  }

  if (theme.era) {
    parts.push(`${theme.era} style`);
  }

  if (theme.moods.length) {
    parts.push(theme.moods.join(" and ") + " mood");
  }

  if (theme.tempo) {
    parts.push(`${theme.tempo.toLowerCase()} tempo`);
  }

  if (theme.instruments.length) {
    parts.push(`featuring ${theme.instruments.join(", ")}`);
  }

  parts.push("high quality, professional production, suitable for YouTube content");

  return parts.join(", ");
}

export function buildGenerationPrompt(
  promptBase: string,
  contextDescription?: string
): string {
  if (!contextDescription) return promptBase;

  return `${promptBase}, for ${contextDescription}`;
}