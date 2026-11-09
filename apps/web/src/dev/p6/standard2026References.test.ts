import { describe, expect, it } from 'vitest';
import { liveryDefinitions } from './liveryDefinitions';
import { teamLiveries } from './teamLiveries';
import { STANDARD_2026_REFERENCE_SETS } from './standard2026References';

describe('canonical 2026 reference sets', () => {
  it('indexes exactly the same 11 teams as the P6 runtime', () => {
    const teams = teamLiveries.map(({ id }) => id).sort();
    expect(teams).toHaveLength(11);
    expect(Object.keys(STANDARD_2026_REFERENCE_SETS).sort()).toEqual(teams);
    expect(Object.keys(liveryDefinitions).sort()).toEqual(teams);
  });

  it('keeps all initial sources in the standard 2026 variant and external-only', () => {
    const sources = Object.values(STANDARD_2026_REFERENCE_SETS);
    expect(new Set(sources.map((source) => source.sourceSetId)).size).toBe(11);
    for (const source of sources) {
      expect(source.variantId).toBe('season-default-2026');
      expect(source.sourceSetId).toContain(source.teamId);
      expect(source.galleryUrl).toMatch(/^https:\/\/www\.formula1\.com\/en\/latest\/article\//);
      expect(source.photoIndexStatus).toBe('needs-angle-audit');
      expect(source.usage).toBe('external-reference-only');
    }
  });

  it('does not mix the Cadillac Belgium revision into the launch registry', () => {
    const cadillac = teamLiveries.find((team) => team.id === 'cadillac');
    expect(cadillac?.car).toBe('2026 debut');
    expect(cadillac?.description).toContain('asymmetric');
    const cadillacDecals = liveryDefinitions.cadillac.decals;
    expect(cadillacDecals).toHaveLength(4);
    expect(cadillacDecals.every((mark) => mark.version === 'standard 2026 launch')).toBe(true);
    expect(cadillacDecals.find((mark) => mark.id === 'cadillac-twg-left')?.anchor.side).toBe('left');
    expect(cadillacDecals.find((mark) => mark.id === 'cadillac-twg-right')?.anchor.side).toBe('right');
    expect(cadillacDecals.find((mark) => mark.id === 'cadillac-twg-right')?.artwork).toBe('twgInverse');
  });
});
