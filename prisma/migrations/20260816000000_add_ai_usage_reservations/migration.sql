-- CreateEnum
CREATE TYPE "AiUsageQuota" AS ENUM ('JOB_ANALYSIS', 'CAREER_GUIDANCE', 'PROFILE_EXTRACTION');

-- CreateEnum
CREATE TYPE "AiUsageFeature" AS ENUM ('JOB_ANALYSIS', 'JOB_MATCH', 'INTERVIEW_PREP', 'PROFILE_EXTRACTION', 'RESUME_EXTRACTION');

-- CreateEnum
CREATE TYPE "AiUsageReservationStatus" AS ENUM ('PENDING', 'COMPLETED', 'RELEASED');

-- CreateTable
CREATE TABLE "AiUsageDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quota" "AiUsageQuota" NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "remaining" INTEGER NOT NULL,
    "inFlight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageConcurrency" (
    "userId" TEXT NOT NULL,
    "activeRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageConcurrency_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AiUsageReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usageDayId" TEXT NOT NULL,
    "feature" "AiUsageFeature" NOT NULL,
    "status" "AiUsageReservationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageDaily_userId_quota_day_key" ON "AiUsageDaily"("userId", "quota", "day");
CREATE INDEX "AiUsageDaily_userId_day_idx" ON "AiUsageDaily"("userId", "day");
CREATE INDEX "AiUsageReservation_userId_status_expiresAt_idx" ON "AiUsageReservation"("userId", "status", "expiresAt");
CREATE INDEX "AiUsageReservation_usageDayId_status_idx" ON "AiUsageReservation"("usageDayId", "status");

-- Guard against corrupted counters even if a future code path bypasses the
-- conditional updates used by the reservation service.
ALTER TABLE "AiUsageDaily" ADD CONSTRAINT "AiUsageDaily_remaining_nonnegative" CHECK ("remaining" >= 0);
ALTER TABLE "AiUsageDaily" ADD CONSTRAINT "AiUsageDaily_inFlight_nonnegative" CHECK ("inFlight" >= 0);
ALTER TABLE "AiUsageConcurrency" ADD CONSTRAINT "AiUsageConcurrency_activeRequests_nonnegative" CHECK ("activeRequests" >= 0);

-- AddForeignKey
ALTER TABLE "AiUsageDaily" ADD CONSTRAINT "AiUsageDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsageConcurrency" ADD CONSTRAINT "AiUsageConcurrency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsageReservation" ADD CONSTRAINT "AiUsageReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsageReservation" ADD CONSTRAINT "AiUsageReservation_usageDayId_fkey" FOREIGN KEY ("usageDayId") REFERENCES "AiUsageDaily"("id") ON DELETE CASCADE ON UPDATE CASCADE;
