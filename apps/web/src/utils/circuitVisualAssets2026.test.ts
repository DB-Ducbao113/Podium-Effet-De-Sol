import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CALENDAR_2026 } from '../data/championship/calendar';
import { getCircuitByRound } from '../data/championship/circuitsData';
import { CIRCUIT_VISUALS_2026, circuitVisual2026For } from './circuitVisualAssets2026';

describe('2026 circuit visual registry', () => {
  it('only maps photos to matching 2026 circuit IDs and existing local files', () => {
    expect(CALENDAR_2026).toHaveLength(23);
    expect(Object.keys(CIRCUIT_VISUALS_2026)).toHaveLength(10);
    for (const visual of Object.values(CIRCUIT_VISUALS_2026)) {
      expect(getCircuitByRound(visual.round)?.id).toBe(visual.circuitId);
      for (const path of [visual.desktop, visual.mobile, visual.thumbnail]) {
        expect(existsSync(resolve(process.cwd(), 'public', path.slice(1)))).toBe(true);
      }
      expect(visual.sourcePage).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File/);
      expect(visual.credit).toBeTruthy();
      expect(visual.license).toBeTruthy();
    }
  });

  it('keeps missing venues and historical seasons on their existing fallback', () => {
    expect(circuitVisual2026For(2026, 'madring')).toBeUndefined();
    expect(circuitVisual2026For(2026, 'marina-bay')).toBeUndefined();
    expect(circuitVisual2026For(2026, 'yas-marina')).toBeUndefined();
    expect(circuitVisual2026For(2025, 'spa')).toBeUndefined();
  });
});
