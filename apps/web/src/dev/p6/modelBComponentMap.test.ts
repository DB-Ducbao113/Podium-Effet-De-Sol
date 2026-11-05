import { describe, expect, it } from 'vitest';
import {
  MODEL_B_COMPONENT_GROUPS, MODEL_B_PHYSICAL_SURFACES,
  groupForSurface,
} from './modelBComponentMap';
import { PAINT_LAYOUT_FINDINGS, getPaintLayoutCounts, getPaintLayoutReview } from './paintLayoutReview';
import { STANDARD_2026_REFERENCE_SETS } from './standard2026References';

describe('Model B semantic physical component map', () => {
  it('contains the agreed 30 paint-design families and independently tracks every side', () => {
    expect(MODEL_B_COMPONENT_GROUPS).toHaveLength(30);
    expect(new Set(MODEL_B_COMPONENT_GROUPS.map((group) => group.id)).size).toBe(30);
    expect(MODEL_B_PHYSICAL_SURFACES).toHaveLength(54);
    expect(new Set(MODEL_B_PHYSICAL_SURFACES.map((surface) => surface.id)).size).toBe(54);
    expect(MODEL_B_PHYSICAL_SURFACES.every((surface) =>
      surface.geometryEvidence === 'semantic-only' && surface.meshName === null,
    )).toBe(true);
  });

  it('never merges the intake rim into the broad sidepod or makes its left/right one patch', () => {
    const lip = MODEL_B_PHYSICAL_SURFACES.filter((surface) => surface.groupId === 'sidepod-inlet-lip');
    expect(lip.map((surface) => surface.side)).toEqual(['left', 'right']);
    expect(lip.map((surface) => surface.id)).toEqual([
      'sidepod-inlet-lip-left', 'sidepod-inlet-lip-right',
    ]);
    expect(groupForSurface('sidepod-inlet-lip-right')?.priority).toBe('critical');
    expect(groupForSurface('sidepod-main-face-left')?.id).toBe('sidepod-main-face');
  });

  it('tracks all four wheel covers, rims and tire sidewalls independently', () => {
    for (const family of ['wheel-cover','rim-accent','tire-sidewall']) {
      const wheels = MODEL_B_PHYSICAL_SURFACES.filter((surface) => surface.groupId === family);
      expect(wheels.map((item) => item.side)).toEqual([
        'front-left','front-right','rear-left','rear-right',
      ]);
    }
  });

  it('does not approve any paint patch without actual Model B geometry and a photo', () => {
    for (const teamId of Object.keys(STANDARD_2026_REFERENCE_SETS) as
      Array<keyof typeof STANDARD_2026_REFERENCE_SETS>) {
      const reviews = getPaintLayoutReview(teamId);
      const counts = getPaintLayoutCounts(teamId);
      expect(reviews).toHaveLength(30);
      expect(counts.total).toBe(30);
      expect(counts.approved).toBe(0);
      expect(counts.confirmedGaps + counts.codeRisks + counts.photoNeeded).toBe(30);
      expect(reviews.every((row) => row.approved === false)).toBe(true);
    }
  });

  it('keeps every issue attached to a valid unique team + component and explicit evidence class', () => {
    const teams = new Set(Object.keys(STANDARD_2026_REFERENCE_SETS));
    const groups = new Set(MODEL_B_COMPONENT_GROUPS.map((item) => item.id));
    const keys = new Set<string>();
    for (const finding of PAINT_LAYOUT_FINDINGS) {
      expect(teams.has(finding.teamId)).toBe(true);
      expect(groups.has(finding.groupId)).toBe(true);
      expect(keys.has(finding.teamId + ':' + finding.groupId)).toBe(false);
      keys.add(finding.teamId + ':' + finding.groupId);
      if (finding.evidence === 'official-design-description') {
        expect(finding.sourceUrl).toMatch(/^https:\/\//);
      }
    }
  });
});
