export function getUtcDayRange(now: Date) {
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const nextDayStart = new Date(dayStart);
  nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);

  return {
    dayStart,
    nextDayStart,
  };
}

export function hasReachedDailyAnalysisLimit(
  runsToday: number,
  dailyLimit: number,
): boolean {
  return runsToday >= dailyLimit;
}
