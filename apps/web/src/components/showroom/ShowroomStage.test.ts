import { describe, expect, it } from 'vitest';
import { Color } from 'three';
import {
  getStageFloorSettings,
  STAGE_COLORS,
  STAGE_LIGHTING,
} from './showroomStageConfig';

const HEX = /^#[0-9a-f]{6}$/i;

describe('Showroom signature stage', () => {
  it('uses a valid carbon-stage palette', () => {
    for (const value of Object.values(STAGE_COLORS)) expect(value).toMatch(HEX);
    expect(STAGE_COLORS.background).toBe(STAGE_COLORS.fog);
    const background = new Color(STAGE_COLORS.background);
    const reflectionTint = new Color(STAGE_COLORS.mirrorTint);
    expect(reflectionTint.r).toBeGreaterThan(background.r);
    expect(reflectionTint.g).toBeGreaterThan(background.g);
    expect(reflectionTint.b).toBeGreaterThan(background.b);
  });

  it('rigs dramatic lighting with a strong key and a colored rim over a soft fill', () => {
    const dramatic = STAGE_LIGHTING.dramatic;
    expect(dramatic.key).toBeGreaterThan(dramatic.fill);
    expect(dramatic.rim).toBeGreaterThan(0);
    expect(dramatic.ambient).toBeLessThan(STAGE_LIGHTING.neutral.ambient);
    expect(dramatic.contactOpacity).toBeGreaterThan(STAGE_LIGHTING.neutral.contactOpacity);
  });

  it('keeps neutral lighting even and brighter for truthful paint inspection', () => {
    const neutral = STAGE_LIGHTING.neutral;
    expect(neutral.fill).toBeGreaterThan(STAGE_LIGHTING.dramatic.fill);
    expect(neutral.environment).toBeGreaterThan(STAGE_LIGHTING.dramatic.environment);
    expect(neutral.key).toBeGreaterThan(0);
  });

  it('keeps reflection and contact targets stable across quality changes', () => {
    expect(getStageFloorSettings('HIGH')).toEqual({ reflective: true, resolution: 512, contactShadowResolution: 256 });
    expect(getStageFloorSettings('BALANCED')).toEqual({ reflective: true, resolution: 256, contactShadowResolution: 256 });
    expect(getStageFloorSettings('PERFORMANCE')).toEqual({ reflective: false, resolution: 256, contactShadowResolution: 256 });
  });
});