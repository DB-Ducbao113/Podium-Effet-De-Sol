import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const weekendResults = readFileSync('src/components/championship/WeekendResults.tsx', 'utf8');

describe('compact Results summary', () => {
  it('counts only rounds with an available verified session', () => {
    expect(weekendResults).toContain('(card) => card.availableCount > 0');
    expect(weekendResults).toContain('{resultsRoundCount}/{calendar.length}');
  });

  it('does not show a transient verified-session total on first paint', () => {
    expect(weekendResults).not.toContain('verifiedSessionCount');
    expect(weekendResults).not.toContain('sessionCountPending');
  });

  it('retains truthful unavailable states for unverified sessions', () => {
    expect(weekendResults).toContain('className="c11-results-empty" role="status"');
    expect(weekendResults).toContain('No verified classification is available');
  });
});
