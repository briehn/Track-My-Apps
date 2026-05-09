CREATE TABLE "JobMatchRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMatchRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobMatchRun_userId_createdAt_idx" ON "JobMatchRun"("userId", "createdAt");

CREATE INDEX "JobMatchRun_jobId_idx" ON "JobMatchRun"("jobId");

ALTER TABLE "JobMatchRun" ADD CONSTRAINT "JobMatchRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobMatchRun" ADD CONSTRAINT "JobMatchRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
