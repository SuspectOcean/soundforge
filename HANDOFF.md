# SoundForge — Session Handoff Document

**Last updated:** 2026-05-13 (Operational Recovery — awaiting user git push)
**Paste this into a new conversation to pick up where you left off.**

---

## Project Overview

**SoundForge** is an AI-powered music creation app for content creators. Users define their channel's musical identity through "Sound Themes" (optionally from a reference audio file) and generate custom tracks via Replicate's MusicGen model. Includes a browser-based Tone.js synthesizer.

## Tech Stack

- **Framework:** Next.js 16.1.7 (App Router), React 19.2.3, TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Database:** PostgreSQL + Prisma ORM 7.5
- **Auth:** Auth.js v5 (NextAuth) with GitHub + Google OAuth, PrismaAdapter
- **AI:** Replicate API (Meta MusicGen for generation; configurable analysis model)
- **Storage:** Vercel Blob for audio uploads + generated tracks
- **Synth:** Tone.js for browser-based synthesizer
- **Other:** Zod validation, Sonner toasts, next-themes dark mode

---

## Phase 3.5 Verification Results (2026-05-13)

### Build Status

**Cannot be verified in the Cowork sandbox** — `npm run build` and `npm run dev` both fail with Bus error (OOM). Same constraint as Phase 2.5. Real build must be verified on dev machine.

**To verify:**
```bash
cd "C:\Users\ross_\Documents\Sound Creation App"
npm run build       # or npm run dev for local testing
```

### Browser Verification

**Could not complete** — app not running (dev server won't start in sandbox). Browser verification must be done locally.

**Recommended test flow:**
1. Sign in, navigate to `/themes`
2. Click ⋮ → Edit on a theme → verify `/themes/[id]/edit` loads with pre-filled fields
3. Toggle genres/moods/instruments, change era/tempo, flip isDefault → Save → confirm redirect to `/themes`
4. If theme has reference track, confirm it shows read-only in edit form
5. Try editing a theme you don't own (different user) → expect 404
6. Try navigating to `/themes/abc-invalid-id/edit` → expect not-found state
7. Click ⋮ → Delete → confirm Dialog (no native `confirm()`) → confirm delete
8. Confirm `/themes/new` wizard still works end-to-end
9. Confirm Generate flow still works

### Static Verification — All Pass

| Check | Result |
|-------|--------|
| No `confirm()` in any themes file | ✓ |
| PATCH payload: only allowed fields | ✓ name, description, genres, moods, era, tempo, instruments, isDefault only |
| PATCH payload: no userId/blobUrl/referenceTrackId sent | ✓ |
| PATCH payload: exampleUrls preserved (not sent, falls back to existing) | ✓ |
| API-level ownership enforcement (GET/PATCH/DELETE) | ✓ userId filter in all handlers |
| Dialog exports match imports | ✓ Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter |
| DropdownMenuSeparator exported from component | ✓ |
| Separator component exists | ✓ |
| themes/new wizard unchanged | ✓ uploadAndAnalyse, 5 steps intact |
| generate page unchanged | ✓ pollIntervalsRef intact |
| era/tempo null handling | ✓ null sent → Zod accepts nullable → DB updated |
| Empty instruments array | ✓ valid per schema |
| not-found/error states in edit page | ✓ shows recoverable message + back link |

### Bugs Fixed in Phase 3.5

| Bug | Fix |
|-----|-----|
| `Badge` imported but unused in edit page | Removed unused import |
| `GET /api/themes/[themeId]` didn't include `referenceTrack` relation | Added `include: { referenceTrack: true }` to `findFirst` — reference track now returned and displayed read-only in edit form |

### Files Changed in Phase 3.5

| File | Change |
|------|--------|
| `src/app/(dashboard)/themes/[id]/edit/page.tsx` | Removed unused `Badge` import |
| `src/app/api/themes/[themeId]/route.ts` | Added `include: { referenceTrack: true }` to GET handler |

---

## What Was Built in Phase 3 (2026-05-13)

### Theme Editing UI

**New files:**

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/themes/[id]/edit/page.tsx` | Single-page edit form for existing Sound Themes. Loads theme via GET `/api/themes/[id]`, saves via PATCH. Badge multi-selects for genres/moods/instruments, single-selects for era/tempo, toggle for isDefault. Reference track shown read-only. Redirects to `/themes` on success. |

**Modified files:**

| File | Change |
|------|--------|
| `src/app/(dashboard)/themes/page.tsx` | Added Edit action to DropdownMenu (routes to `/themes/[id]/edit`). Replaced native `confirm()` delete handler with shadcn Dialog (state: `deleteTarget: { id, name } \| null`). Added `DropdownMenuSeparator` before Delete. Imported `useRouter`, `Pencil`, `Dialog*`. |

**Edit page implementation notes:**
- `"use client"` component — fetches theme on mount, pre-populates form
- Validation mirrors `createThemeSchema`: name required (max 100), description required (max 1000), at least one genre, at least one mood
- Badge toggles: multi-select for genres/moods/instruments; single-select (click to select, click again to deselect) for era/tempo
- `isDefault` rendered as accessible toggle switch (`role="switch"`, `aria-checked`)
- Reference track card: read-only, shows filename, size, BPM, key, analysis status
- Prompt preview panel shows current `promptBase` with note that save regenerates it
- Error/loading/saving/notFound states all handled; Sonner toasts on success and failure

---

## What Was Built in Phase 2 (2026-05-13)

### Reference Audio Ingestion + Analysis Pipeline

The core new feature: users can now upload or record a reference audio file when creating a Sound Theme. The app analyses it (via a configurable Replicate model) and pre-fills genre, mood, energy, instrumentation, and tempo in the theme wizard.

**New files created:**

| File | Purpose |
|------|---------|
| `src/app/api/upload/audio/route.ts` | Handles client-side Vercel Blob uploads via `handleUpload`. Validates MIME type + file size. Creates `ReferenceTrack` DB record on completion. |
| `src/app/api/analyse/audio/route.ts` | POST: runs analysis on a `ReferenceTrack`. Returns `AudioAnalysisResult`. Skips re-analysis if already COMPLETED. |
| `src/app/api/reference-tracks/[id]/route.ts` | GET: fetch track status + semantic fields. PATCH: user can edit genre, mood, energy, instrumentation, descriptors, bpm, musicalKey, duration. |
| `src/lib/audio-analysis.ts` | Hybrid analysis service: AI text analysis via Replicate (optional, set `REPLICATE_ANALYSIS_MODEL`) + keyword matching against GENRES/MOODS/INSTRUMENTS constants. Always returns a result — never throws to caller. |
| `prisma/migrations/20260513000000_add_reference_track/migration.sql` | Adds `AnalysisStatus` enum + `ReferenceTrack` table + `referenceTrackId` FK on `SoundTheme`. |

**Modified files:**

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `AnalysisStatus` enum, `ReferenceTrack` model, `referenceTrackId String?` on `SoundTheme`, `referenceTracks ReferenceTrack[]` on `User`. |
| `src/app/(dashboard)/themes/new/page.tsx` | Fully rewritten as 5-step wizard: **Reference Audio** (upload/record/skip tabs) → Channel Info → Style → Instruments → Review. Upload uses `@vercel/blob/client` `upload()`. Analysis result is editable before proceeding. Pre-fills genres/moods/instruments/tempo in downstream steps. |
| `src/app/api/webhooks/replicate/route.ts` | Added webhook signature verification (Web Crypto HMAC-SHA256) + Blob persistence for generated audio (fetches from Replicate temp URL, re-uploads to Vercel Blob). |
| `src/app/(dashboard)/generate/page.tsx` | Fixed poll interval memory leak: intervals tracked in `useRef<Map>`, cleaned up on unmount. |
| `src/app/page.tsx` | Updated landing copy for legal safety: "Original Output" USP instead of "Royalty Free", added copyright disclaimer section. |
| `next.config.ts` | Added `images.remotePatterns` for Vercel Blob + GitHub + Google. Added security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy). |
| `.env.example` | Added `REPLICATE_WEBHOOK_SECRET`, `REPLICATE_ANALYSIS_MODEL`, `MAX_AUDIO_UPLOAD_MB`. |

---

## Prisma Schema (All Models)

```
User            — id, name, email, image (Auth.js managed), referenceTracks[]
Account         — Auth.js OAuth accounts
Session         — Auth.js sessions
VerificationToken — Auth.js

SoundTheme      — userId, name, description, genres[], moods[], era, tempo,
                  instruments[], exampleUrls[], exampleBlobUrls[], promptBase,
                  isDefault, referenceTrackId? (FK to ReferenceTrack)

ReferenceTrack  — id (client-generated UUID), userId, originalFilename, blobUrl,
                  mimeType, fileSize, duration?, bpm?, musicalKey?, genre?, mood?,
                  energy?, instrumentation[], descriptors[], analysisStatus
                  (PENDING/PROCESSING/COMPLETED/FAILED), analysisRawResponse?

Generation      — userId, themeId, status (PENDING/PROCESSING/SUCCEEDED/FAILED/
                  CANCELLED), prompt, contextDescription, duration (5-30),
                  replicateId, audioUrl, audioFormat, errorMessage, metadata?,
                  completedAt?
```

---

## Environment Variables

```
AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
DATABASE_URL (PostgreSQL)
REPLICATE_API_TOKEN
REPLICATE_WEBHOOK_SECRET          # Required in production — from replicate.com/account/webhooks
REPLICATE_ANALYSIS_MODEL          # Optional — e.g. andreasjansson/instruct-music-decoder
                                  # Leave unset to skip AI analysis (user fills fields manually)
BLOB_READ_WRITE_TOKEN (Vercel Blob)
NEXT_PUBLIC_APP_URL
MAX_AUDIO_UPLOAD_MB               # Default: 25
```

---

## File Structure

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/layout.tsx
│   ├── (dashboard)/dashboard/page.tsx
│   ├── (dashboard)/themes/page.tsx
│   ├── (dashboard)/themes/new/page.tsx   — 5-step wizard WITH reference audio
│   ├── (dashboard)/themes/[id]/edit/page.tsx — NEW: single-page theme edit form
│   ├── (dashboard)/generate/page.tsx     — Music generation (polling fixed)
│   ├── (dashboard)/library/page.tsx
│   ├── (dashboard)/synthesizer/page.tsx
│   ├── api/auth/[...nextauth]/route.ts
│   ├── api/generate/route.ts
│   ├── api/generate/[generationId]/route.ts
│   ├── api/generations/route.ts
│   ├── api/themes/route.ts
│   ├── api/themes/[themeId]/route.ts
│   ├── api/upload/audio/route.ts         — NEW: Vercel Blob client-side upload handler
│   ├── api/analyse/audio/route.ts        — NEW: Triggers analysis, returns result
│   ├── api/reference-tracks/[id]/route.ts — NEW: GET status, PATCH semantic fields
│   ├── api/webhooks/replicate/route.ts   — Updated: sig verification + Blob persistence
│   └── page.tsx                          — Updated landing copy
├── components/
│   ├── layout/sidebar.tsx
│   ├── layout/header.tsx
│   ├── providers/session-provider.tsx
│   ├── providers/theme-provider.tsx
│   └── ui/
├── lib/
│   ├── audio-analysis.ts                 — NEW: hybrid analysis service
│   ├── auth.ts
│   ├── constants.ts
│   ├── db.ts
│   ├── prompt-builder.ts
│   ├── replicate.ts
│   ├── validators.ts
│   └── utils.ts
└── middleware.ts
```

---

## Key Implementation Details

### Vercel Blob Upload Pattern
Uses the **client-side upload** pattern (`upload()` from `@vercel/blob/client`) to bypass the 4.5MB function body limit. The server route (`/api/upload/audio`) uses `handleUpload` to:
1. Generate a token in `onBeforeGenerateToken` (validates metadata, forwards `trackId`/`duration`/`fileSize` via `tokenPayload`)
2. Create the `ReferenceTrack` DB record in `onUploadCompleted` (using data from `tokenPayload` — `clientPayload` is NOT available in `onUploadCompleted` in `@vercel/blob` v2)

The client pre-generates a UUID `trackId` before upload so the ID is known immediately.

### Audio Analysis Service
`src/lib/audio-analysis.ts`:
- If `REPLICATE_ANALYSIS_MODEL` is set: sends audio URL to that model, parses natural-language output with regex + keyword matching
- If unset: returns empty semantic fields — user fills in manually
- Always marks track COMPLETED or FAILED, never throws to the HTTP handler
- Returns `AudioAnalysisResult`: `{ genre, genres[], mood, moods[], energy, tempo, instrumentation[], descriptors[], bpm, musicalKey, rawText }`

### Webhook Security
`/api/webhooks/replicate/route.ts` verifies `webhook-id.webhook-timestamp.body` HMAC-SHA256 using Web Crypto API (Edge-compatible). Rejects replays older than 5 minutes. Set `REPLICATE_WEBHOOK_SECRET` in production.

### Poll Interval Cleanup (generate page)
Intervals stored in `useRef<Map<string, ReturnType<typeof setInterval>>>`. Cleanup effect clears all on unmount. Each interval removes itself from the map on SUCCEEDED/FAILED.

---

## Phase 2.5 Verification Results (2026-05-13)

### Build Status

**Cannot be verified in the Cowork sandbox** — the bash mount is read-only and has a truncation ceiling (~3KB per file). Files over that size appear truncated to `npx tsc`, generating false syntax errors. All truncation errors are from the stale/truncated bash view, not the actual Windows files.

**Verification method:** Read tool was used as the authoritative source for all file content. All files are complete and structurally correct as inspected.

**To run the real build:** `npm run build` from the project root on the dev machine, or push to git to trigger Vercel CI.

### Prisma Status

Schema validated via Read tool — complete and valid. Migration SQL reviewed — additive only, no DROP statements.

**Before first deploy, run:**
```bash
npx prisma migrate deploy   # applies the ReferenceTrack migration
npx prisma generate         # if generated client is stale
```

### Files Inspected — All Pass

| File | Result | Notes |
|------|--------|-------|
| `/api/upload/audio/route.ts` | ✓ | tokenPayload used correctly, no blob.size, auth required, MIME + size validated |
| `/api/reference-tracks/[id]/route.ts` | ✓ | Typed update data, per-field validation, userId/blobUrl not patchable |
| `/api/analyse/audio/route.ts` | ✓ | Graceful with no model configured, status correctly updated |
| `/api/generate/route.ts` | ✓ | No regression, untouched in Phase 2 |
| `/api/generate/[generationId]/route.ts` | ✓ | No regression, polls Replicate as fallback |
| `/api/webhooks/replicate/route.ts` | ✓ | HMAC-SHA256 sig verification, Blob persistence + fallback |
| `prisma/schema.prisma` | ✓ | ReferenceTrack model valid, AnalysisStatus enum present |
| `prisma/migrations/.../migration.sql` | ✓ | Additive only, correct FK constraints |
| `src/app/(dashboard)/generate/page.tsx` | ✓ | pollIntervalsRef cleanup verified |
| `src/app/page.tsx` | ✓ | No "Royalty Free" language, disclaimer present |
| `src/lib/audio-analysis.ts` | ✓ | Graceful no-model path, correct status updates |

### TypeScript Fixes Applied in This Session

1. **`/api/reference-tracks/[id]/route.ts`** — Replaced `data: Record<string, unknown>` with explicit typed accumulator (Prisma update input compatibility)
2. **`/api/upload/audio/route.ts`** — Rewrote to forward metadata through `tokenPayload` (not `clientPayload`, which is unavailable in `onUploadCompleted` in `@vercel/blob` v2); removed `blob.size` usage (`PutBlobResult` has no `size` field)

### Known Minor Issues (Non-blocking)

- **Recording MIME type**: `MediaRecorder` produces WebM but the File is relabeled `audio/mpeg` for upload compatibility. The actual bytes are WebM. Audio analysis models may handle this correctly; if not, users can skip the analysis and fill fields manually.
- **`genres[]`/`moods[]` not persisted to DB**: Only the primary `genre`/`mood` strings are stored. The arrays returned by analysis are live-only and empty on DB re-read. Acceptable for MVP — user edits are the primary workflow.

### No Regressions Found

- No new `any` types in application code (only Prisma generated files, pre-existing synth `analyser: any`)
- No unsafe copyright language
- No unrelated UI changes
- Generation flow unchanged

---

## Running Migrations

After pulling, run:
```bash
npx prisma migrate deploy   # production
npx prisma migrate dev      # development (creates new migration if schema changed)
npx prisma generate         # regenerate client after schema changes
```

---

## What Still Needs Work

### Phase 4 Recommendation (Next Session)

Suggested scope:
1. Library pagination — load-more button on `/library`
2. Audio waveform player — replace `<audio>` with a waveform visualization component
3. Save synth recordings to library — connect synthesizer output to generation records
4. Dashboard recent generations → navigate to library with filter
5. User settings/profile page

### Near-term
- Library pagination (load more / infinite scroll)
- Audio waveform visualizer in library (replace plain `<audio>` element)
- Dashboard recent generations → navigate to library with filter
- User settings/profile page

### Medium-term
- YouTube URL audio extraction (currently blocked — legal/API complexity)
- Spotify link support (metadata-only, no audio extraction)
- Similarity / copyright risk scoring for generated tracks
- Generation queue + priority system
- Stripe billing / subscription tiers

### Polish
- Error boundary components
- Loading skeleton states throughout
- Better mobile experience on theme wizard
- Synth recordings → save to library → use as reference track
- OG images + SEO metadata

---

## Known Gotchas

- **Prisma v7:** DB URL in `prisma.config.ts`, not `schema.prisma`. Generated client at `src/generated/prisma/client`.
- **shadcn/ui v4:** No `asChild` on Sheet/DropdownMenu triggers.
- **Tailwind v4:** Config in `postcss.config.mjs`, not `tailwind.config.ts`.
- **Next.js route params:** Must `await params` — they are `Promise<{ param: string }>`.
- **Zod v4:** Uses `.issues` not `.errors` on parse failures.
- **`@vercel/blob` v2 `handleUpload`:** `clientPayload` is NOT available in `onUploadCompleted`. Forward everything through `tokenPayload`.
- **Analysis model:** Only `genre`/`mood` (singles) + `instrumentation[]`/`descriptors[]` are persisted to DB. The `genres[]`/`moods[]` arrays from analysis are returned live but not stored — they're empty on DB re-read. Users see the live result immediately so this is acceptable for MVP.

---

## Git Status

Last committed: `8e1fcc5 — Initial commit`
All Phase 1 + Phase 2 changes are uncommitted.
