export function isJobAnalysisStale(
  jobUpdatedAt: Date,
  analysisUpdatedAt: Date | null | undefined,
) {
  if (!analysisUpdatedAt) {
    return false;
  }

  return jobUpdatedAt.getTime() > analysisUpdatedAt.getTime();
}
