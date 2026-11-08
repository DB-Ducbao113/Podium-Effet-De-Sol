import { describe, expect, it } from 'vitest';
import {
  readRearSuspensionManifest, REAR_SUSPENSION_PARTS, REAR_SUSPENSION_SCHEMA,
} from './rearSuspensionSource';

function originalFixture() {
  const perPartTriangles = Object.fromEntries(REAR_SUSPENSION_PARTS.map(p => [p, 100]));
  const profile = {
    file: 'P210_rear_suspension_balanced.glb', bytes: 100000,
    sha256: 'a'.repeat(64), triangles: 1100,
    perPartTriangles, allNodesWatertight: true,
  };
  return {
    schema: REAR_SUSPENSION_SCHEMA,
    parentP29SourcePartId: REAR_SUSPENSION_PARTS[0],
    sourceP28Modified: false,
    modelBSourceModified: false,
    unitsCAD: 'mm', unitsGLB: 'm',
    masterSTEPsha256: 'b'.repeat(64),
    totalCadSolids: 11, originalP29PlusNewP210PartIds: [...REAR_SUSPENSION_PARTS],
    newP210PartIds: REAR_SUSPENSION_PARTS.slice(1), newSolids: 10,
    chassisHardpointsMeasured: false,
    mechanicalMateCertified: false,
    dynamicSuspensionCertified: false,
    nativeStaticAudit: {
      pairCount: 55, aabbExcluded: 43, nativeBrepIntersectionsEvaluated: 12,
      unresolvedCollisions: [], booleanErrors: [], passStatic: true,
      dynamicKinematicsCertified: false, jointRetentionCertified: false,
    },
    profiles: {
      HIGH: { ...profile, file: 'P210_rear_suspension_high.glb' },
      BALANCED: profile,
      PERFORMANCE: { ...profile, file: 'P210_rear_suspension_performance.glb' },
    },
  };
}
describe('P2.10 independent rear double wishbone source guard', () => {
  it('accepts the complete original 11-solid source with mechanical G2 HOLD', () => {
    const source=readRearSuspensionManifest(originalFixture());
    expect(source.totalCadSolids).toBe(11);
    expect(source.newSolids).toBe(10);
    expect(source.mechanicalMateCertified).toBe(false);
    expect(source.dynamicSuspensionCertified).toBe(false);
  });
  it('rejects claims that measured chassis or actual kinematics exist', () => {
    expect(() => readRearSuspensionManifest({ ...originalFixture(), chassisHardpointsMeasured: true }))
      .toThrow(/identity/);
    expect(() => readRearSuspensionManifest({ ...originalFixture(), mechanicalMateCertified: true }))
      .toThrow(/identity/);
  });
  it('rejects an absent part, front arm substitution or duplicate node', () => {
    const source=originalFixture();
    expect(() => readRearSuspensionManifest({
      ...source, newP210PartIds: source.newP210PartIds.slice(1),
    })).toThrow(/identity/);
    expect(() => readRearSuspensionManifest({
      ...source, originalP29PlusNewP210PartIds:
        [...source.originalP29PlusNewP210PartIds.slice(0,-1),source.originalP29PlusNewP210PartIds[0]],
    })).toThrow(/identity/);
  });
  it('requires complete static pair coverage, no overlaps and valid mesh evidence', () => {
    const source=originalFixture();
    expect(() => readRearSuspensionManifest({
      ...source, nativeStaticAudit: {...source.nativeStaticAudit, aabbExcluded: 44 },
    })).toThrow(/55-pair/);
    expect(() => readRearSuspensionManifest({
      ...source, nativeStaticAudit: {...source.nativeStaticAudit, unresolvedCollisions:[{a:'x',b:'y'}] },
    })).toThrow(/55-pair/);
    expect(() => readRearSuspensionManifest({
      ...source, profiles: { ...source.profiles, BALANCED:
        {...source.profiles.BALANCED, allNodesWatertight:false} },
    })).toThrow(/profile/);
  });
});
