export function resolveCalendarEntry(
  requestedRound: number | null,
  relevantRound: number | null,
) {
  return {
    expandedRound: requestedRound ?? relevantRound,
    autoScrollRound: requestedRound,
  };
}
