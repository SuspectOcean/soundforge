# SoundForge — Operational Recovery

Run these commands **in Windows PowerShell or Terminal** from the project root.

## Step 1 — Commit all local code and force-push to GitHub

```powershell
cd "C:\Users\ross_\Documents\Sound Creation App"
git add -A
git commit -m "Restore: Phase 1+2+3 working codebase, replace broken remote"
git push origin main --force
```

> The remote GitHub repo is full of corrupted placeholder code (wrong import paths,
> missing exports, garbage bytes). Our local code is the working code.
> Force-push is intentional and correct.

After push, Vercel will auto-trigger a new deployment.

---

## Step 2 — Fix Vercel environment variables

Go to: https://vercel.com/suspectoceans-projects/soundforge/settings/environment-variables

**Currently missing (add these):**
- `BLOB_READ_WRITE_TOKEN` — from vercel.com/dashboard → Storage → your Blob store
- `REPLICATE_API_TOKEN` — from replicate.com/account/api-tokens

**Currently "Needs Attention" (re-enter values):**
- `AUTH_SECRET` — run `npx auth secret` locally to generate one
- `AUTH_GITHUB_SECRET` — from github.com/settings/developers → your OAuth App
- `AUTH_GOOGLE_SECRET` — from console.cloud.google.com → your OAuth Client
- `DATABASE_URL` — your Neon/Postgres connection string with `?sslmode=require`
- `DATABASE_POSTGRES_PRISMA_URL` — same as DATABASE_URL but with `?pgbouncer=true&connect_timeout=15&sslmode=require`
- `DATABASE_POSTGRES_URL_NO_SSL` — same but without SSL params
- `DATABASE_URL_UNPOOLED` — direct connection URL (no pgbouncer)

**These look OK (should already have values):**
- `AUTH_TRUST_HOST` — set to `true`
- `NEXT_PUBLIC_APP_URL` — set to `https://soundforge-liart.vercel.app`
- `AUTH_GITHUB_ID`
- `AUTH_GOOGLE_ID`
- DATABASE_POSTGRES_* host/user/database vars

**Optional (leave unset to skip AI audio analysis):**
- `REPLICATE_ANALYSIS_MODEL` — e.g. `andreasjansson/instruct-music-decoder`
- `REPLICATE_WEBHOOK_SECRET` — from replicate.com/account/webhooks
- `MAX_AUDIO_UPLOAD_MB` — default is 25

---

## Step 3 — Run database migration

After Vercel builds successfully, run the Prisma migration to apply the
ReferenceTrack schema (Phase 2 addition).

Option A — via Vercel CLI:
```powershell
npx vercel env pull .env.local
npx prisma migrate deploy
```

Option B — connect directly to Neon DB and run:
```sql
-- Check migration_log table to see if migration already applied
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;
```

If migration not applied, run from local terminal with real DATABASE_URL in .env:
```powershell
npx prisma migrate deploy
```

---

## Step 4 — Smoke test in browser

After deployment succeeds, visit:
- https://soundforge-liart.vercel.app/ — landing page
- https://soundforge-liart.vercel.app/login — login page
- https://soundforge-liart.vercel.app/dashboard — should redirect to login if not authed
- https://soundforge-liart.vercel.app/themes — requires auth
- https://soundforge-liart.vercel.app/generate — requires auth

---

## What was wrong in the remote

The GitHub remote (SuspectOcean/soundforge) had been overwritten with broken code:
- `src/lib/auth.ts` — replaced with a corrupted stub (no `auth` export)
- `src/app/api/generate/route.ts` — imports `getSession` (doesn't exist), placeholder logic
- `src/app/api/generate/[id]/route.ts` — imports from `"A/lib/auth"` (typo for `@/lib/auth`), garbage bytes in strings
- `src/app/api/themes/route.ts` — imports from `"A/lib/db"` (typo), undefined `userId`, wrong field names
- `src/app/api/webhooks/route.ts` — references `prisma.webhook` model (doesn't exist in schema)
- `src/app/api/generate/list/route.ts` — `findMany(args, 100)` wrong signature
- `package.json` build script — had `prisma db push` (dangerous in production)
- Every Vercel deployment since March 24 failed with build error

All of this has been replaced by the force-push of our working local code.
