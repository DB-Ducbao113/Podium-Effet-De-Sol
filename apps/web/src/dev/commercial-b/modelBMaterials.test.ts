import { describe, expect, it } from 'vitest';
import { getModelBMaterialTreatment } from './modelBMaterials';
import { MODEL_B_LIVERIES } from './modelBExperience';

describe('Model B livery material mapping', () => {
  it('maps the main paint and accent regions to the selected livery', () => {
    const livery = MODEL_B_LIVERIES[1];
    expect(getModelBMaterialTreatment('PEDS_Graphite_Auto_Paint', livery)?.color).toBe(
      livery.primary,
    );
    expect(getModelBMaterialTreatment('PEDS_Crimson_Accent', livery)?.color).toBe(livery.accent);
  });

  it('keeps carbon dark and tires non-metallic across bright liveries', () => {
    const livery = MODEL_B_LIVERIES[8];
    const carbon = getModelBMaterialTreatment('PEDS_Carbon_Composite', livery);
    const tire = getModelBMaterialTreatment('PEDS_Tire_Rubber', livery);
    expect(carbon?.color).not.toBe(livery.primary);
    expect(carbon?.color).toBe(livery.carbon);
    expect(carbon?.roughness).toBeGreaterThan(0.5);
    expect(tire?.metalness).toBeLessThan(0.1);
    expect(tire?.roughness).toBeGreaterThan(0.85);
    expect(getModelBMaterialTreatment('Unmapped_Region', livery)).toBeNull();
  });
});
