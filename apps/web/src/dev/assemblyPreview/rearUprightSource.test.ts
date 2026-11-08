import { describe, expect, it } from 'vitest';
import { readRearUprightManifest, REAR_UPRIGHT_PART, REAR_UPRIGHT_SCHEMA } from './rearUprightSource';

function manifest() {
  const profile = {
    file: 'P29_rear_upright_balanced.glb',
    bytes: 35880,
    sha256: 'a'.repeat(64),
    meshNodes: [REAR_UPRIGHT_PART],
    tessellationWatertight: true,
  };
  return {
    schema: REAR_UPRIGHT_SCHEMA,
    partId: REAR_UPRIGHT_PART,
    axleAxis: 'Z',
    inboardDirection: '-Z',
    unitsCAD: 'mm',
    unitsGLB: 'm',
    masterSTEPsha256: 'b'.repeat(64),
    roundtripSolids: 1,
    sourceP28WheelGeometryModified: false,
    independentActualRearWishbonesAvailable: false,
    actualRearChassisHardpointsMeasured: false,
    mechanicalMatingCertified: false,
    profiles: {
      HIGH: { ...profile, file: 'P29_rear_upright_high.glb' },
      BALANCED: profile,
      PERFORMANCE: { ...profile, file: 'P29_rear_upright_performance.glb' },
    },
  };
}
describe('source-only P2.9 rear upright preview contract', () => {
  it('accepts exactly one watertight authored carrier without certifying suspension', () => {
    const parsed = readRearUprightManifest(manifest());
    expect(parsed.partId).toBe(REAR_UPRIGHT_PART);
    expect(parsed.actualRearChassisHardpointsMeasured).toBe(false);
    expect(parsed.mechanicalMatingCertified).toBe(false);
  });
  it('rejects false claims of certified rear suspension', () => {
    expect(() => readRearUprightManifest({
      ...manifest(), independentActualRearWishbonesAvailable: true,
    })).toThrow(/identity/);
    expect(() => readRearUprightManifest({
      ...manifest(), mechanicalMatingCertified: true,
    })).toThrow(/identity/);
  });
  it('rejects front-upright copy and nonwatertight GLB', () => {
    expect(() => readRearUprightManifest({
      ...manifest(), partId: 'P2_UPRIGHT_BEARING_CARRIER',
    })).toThrow(/identity/);
    const altered = manifest();
    altered.profiles.BALANCED.tessellationWatertight = false;
    expect(() => readRearUprightManifest(altered)).toThrow(/profiles/);
  });
  it('fails closed on incomplete LOD and corrupt SHA provenance', () => {
    const missing = manifest() as { profiles: Record<string, unknown> };
    delete missing.profiles.HIGH;
    expect(() => readRearUprightManifest(missing)).toThrow(/profiles/);
    expect(() => readRearUprightManifest({
      ...manifest(), masterSTEPsha256: 'invalid',
    })).toThrow(/identity/);
  });
});
