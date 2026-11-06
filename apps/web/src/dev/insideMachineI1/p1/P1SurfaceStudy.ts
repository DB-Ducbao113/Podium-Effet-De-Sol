import { pilotRecipeFor } from './pilotMaterials';

/**
 * Source names verified from the owner-supplied R4.5 BALANCED GLB.
 * These identify material slots, not authenticated factory specifications.
 */
export const FRONT_LEFT_MATERIAL_SLOTS: Record<string, readonly string[]> = {
  'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT': ['PEDS_NEW_TITANIUM'],
  'FRONT_LEFT_WHEEL.WHEEL_OUTER': [
    'PEDS_Tire_Rubber',
    'PEDS_NEW_GRAPHITE',
    'PEDS_NEW_TITANIUM',
  ],
  'FRONT_LEFT_WHEEL.WHEEL_HUB': ['PEDS_NEW_GRAPHITE'],
  'FRONT_LEFT_WHEEL.BRAKE_DISC': [
    'PEDS_NEW_BRAKE_CARBON',
    'PEDS_NEW_TITANIUM',
  ],
  'FRONT_LEFT_WHEEL.BRAKE_CALIPER': ['PEDS_NEW_CRIMSON'],
  'FRONT_LEFT_WHEEL.SUSPENSION_LINKS': ['PEDS_NEW_TITANIUM'],
  'FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE': ['PEDS_R43_BRUSHED_TITANIUM'],
};

export function materialStudyFor(partId: string) {
  return (FRONT_LEFT_MATERIAL_SLOTS[partId] ?? []).map((name) => ({
    sourceName: name,
    look: pilotRecipeFor(name, partId),
  }));
}
