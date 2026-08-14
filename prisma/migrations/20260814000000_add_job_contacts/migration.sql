CREATE TYPE "JobContactType" AS ENUM ('RECRUITER', 'HIRING_MANAGER', 'ENGINEER', 'CONNECTION', 'LEADERSHIP', 'OTHER');

CREATE TYPE "OutreachStatus" AS ENUM ('NOT_CONTACTED', 'CONTACTED', 'RESPONDED', 'FOLLOW_UP_NEEDED', 'CLOSED');

CREATE TABLE "JobContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "company" TEXT,
    "profileUrl" TEXT,
    "email" TEXT,
    "contactType" "JobContactType" NOT NULL,
    "relevanceNotes" TEXT,
    "outreachStatus" "OutreachStatus" NOT NULL DEFAULT 'NOT_CONTACTED',
    "lastContactedAt" TIMESTAMP(3),
    "followUpAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobContact_userId_idx" ON "JobContact"("userId");

CREATE INDEX "JobContact_jobId_idx" ON "JobContact"("jobId");

CREATE INDEX "JobContact_userId_followUpAt_idx" ON "JobContact"("userId", "followUpAt");

ALTER TABLE "JobContact" ADD CONSTRAINT "JobContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobContact" ADD CONSTRAINT "JobContact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
