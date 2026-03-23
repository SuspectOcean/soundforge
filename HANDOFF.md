# SoundForge — Session Handoff Document

**Last updated:** 2026-03-23
**Paste this into a new conversation to pick up where you left off.**

---

## Project Overview

**SoundForge** is an AI-powered music creation app for content creators. Users define their channel's musical identity through "Sound Themes" and generate custom tracks via Replicate's MusicGen model. Includes a browser-based Tone.js synthesizer.

## Tech Stack

- **Framework:** Next.js 16.1.7 (App Router), React 19.2.3, TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Database:** PostgreSQL + Prisma ORM 7.5
- **Auth:** Auth.js v5 (NextAuth) with GitHub + Google OAuth, PrismaAdapter
- **AI:** Replicate API (Meta MusicGen) for music generation
- **Storage:** Vercel Blob for generated audio files
- **Synth:** Tone.js for browser-based synthesizer
- **Other:** Zod validation, Sonner toasts, next-themes dark mode

## Prisma Schema (Key Models)

- **User** — id, name, email, image (Auth.js managed)
- **SoundTheme** — name, description, genres[], moods[], era, tempo, instruments[], exampleUrls[], promptBase, isDefault
- **Generation** — userId, themeId, status (PENDING/PROCESSING/SUCCEEDED/FAILED/CANCELLED), prompt, contextDescription, duration (5-30), replicateId, audioUrl, audioFormat, errorMessage, metadata

## File Structure

```
src/
├── app/
│   ├── (auth)/login/page.tsx          — OAuth login (GitHub/Google)
│   ├── (dashboard)/layout.tsx         — Sidebar + Header layout
│   ├── (dashboard)/dashboard/page.tsx — SERVER component: real DB stats (theme count, generation count, total duration), quick action cards with hover arrows, recent generations with status badges + download
│   ├── (dashboard)/themes/page.tsx    — CLIENT component: fetches themes, shows cards with genre/mood badges, default indicator, dropdown menu (set default, delete), grid layout
│   ├── (dashboard)/themes/new/page.tsx — 4-step theme creation wizard (Channel Info → Style/Mood → Instruments → Review)
│   ├── (dashboard)/generate/page.tsx  — CLIENT component: theme selector dropdown with preview badges, context description, duration slider, results list with play/pause/download/regenerate buttons
│   ├── (dashboard)/library/page.tsx   — CLIENT component: search input, status filter dropdown, generation list with play/pause audio, download, status badges with colors, empty states for no results vs no tracks
│   ├── (dashboard)/synthesizer/page.tsx — Tone.js synth with keyboard, recording, waveform visualizer
│   ├── api/auth/[...nextauth]/route.ts
│   ├── api/generate/route.ts          — POST: requires themeId, builds prompt from theme + context, calls Replicate
│   ├── api/generate/[generationId]/route.ts — GET: poll generation status
│   ├── api/generations/route.ts       — GET: list generations (supports ?themeId, ?status, ?search, ?limit, ?offset)
│   ├── api/themes/route.ts            — GET/POST themes
│   ├── api/themes/[themeId]/route.ts  — GET/PATCH/DELETE individual theme (PATCH rebuilds promptBase from merged fields)
│   ├── api/webhooks/replicate/route.ts — Replicate webhook handler
│   ├── page.tsx                       — Landing page with hero, how-it-works, USPs (brand consistency, instant creation, royalty free)
│   └── globals.css                    — Tailwind + dark mode (purple primary oklch(0.637 0.237 292), teal accent oklch(0.60 0.15 175))
├── components/
│   ├── layout/sidebar.tsx             — Desktop sidebar with logo, nav items, version footer
│   ├── layout/header.tsx              — Top bar with mobile sheet nav + user avatar dropdown
│   ├── providers/session-provider.tsx
│   ├── providers/theme-provider.tsx
│   └── ui/                            — shadcn/ui (avatar, badge, button, card, dialog, dropdown-menu, input, label, progress, select, separator, sheet, slider, sonner, tabs, textarea, tooltip)
├── lib/
│   ├── auth.ts                        — NextAuth config (GitHub + Google providers, Prisma adapter, session callback adds user.id)
│   ├── constants.ts                   — GENRES(20), MOODS(16), ERAS(9), TEMPOS(6), INSTRUMENTS(20), CONTENT_TYPES(16), DURATION_OPTIONS
│   ├── db.ts                          — Prisma client singleton
│   ├── prompt-builder.ts              — buildPromptBase() and buildGenerationPrompt()
│   ├── replicate.ts                   — startMusicGeneration() calls Replicate API
│   ├── validators.ts                  — Zod schemas: createThemeSchema, updateThemeSchema, generateSchema
│   └── utils.ts                       — cn() classname merger
└── middleware.ts                       — Protects /dashboard, /themes, /generate, /library (checks session token cookie)
```

## Environment Variables

```
AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
DATABASE_URL (PostgreSQL)
REPLICATE_API_TOKEN
BLOB_READ_WRITE_TOKEN (Vercel Blob)
NEXT_PUBLIC_APP_URL
```

## What's Been Built (Completed Features)

1. **Landing page** — Hero with pill badge, "How it works" cards, USP section (Brand Consistency, Instant Creation, Royalty Free), polished footer
2. **Authentication** — GitHub/Google OAuth, session management, route protection via middleware
3. **Dashboard (server component)** — Real DB stats (theme count, generation count, total duration with formatting), personalized welcome, quick action cards with hover effects, recent generations list with status badges + download buttons, "View all" link to library
4. **Theme creation** — 4-step wizard (Channel Info → Style/Mood → Instruments → Review), AI prompt preview, auto-sets as default
5. **Theme list (client component)** — Cards in 2-col grid, genre/mood badges, default star badge, dropdown menu with "Set as default", "Generate with this theme", "Delete" actions, loading/empty states
6. **Theme deletion** — Confirmation dialog, optimistic UI update, API DELETE endpoint
7. **Theme set-default** — PATCH API, unsets other defaults, immediate UI update
8. **AI Generation (client component)** — Theme selector dropdown with genre/mood badge preview, context description, duration slider, session results list with play/pause/download/regenerate buttons, polling for status
9. **Library (client component)** — Search with debounce, status filter dropdown, generation list with inline audio player on play, status-colored badges (emerald/amber/blue/red), download buttons, "Showing X of Y" pagination hint, clear filters button
10. **Synthesizer** — Oscillator types, volume, filter, ADSR, reverb, waveform visualizer, keyboard/mouse input, WebM recording
11. **Dark mode** — Purple primary + teal accent color scheme
12. **Responsive** — Mobile sidebar via Sheet, responsive grids, truncated text

## API Behavior Notes

- **Generate API** requires `themeId` — the frontend auto-selects the user's default theme
- **Generations API** supports `?search=` (case-insensitive on contextDescription), `?status=`, `?themeId=`, `?limit=`, `?offset=`
- **Theme PATCH** merges partial updates and rebuilds `promptBase` from merged fields
- **Replicate webhook** updates generation status + audioUrl on completion

## What Still Needs Work

- Theme editing UI (form to edit existing theme — API PATCH exists, no frontend yet)
- Dashboard recent generations clickable → navigate to library with filter
- Library pagination (load more button)
- Generation re-generation should also allow switching themes
- User profile/settings page
- Audio waveform visualization in library (instead of plain audio element)
- Favorites/playlists in library
- Batch generation
- Analytics / usage tracking
- Premium features / billing
- Error boundary components
- Loading skeleton states

## Design Decisions

- **Theme-first approach:** All generations tied to a theme for consistent brand sound
- **Server component dashboard:** Stats fetched server-side for fast initial load
- **Client component library/themes/generate:** Interactive features need client-side state
- **Webhook + polling:** Replicate webhooks for production, polling fallback for dev
- **Lazy Tone.js:** Synthesizer loads Tone.js on first interaction only
- **Dark mode palette:** Purple primary (oklch 0.637 0.237 292) with teal accent for a modern music-app feel
- **Status color system:** Emerald=succeeded, Amber=processing, Blue=pending, Red=failed

## Git Status

Single commit: `8e1fcc5 — Initial commit: SoundForge AI music creation app`
Uncommitted changes: dashboard stats, library page, themes list, generate improvements, landing page polish, sidebar update, generations API search/filter
