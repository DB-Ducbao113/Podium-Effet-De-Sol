import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { F1_VISUAL_DRIVER_IDS_2026, F1_VISUAL_TEAM_IDS_2026, driverConcept2026, teamConcept2026 } from './f1VisualAssets2026';

describe('owner-provided F1 2026 concept assets', () => {
  it('maps 22 drivers and 11 teams to existing production WebP files when present', () => {
    expect(F1_VISUAL_DRIVER_IDS_2026).toHaveLength(22);
    expect(F1_VISUAL_TEAM_IDS_2026).toHaveLength(11);
    const hasP5ReviewAssets = existsSync(join(process.cwd(), 'public/images/p5'));
    for (const driverId of F1_VISUAL_DRIVER_IDS_2026) {
      const src = driverConcept2026(driverId, 2026);
      expect(src).toMatch(/^\/images\/p5\/concepts-2026\/headshots\/[a-z-]+\.webp$/);
      if (hasP5ReviewAssets) {
        expect(existsSync(join('public', src!))).toBe(true);
      }
    }
    for (const teamId of F1_VISUAL_TEAM_IDS_2026) {
      const src = teamConcept2026(teamId, 2026);
      expect(src).toMatch(/^\/images\/p5\/concepts-2026\/cars\/[a-z-]+\.webp$/);
      if (hasP5ReviewAssets) {
        expect(existsSync(join('public', src!))).toBe(true);
      }
    }
  });

  it('does not assign a concept image to an unmatched identity or historical season', () => {
    expect(driverConcept2026('hirakawa', 2026)).toBeUndefined();
    expect(driverConcept2026('norris', 2025)).toBeUndefined();
    expect(teamConcept2026('mclaren', 2024)).toBeUndefined();
    expect(teamConcept2026('unknown', 2026)).toBeUndefined();
  });
});
