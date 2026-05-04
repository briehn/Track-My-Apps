-- CreateTable
CREATE TABLE "JobAnalysisRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobAnalysisRun_userId_createdAt_idx" ON "JobAnalysisRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "JobAnalysisRun_jobId_idx" ON "JobAnalysisRun"("jobId");

-- AddForeignKey
ALTER TABLE "JobAnalysisRun" ADD CONSTRAINT "JobAnalysisRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAnalysisRun" ADD CONSTRAINT "JobAnalysisRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
