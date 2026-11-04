export function resolveCalendarEntry(requestedRound: number | null) {
  return {
    expandedRound: requestedRound,
    autoScrollRound: requestedRound,
  };
}
