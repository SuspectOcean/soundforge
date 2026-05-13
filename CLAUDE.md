# SoundForge - Project Specification & Build Instructions

## 1. Product Vision

SoundForge is a web application that lets YouTubers, Instagram creators, and influencers create custom music and sound for their content. The core idea: a user provides a **reference song** (uploaded audio file, recorded in-app, or a YouTube/video link) and SoundForge analyses that song's style, then generates **new, original music that sounds similar** - matching the feel, energy, instrumentation, and genre.

Users build a persistent **Sound Theme** (their channel's musical identity) from these references, then request AI-generated tracks for specific moments in their content (intros, outros, background music, transitions). They can also use a built-in **Tone.js synthesizer** to create sounds manually.

### Target Users
- YouTubers needing consistent channel music
- Instagram/TikTok creators who want branded audio
- Podcasters who need intros/outros/transitions
- Any content creator who wants royalty-free, AI-generated music that matches a specific style

### Core User Flows

**Flow A - Reference-Based Theme Creation:**
1. User uploads an MP3/WAV, records audio in-app, or pastes a YouTube URL
2. App analyses the reference (extracts genre, mood, tempo, key, instrumentation)
3. User reviews/tweaks the extracted style parameters
4. User saves this as their Sound Theme

**Flow B - Describe & Generate:**
1. User selects their saved Sound Theme
2. User describes what the music is for: *"background music for me setting up my tent in the woods"*
3. User sets duration, energy level, and any overrides
4. AI generates music matching the theme + context
5. User previews, regenerates, downloads as MP3, or streams hosted audio

**Flow C - Manual Synthesizer:**
1. User opens the Tone.js synthesizer (works without login)
2. User plays keys, adjusts oscillator/filter/ADSR/reverb
3. User records their performance and downloads it

---

## 2. What's Already Built (Phase 1 - Foundation)

The project has a working Next.js app with all the scaffolding in place. Here's the current state:

### Infrastructure
- **Vercel project** already created and linked (deployment target)
- **Next.js 16.1.7** with App Router, TypeScript, Tailwind CSS v4
- **shadcn/ui v4** (base-nova style, base-ui primitives) - 18 components installed
- **Auth.js v5** (next-auth@beta) with GitHub + Google OAuth configured
- **Prisma v7** with PrismaPg adapter - schema defined, client generated
- **Replicate** SDK installed for MusicGen AI model
- **Tone.js** installed for browser synthesizer
- **Vercel Blob** SDK installed for audio file storage

### Existing Pages & Routes

| Route | File | Status |
|-------|------|--------|
| `/` | `src/app/page.tsx` | Landing page with hero, features, CTAs |
| `/login` | `src/app/(auth)/login/page.tsx` | OAuth sign-in page |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Stats, quick actions, recent generations |
| `/themes` | `src/app/(dashboard)/themes/page.tsx` | Theme list page |
| `/themes/new` | `src/app/(dashboard)/themes/new/page.tsx` | 4-step theme creation wizard |
| `/generate` | `src/app/(dashboard)/generate/page.tsx` | Music generation form with polling |
| `/synthesizer` | `src/app/(dashboard)/synthesizer/page.tsx` | Full Tone.js synth with keyboard, ADSR, recording |
| `/library` | `src/app/(dashboard)/library/page.tsx` | Search/filter/play/download all generations |

### Existing API Routes

| Endpoint | Method | File | Purpose |
|----------|--------|------|---------|
| `/api/auth/[...nextauth]` | * | `src/app/api/auth/[...nextauth]/route.ts` | Auth.js handler |
| `/api/themes` | GET, POST | `src/app/api/themes/route.ts` | List & create themes |
| `/api/themes/[themeId]` | GET, PATCH, DELETE | `src/app/api/themes/[themeId]/route.ts` | Single theme CRUD |
| `/api/generate` | POST | `src/app/api/generate/route.ts` | Start AI generation |
| `/api/generate/[generationId]` | GET | `src/app/api/generate/[generationId]/route.ts` | Poll generation status |
| `/api/generations` | GET | `src/app/api/generations/route.ts` | List generations (library) |
| `/api/webhooks/replicate` | POST | `src/app/api/webhooks/replicate/route.ts` | Replicate completion webhook |

### Existing Library Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth config with Prisma adapter, GitHub + Google providers |
| `src/lib/db.ts` | Prisma client singleton (PrismaPg adapter, connection string from env) |
| `src/lib/replicate.ts` | Replicate SDK wrapper - `startMusicGeneration()` and `checkPrediction()` |
| `src/lib/prompt-builder.ts` | Builds MusicGen prompts from theme parameters |
| `src/lib/validators.ts` | Zod schemas for theme creation, update, and generation |
| `src/lib/constants.ts` | Genre, mood, era, tempo, instrument, content type arrays |
| `src/lib/utils.ts` | `cn()` class merge utility |

### Existing Components

| Component | File |
|-----------|------|
| Sidebar | `src/components/layout/sidebar.tsx` |
| Header | `src/components/layout/header.tsx` (with mobile Sheet nav) |
| SessionProvider | `src/components/providers/session-provider.tsx` |
| ThemeProvider | `src/components/providers/theme-provider.tsx` |
| 18 shadcn/ui components | `src/components/ui/*.tsx` (button, card, input, select, slider, tabs, badge, progress, sonner, textarea, label, separator, avatar, dropdown-menu, tooltip, dialog, sheet) |

### Database Schema (Prisma)

```
Models: User, Account, Session, VerificationToken, SoundTheme, Generation
Enum: GenerationStatus (PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED)

SoundTheme fields: id, userId, name, description, genres[], moods[], era, tempo,
  instruments[], exampleUrls[], exampleBlobUrls[], promptBase, isDefault, timestamps

Generation fields: id, userId, themeId, status, prompt, contextDescription, duration,
  model, replicateId, audioUrl, audioFormat, errorMessage, metadata(JSON), timestamps
```

### Build Status
- `next build` succeeds
- All routes render
- Requires PostgreSQL database + env vars to run fully

---

## 3. Tech Stack Details & Gotchas

### Framework
- **Next.js 16.1.7** - App Router only (no pages/ directory)
- Route params are `Promise<{ param: string }>` - must `await params` in route handlers
- `"use client"` directive required for any component using hooks or browser APIs

### Styling
- **Tailwind CSS v4** - config is in `postcss.config.mjs`, not `tailwind.config.ts`
- **shadcn/ui v4** using `base-nova` style with `base-ui` primitives
- **CRITICAL**: shadcn/ui v4 does NOT support the `asChild` prop on Sheet/DropdownMenu triggers. Style the trigger element directly instead.
- Slider `onValueChange` receives `number | readonly number[]` - use `Array.isArray(v) ? v[0] : v` to extract a single value

### Auth
- **Auth.js v5** (next-auth@beta)
- Config lives at `src/lib/auth.ts` (not root `auth.ts`) so `@/` import alias works
- Middleware uses cookie-based check (not Prisma import) to avoid Edge Runtime Node.js module errors

### Database
- **Prisma v7** with `@prisma/adapter-pg` (PrismaPg)
- **CRITICAL**: Prisma v7 does NOT put the database URL in `schema.prisma`. The URL lives in `prisma.config.ts`
- PrismaClient constructor requires `{ adapter }` argument
- Generated client output: `src/generated/prisma/client` (import from `@/generated/prisma/client`)
- Array fields (genres, moods, instruments, exampleUrls) use PostgreSQL native arrays

### Validation
- **Zod v4** - uses `.issues` not `.errors` on parse failures

### AI Music Generation
- **Replicate** SDK calling `meta/musicgen` (melody variant)
- Supports webhook callbacks for async completion
- Duration range: 5-30 seconds currently
- Output format: MP3

### Audio
- **Tone.js** for browser-based synthesizer
- Lazy-loaded with dynamic `import("tone")` on first user interaction
- **Vercel Blob** for persistent audio file hosting

---

## 4. Environment Variables Required

```env
# Auth.js
AUTH_SECRET=                    # Generate with: npx auth secret
AUTH_GITHUB_ID=                 # GitHub OAuth App client ID
AUTH_GITHUB_SECRET=             # GitHub OAuth App client secret
AUTH_GOOGLE_ID=                 # Google OAuth client ID
AUTH_GOOGLE_SECRET=             # Google OAuth client secret

# Database
DATABASE_URL=                   # PostgreSQL connection string

# AI Music Generation
REPLICATE_API_TOKEN=            # From replicate.com/account/api-tokens

# Audio Storage
BLOB_READ_WRITE_TOKEN=          # Vercel Blob read/write token

# App URL (for Replicate webhooks)
NEXT_PUBLIC_APP_URL=            # e.g., https://soundforge.vercel.app
```

---

## 5. NEW Feature: Reference-Based Song Analysis (The Big Addition)

This is the major new direction. Instead of only manually picking genres/moods/instruments, users can now provide a **reference song** and the app will analyse it to extract style parameters automatically.

### 5A. Input Methods for Reference Songs

**Method 1 - File Upload:**
- User uploads an MP3, WAV, or M4A file
- File stored in Vercel Blob
- Sent to audio analysis pipeline

**Method 2 - In-App Recording:**
- Use the existing Tone.js `Recorder` (already built in synthesizer page)
- Or add a microphone recording feature using the Web Audio API / MediaRecorder
- User plays/sings/hums a reference and records it
- Recording stored in Vercel Blob

**Method 3 - YouTube/Video URL:**
- User pastes a YouTube URL (or Instagram/TikTok link)
- Backend extracts audio from the video
- Options: use a service like `ytdl-core` / `yt-dlp` on the server, or use a third-party API
- Extracted audio stored temporarily for analysis

### 5B. Audio Analysis Pipeline

Once we have the reference audio, we need to extract musical characteristics:

**Option A - AI-Based Analysis (Recommended):**
- Send the audio to an AI model that can describe music
- Could use: Replicate's audio analysis models, OpenAI Whisper + GPT for description, or a dedicated music information retrieval (MIR) API
- Extract: genre, mood, tempo (BPM), key, instrumentation, energy level, production style

**Option B - Signal Processing Libraries:**
- Use `essentia.js` or `meyda` for browser-side audio feature extraction
- Extract: tempo, spectral features, loudness, zero-crossing rate
- Map extracted features to genre/mood categories

**Option C - Hybrid:**
- Use signal processing for concrete features (BPM, key, spectral data)
- Use AI for subjective features (mood, genre classification, description)

### 5C. Schema Changes Needed

Add to `SoundTheme`:
```
referenceAudioUrl     String?        // Vercel Blob URL of uploaded/recorded reference
referenceSourceUrl    String?        // Original YouTube/video URL if applicable
referenceSourceType   String?        // "upload" | "recording" | "youtube" | "url"
analysedGenres        String[]       // AI-extracted genres from reference
analysedMoods         String[]       // AI-extracted moods from reference
analysedTempo         Int?           // Detected BPM
analysedKey           String?        // Detected musical key
analysedInstruments   String[]       // Detected instruments
analysisConfidence    Float?         // Confidence score of analysis
analysisRaw           Json?          // Raw analysis output for debugging
```

Add new model `ReferenceTrack`:
```
model ReferenceTrack {
  id              String     @id @default(cuid())
  themeId         String
  sourceType      String     // "upload" | "recording" | "youtube" | "url"
  sourceUrl       String?    // Original URL (YouTube, etc.)
  blobUrl         String     // Vercel Blob storage URL
  filename        String?
  duration        Int?       // Duration in seconds
  fileSize        Int?       // Size in bytes
  mimeType        String?
  analysisResult  Json?      // Full analysis output
  createdAt       DateTime   @default(now())

  theme           SoundTheme @relation(fields: [themeId], references: [id], onDelete: Cascade)
}
```

### 5D. New API Routes Needed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload/audio` | POST | Handle audio file upload to Vercel Blob |
| `/api/analyse/audio` | POST | Send audio for AI analysis, return style params |
| `/api/extract/youtube` | POST | Extract audio from YouTube URL |
| `/api/themes/[themeId]/references` | GET, POST | Manage reference tracks for a theme |

### 5E. Updated Theme Creation Flow

The new `/themes/new` wizard should be:

1. **Step 1 - Reference Input** (NEW)
   - Three tabs: "Upload a Song" / "Record Audio" / "Paste a Link"
   - Upload: drag-and-drop or file picker for MP3/WAV/M4A
   - Record: microphone recording with visualizer
   - Link: URL input with YouTube/Spotify/SoundCloud support
   - "Skip" option to go straight to manual selection

2. **Step 2 - Analysis Review** (NEW)
   - Show extracted style parameters with confidence scores
   - User can adjust/override any extracted value
   - Side-by-side: "What we detected" vs "Your adjustments"

3. **Step 3 - Channel Info** (existing, enhanced)
   - Theme name, content type, channel description
   - Pre-filled based on analysis if available

4. **Step 4 - Style & Mood** (existing, enhanced)
   - Genre, mood, era, tempo selectors
   - Pre-selected based on analysis results
   - User can override anything

5. **Step 5 - Instruments & References** (existing, enhanced)
   - Instrument selector pre-filled from analysis
   - Additional reference URLs
   - Preview of the AI prompt that will be generated

6. **Step 6 - Review & Create**
   - Full summary of all parameters
   - Prompt preview
   - Save button

---

## 6. Remaining Build Phases

### Phase 2: Theme System (Wire Up)
- Connect theme wizard UI to API (already has fetch calls, needs database running)
- Add reference song upload/recording/URL extraction
- Build audio analysis pipeline
- Add theme editing page
- Add theme list page with cards showing each theme's parameters

### Phase 3: AI Music Generation (Wire Up & Test)
- Test Replicate MusicGen integration end-to-end
- Improve prompt builder to incorporate analysis data
- Add generation options: energy level, specific overrides
- Store generated audio in Vercel Blob (currently stores Replicate's temporary URL)
- Extend duration support beyond 30 seconds (chain multiple generations or use longer models)

### Phase 4: Library & Audio Player
- Build proper audio player component (waveform visualization, seek, volume)
- Add track management: rename, tag, favourite, delete
- Add track categories: intros, outros, background, transitions
- Batch download support
- Share/embed links for tracks

### Phase 5: Tone.js Synthesizer (Polish & Integration)
- Test existing synth with audio output
- Add preset sounds (common synth patches)
- Add ability to save synth recordings to library
- Add ability to use synth recordings as reference tracks for themes
- Add effects chain: delay, chorus, distortion, EQ
- Export recordings as WAV/MP3 (currently exports WebM)

### Phase 6: Polish & Launch
- Error handling and loading states throughout
- Mobile-responsive polish
- Landing page improvements (demo audio, testimonials section)
- SEO, OG images, sitemap
- Rate limiting on API routes
- Usage tracking / generation limits
- Pricing page (if adding paid tier)
- Terms of service / privacy policy

---

## 7. File Structure

```
Sound Creation App/
  .env                              # Environment variables (DO NOT COMMIT)
  .env.example                      # Template for env vars
  next.config.ts                    # Next.js config
  package.json                      # Dependencies & scripts
  prisma.config.ts                  # Prisma v7 datasource config
  prisma/
    schema.prisma                   # Database schema
  src/
    app/
      globals.css                   # Tailwind v4 globals
      layout.tsx                    # Root layout (providers, fonts)
      page.tsx                      # Landing page (/)
      favicon.ico
      (auth)/
        layout.tsx                  # Auth layout (minimal)
        login/
          page.tsx                  # Login page (/login)
      (dashboard)/
        layout.tsx                  # Dashboard layout (sidebar + header)
        dashboard/
          page.tsx                  # Dashboard (/dashboard)
        themes/
          page.tsx                  # Theme list (/themes)
          new/
            page.tsx                # New theme wizard (/themes/new)
        generate/
          page.tsx                  # Generate music (/generate)
        synthesizer/
          page.tsx                  # Tone.js synth (/synthesizer)
        library/
          page.tsx                  # Audio library (/library)
      api/
        auth/
          [...nextauth]/
            route.ts                # Auth.js API handler
        themes/
          route.ts                  # GET/POST themes
          [themeId]/
            route.ts                # GET/PATCH/DELETE single theme
        generate/
          route.ts                  # POST start generation
          [generationId]/
            route.ts                # GET generation status
        generations/
          route.ts                  # GET all generations (library)
        webhooks/
          replicate/
            route.ts                # POST Replicate webhook
    components/
      layout/
        sidebar.tsx                 # Desktop sidebar navigation
        header.tsx                  # Top header + mobile nav (Sheet)
      providers/
        session-provider.tsx        # Auth.js SessionProvider wrapper
        theme-provider.tsx          # next-themes ThemeProvider wrapper
      ui/
        *.tsx                       # 18 shadcn/ui components
    generated/
      prisma/                       # Prisma v7 generated client (DO NOT EDIT)
    lib/
      auth.ts                       # NextAuth config
      db.ts                         # Prisma client singleton
      replicate.ts                  # Replicate SDK wrapper
      prompt-builder.ts             # MusicGen prompt construction
      validators.ts                 # Zod schemas
      constants.ts                  # Genre/mood/era/tempo/instrument arrays
      utils.ts                      # cn() utility
```

---

## 8. Commands

```bash
# Development
npm run dev                         # Start dev server (localhost:3000)
npm run build                       # Production build
npm run start                       # Start production server
npm run lint                        # ESLint

# Database
npx prisma generate                 # Regenerate Prisma client
npx prisma migrate dev              # Run migrations in development
npx prisma migrate deploy           # Run migrations in production
npx prisma studio                   # Open Prisma Studio GUI

# shadcn/ui
npx shadcn@latest add [component]   # Add a new shadcn component
```

---

## 9. Design Principles

- **Simplicity first**: Creators are not musicians. The UI should feel like describing a vibe, not configuring a DAW.
- **Reference-driven**: The easiest way to say "I want music like this" is to show an example. Upload/record/link should be the primary creation path.
- **Consistent branding**: Once a theme is set, every generated track should feel like it belongs to the same channel.
- **Fast iteration**: Generate, preview, tweak, regenerate. The loop should be tight and low-friction.
- **Mobile-friendly**: Creators are often on their phones. The app must work well on mobile.
- **Download-first**: Users need MP3 files they can drop into their video editor. Hosting is a bonus, not a requirement.
