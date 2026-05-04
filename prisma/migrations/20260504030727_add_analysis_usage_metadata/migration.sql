-- AlterTable
ALTER TABLE "JobAnalysisRun" ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "outputTokens" INTEGER,
ADD COLUMN     "totalTokens" INTEGER;
