import { describe, expect, it } from 'vitest';
import { STANDARD_2026_PAINT } from './standard2026Paint';
import { STANDARD_2026_REFERENCE_SETS } from './standard2026References';
import { teamLiveries } from './teamLiveries';

describe('Model B 2026 canonical paint contract', () => {
  it('has exactly one complete palette per 2026 constructor', () => {
    expect(Object.keys(STANDARD_2026_PAINT).sort()).toEqual(
      Object.keys(STANDARD_2026_REFERENCE_SETS).sort(),
    );
    expect(Object.keys(STANDARD_2026_PAINT)).toHaveLength(11);
    const paintKeys = [
      'primary', 'secondary', 'accent', 'ink',
      'side', 'cover', 'nose', 'wing', 'dark', 'light', 'detail',
    ] as const;
    for (const colors of Object.values(STANDARD_2026_PAINT)) {
      for (const key of paintKeys) expect(colors[key]).toMatch(/^#[0-9a-f]{6}$/);
      expect(['satin', 'gloss']).toContain(colors.finish);
    }
  });

  it('binds each 3D paint swatch to the exact same source as the paint atlas', () => {
    for (const livery of teamLiveries) {
      const paint = STANDARD_2026_PAINT[livery.id as keyof typeof STANDARD_2026_PAINT];
      expect(paint).toBeDefined();
      expect(livery.primary).toBe(paint.primary);
      expect(livery.secondary).toBe(paint.secondary);
      expect(livery.accent).toBe(paint.accent);
      expect(livery.side).toBe(paint.side);
      expect(livery.cover).toBe(paint.cover);
      expect(livery.nose).toBe(paint.nose);
      expect(livery.wing).toBe(paint.wing);
      expect(livery.finish).toBe(paint.finish);
    }
  });

  it('preserves the 2026 color hierarchy in the known complex team schemes', () => {
    // These are role-level identity guards, not calibrated photographic approval.
    expect(STANDARD_2026_PAINT.ferrari.primary).not.toBe(STANDARD_2026_PAINT.ferrari.secondary);
    expect(STANDARD_2026_PAINT.mclaren.side).toBe(STANDARD_2026_PAINT.mclaren.secondary);
    expect(STANDARD_2026_PAINT.redbull.primary).not.toBe('#f1f2ee');
    expect(STANDARD_2026_PAINT.williams.side).toBe(STANDARD_2026_PAINT.williams.detail);
    expect(STANDARD_2026_PAINT.alpine.side).toBe(STANDARD_2026_PAINT.alpine.secondary);
    expect(STANDARD_2026_PAINT.cadillac.primary).not.toBe(STANDARD_2026_PAINT.cadillac.dark);
  });
});
