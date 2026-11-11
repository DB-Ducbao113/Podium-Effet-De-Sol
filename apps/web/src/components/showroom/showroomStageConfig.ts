import type { QualityProfile } from './model-b/adaptiveController';

export type StageLighting = 'dramatic' | 'neutral';

// Carbon stage with a signal orange-red rim and a cool fill: the palette belongs
// to the pit-lane night, not a generic gray product viewer.
export const STAGE_COLORS = {
  background: '#0b0e13',
  fog: '#0b0e13',
  floor: '#0a0d12',
  mirrorTint: '#59616a',
  key: '#fff1de',
  rim: '#ff5a2a',
  fill: '#9fc0ff',
  ambientSky: '#cdd8ea',
  ambientGround: '#0c0f14',
} as const;

export interface StageLightingRig {
  ambient: number;
  key: number;
  rim: number;
  fill: number;
  environment: number;
  contactOpacity: number;
}

export const STAGE_LIGHTING: Record<StageLighting, StageLightingRig> = {
  dramatic: { ambient: 0.32, key: 4.5, rim: 2.4, fill: 0.85, environment: 0.5, contactOpacity: 0.55 },
  neutral: { ambient: 1.0, key: 2.8, rim: 1.1, fill: 1.7, environment: 0.95, contactOpacity: 0.4 },
};

export interface StageFloorSettings {
  reflective: boolean;
  resolution: number;
  contactShadowResolution: number;
}

// Keep offscreen targets alive across quality changes: rebuilding them retains GPU resources.
export function getStageFloorSettings(profile: QualityProfile): StageFloorSettings {
  return {
    reflective: profile !== 'PERFORMANCE',
    resolution: profile === 'HIGH' ? 512 : 256,
    contactShadowResolution: 256,
  };
}