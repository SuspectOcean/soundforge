import { z } from "zod";

export const createThemeSchema = z.object({
  name: z.string().min(1, "Theme name is required").max(100),
  description: z.string().min(1, "Description is required").max(1000),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  moods: z.array(z.string()).min(1, "Select at least one mood"),
  era: z.string().nullable().optional(),
  tempo: z.string().nullable().optional(),
  instruments: z.array(z.string()).default([]),
  exampleUrls: z.array(z.string().url()).default([]),
  isDefault: z.boolean().default(false),
});

export const updateThemeSchema = createThemeSchema.partial();

export const generateSchema = z.object({
  themeId: z.string().min(1, "Theme is required"),
  contextDescription: z.string().max(500).optional(),
  duration: z.number().min(5).max(30).default(15),
});

export type CreateThemeInput = z.infer<typeof createThemeSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
export type GenerateInput = z.infer<typeof generateSchema>;