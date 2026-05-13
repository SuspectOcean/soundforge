-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable: add optional referenceTrackId to SoundTheme
ALTER TABLE "SoundTheme" ADD COLUMN "referenceTrackId" TEXT;

-- CreateTable
CREATE TABLE "ReferenceTrack" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION,
    "bpm" DOUBLE PRECISION,
    "musicalKey" TEXT,
    "genre" TEXT,
    "mood" TEXT,
    "energy" TEXT,
    "instrumentation" TEXT[],
    "descriptors" TEXT[],
    "analysisStatus" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "analysisRawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferenceTrack_userId_idx" ON "ReferenceTrack"("userId");

-- CreateIndex
CREATE INDEX "ReferenceTrack_analysisStatus_idx" ON "ReferenceTrack"("analysisStatus");

-- AddForeignKey: ReferenceTrack.userId → User.id
ALTER TABLE "ReferenceTrack" ADD CONSTRAINT "ReferenceTrack_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SoundTheme.referenceTrackId → ReferenceTrack.id
ALTER TABLE "SoundTheme" ADD CONSTRAINT "SoundTheme_referenceTrackId_fkey"
    FOREIGN KEY ("referenceTrackId") REFERENCES "ReferenceTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
