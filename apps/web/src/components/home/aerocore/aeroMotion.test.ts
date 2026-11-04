import { describe, expect, it } from 'vitest';
import { AERO_SECTION_IDS, getAeroEnergy, getAeroPhase } from './aeroMotion';

describe('AEROCORE scroll choreography', () => {
  it('maps the four existing sections', () => {
    expect(AERO_SECTION_IDS).toHaveLength(4);
    const a = [0, 800, 1700, 2500];
    expect(getAeroPhase(a, 0)).toBe(0);
    expect(getAeroPhase(a, 800)).toBe(1);
    expect(getAeroPhase(a, 1700)).toBe(2);
    expect(getAeroPhase(a, 2600)).toBe(3);
  });
  it('reverses exactly and clamps', () => {
    const a = [0, 800, 1600, 2400];
    expect(getAeroPhase(a, 1200)).toBe(1.5);
    expect(getAeroPhase(a, 500)).toBe(.625);
    expect(getAeroPhase(a, -300)).toBe(0);
    expect(getAeroPhase(a, 8000)).toBe(3);
  });
  it('keeps energy values bounded', () => {
    expect(getAeroPhase([], NaN)).toBe(0);
    for (const p of [-5, 0, .5, 1.5, 2, 2.5, 3, 8]) {
      expect(getAeroEnergy(p)).toBeGreaterThanOrEqual(0);
      expect(getAeroEnergy(p)).toBeLessThanOrEqual(1);
    }
  });
});
