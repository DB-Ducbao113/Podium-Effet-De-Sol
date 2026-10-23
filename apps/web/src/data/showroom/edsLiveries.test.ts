import { describe, expect, it } from 'vitest';
import { EDS_LIVERIES, EDS_LIVERY_IDS, getEDSLivery } from './edsLiveries';

describe('EDS original livery presets', () => {
  it('exposes the six presets approved by the M1 migration plan', () => {
    expect(EDS_LIVERY_IDS).toEqual([
      'eds-carbon',
      'eds-aero',
      'eds-crimson',
      'eds-monochrome',
      'eds-gold',
      'eds-electric',
    ]);
  });

  it.each(EDS_LIVERY_IDS)('provides complete PBR colors for %s', (id) => {
    const preset = getEDSLivery(id);
    expect(preset).toBe(EDS_LIVERIES[id]);
    expect(preset.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(preset.secondary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(preset.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(preset.roughness).toBeGreaterThanOrEqual(0);
    expect(preset.roughness).toBeLessThanOrEqual(1);
    expect(preset.metalness).toBeGreaterThanOrEqual(0);
    expect(preset.metalness).toBeLessThanOrEqual(1);
    expect(preset.clearcoat).toBeGreaterThanOrEqual(0);
    expect(preset.clearcoat).toBeLessThanOrEqual(1);
  });

  it('contains no constructor or sponsor names in preset metadata', () => {
    const serialized = JSON.stringify(EDS_LIVERIES).toLowerCase();
    for (const protectedName of [
      'ferrari',
      'mercedes',
      'red bull',
      'mclaren',
      'pirelli',
      'shell',
      'bbs',
    ]) {
      expect(serialized).not.toContain(protectedName);
    }
  });
});
