import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyModelBLivery } from './modelBMaterials';
import { MODEL_B_HOTSPOTS, MODEL_B_LIVERIES } from './modelBExperience';

describe('Model B Showroom configuration', () => {
  it('provides twelve original finishes and seven distinct anatomy topics', () => {
    expect(MODEL_B_LIVERIES).toHaveLength(12);
    expect(MODEL_B_LIVERIES[0].id).toBe('graphite');
    expect(new Set(MODEL_B_LIVERIES.map((item) => item.id)).size).toBe(12);
    expect(MODEL_B_LIVERIES.every((item) => item.name && item.nameVi && item.primary && item.secondary && item.accent && item.carbon)).toBe(true);
    expect(new Set(MODEL_B_HOTSPOTS.map((item) => item.id)).size).toBe(7);
    expect(MODEL_B_HOTSPOTS.every((item) => item.nameVi && item.nameEn && item.summaryVi && item.summaryEn)).toBe(true);
  });

  it('reuses material instances while leaving unnamed regions unchanged', () => {
    const paint = new THREE.MeshPhysicalMaterial({ color: '#ffffff' });
    paint.name = 'PEDS_Graphite_Auto_Paint';
    const untouched = new THREE.MeshStandardMaterial({ color: '#123456' });
    untouched.name = 'Unmapped_Region';
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), [paint, untouched]);
    const originalMaterials = mesh.material;
    applyModelBLivery(mesh, MODEL_B_LIVERIES[1]);
    expect(paint.color.getHexString()).toBe('bd202d');
    expect(untouched.color.getHexString()).toBe('123456');
    applyModelBLivery(mesh, MODEL_B_LIVERIES[0]);
    expect(paint.color.getHexString()).toBe('343a43');
    expect(mesh.material).toBe(originalMaterials);
    mesh.geometry.dispose();
    paint.dispose();
    untouched.dispose();
  });
});
