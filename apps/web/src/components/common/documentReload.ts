export function isDocumentReload(
  timing: Pick<Performance, 'getEntriesByType'> | undefined = typeof performance === 'undefined'
    ? undefined
    : performance,
): boolean {
  try {
    const entries = timing?.getEntriesByType('navigation');
    if (entries?.length !== 1) return false;
    const navigation = entries[0] as PerformanceNavigationTiming;
    return navigation.entryType === 'navigation' && navigation.type === 'reload';
  } catch {
    // An unavailable or incomplete Navigation Timing API is not evidence of a reload.
    return false;
  }
}
