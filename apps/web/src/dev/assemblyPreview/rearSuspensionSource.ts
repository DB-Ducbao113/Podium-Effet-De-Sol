import { checkGlb, sha256, type Profile } from '../cadFirstScroll/cadSource';
import { REAR_UPRIGHT_PART } from './rearUprightSource';

export const REAR_SUSPENSION_SCHEMA =
  'podium-eds.p2.cad-first.rear-double-wishbone-proposal.v1';
export const REAR_SUSPENSION_PARTS = [
  REAR_UPRIGHT_PART,
  'P210_REAR_UPPER_A_ARM_FORGED',
  'P210_REAR_UPPER_CHASSIS_PIVOT_BUSHING_A',
  'P210_REAR_UPPER_CHASSIS_PIVOT_BUSHING_B',
  'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
  'P210_REAR_UPPER_OUTER_JOINT_PIN',
  'P210_REAR_LOWER_A_ARM_FORGED',
  'P210_REAR_LOWER_CHASSIS_PIVOT_BUSHING_A',
  'P210_REAR_LOWER_CHASSIS_PIVOT_BUSHING_B',
  'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
  'P210_REAR_LOWER_OUTER_JOINT_PIN',
] as const;

type ProfileRow = {
  file: string;
  bytes: number;
  sha256: string;
  triangles: number;
  perPartTriangles: Record<string, number>;
  allNodesWatertight: boolean;
};
export type RearSuspensionManifest = {
  schema: typeof REAR_SUSPENSION_SCHEMA;
  parentP29SourcePartId: typeof REAR_UPRIGHT_PART;
  sourceP28Modified: false;
  modelBSourceModified: false;
  unitsCAD: 'mm';
  unitsGLB: 'm';
  masterSTEPsha256: string;
  totalCadSolids: 11;
  originalP29PlusNewP210PartIds: string[];
  newP210PartIds: string[];
  newSolids: 10;
  chassisHardpointsMeasured: false;
  mechanicalMateCertified: false;
  dynamicSuspensionCertified: false;
  nativeStaticAudit: {
    pairCount: 55;
    aabbExcluded: number;
    nativeBrepIntersectionsEvaluated: number;
    unresolvedCollisions: unknown[];
    booleanErrors: unknown[];
    passStatic: true;
    dynamicKinematicsCertified: false;
    jointRetentionCertified: false;
  };
  profiles: Record<Profile, ProfileRow>;
};
export type RearSuspensionSource = {
  manifest: RearSuspensionManifest;
  profile: Profile;
  glbBytes: ArrayBuffer;
  fileName: string;
};

const PROFILES: Profile[] = ['HIGH', 'BALANCED', 'PERFORMANCE'];
const isSHA = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const EXPECTED = new Set<string>(REAR_SUSPENSION_PARTS);
const sameParts = (names: unknown): names is string[] =>
  Array.isArray(names) && names.length === EXPECTED.size &&
  new Set(names).size === EXPECTED.size &&
  names.every(name => typeof name === 'string' && EXPECTED.has(name));

/** Honest source validation: exactly 11 CAD nodes, same names and sha-linked
 * original STEP proposal. Only a static CAD preview; no validated chassis mate.
 */
export function readRearSuspensionManifest(value: unknown): RearSuspensionManifest {
  if (!value || typeof value !== 'object')
    throw Error('Missing project-authored P2.10 rear suspension manifest');
  const record = value as Partial<RearSuspensionManifest>;
  if (record.schema !== REAR_SUSPENSION_SCHEMA ||
    record.parentP29SourcePartId !== REAR_UPRIGHT_PART ||
    record.sourceP28Modified !== false ||
    record.modelBSourceModified !== false ||
    record.unitsCAD !== 'mm' || record.unitsGLB !== 'm' ||
    record.totalCadSolids !== 11 || record.newSolids !== 10 ||
    !isSHA(record.masterSTEPsha256) ||
    !sameParts(record.originalP29PlusNewP210PartIds) ||
    !sameParts([REAR_UPRIGHT_PART, ...(record.newP210PartIds ?? [])]) ||
    record.chassisHardpointsMeasured !== false ||
    record.mechanicalMateCertified !== false ||
    record.dynamicSuspensionCertified !== false)
    throw Error('P2.10 11-solid source identity or mechanical HOLD flags invalid');
  const audit = record.nativeStaticAudit;
  if (!audit || audit.pairCount !== 55 ||
      audit.aabbExcluded + audit.nativeBrepIntersectionsEvaluated !== 55 ||
      audit.unresolvedCollisions?.length !== 0 || audit.booleanErrors?.length !== 0 ||
      audit.passStatic !== true ||
      audit.dynamicKinematicsCertified !== false ||
      audit.jointRetentionCertified !== false)
    throw Error('Missing P2.10 native complete 55-pair static source audit');
  if (!record.profiles || !PROFILES.every(tier => {
    const row = record.profiles?.[tier];
    return !!row && typeof row.file === 'string' && row.file.length > 0 &&
      Number.isSafeInteger(row.bytes) && row.bytes > 0 && row.bytes < 25*1024*1024 &&
      isSHA(row.sha256) && row.allNodesWatertight === true &&
      Number.isSafeInteger(row.triangles) && row.triangles > 0 &&
      row.perPartTriangles && typeof row.perPartTriangles === 'object' &&
      sameParts(Object.keys(row.perPartTriangles)) &&
      Object.values(row.perPartTriangles).every(n => Number.isSafeInteger(n) && n > 0) &&
      Object.values(row.perPartTriangles).reduce((sum,n) => sum+n,0) === row.triangles;
  })) throw Error('P2.10 missing or corrupted watertight 11-node GLB profile record');
  return record as RearSuspensionManifest;
}

export async function verifyRearSuspensionSource(
  manifestInput: unknown, file: File,
): Promise<RearSuspensionSource> {
  const manifest = readRearSuspensionManifest(manifestInput);
  const tier = PROFILES.find(q => manifest.profiles[q].file === file.name);
  if (!tier) throw Error('P2.10 GLB filename absent from original manifest');
  const profile = manifest.profiles[tier];
  if (file.size !== profile.bytes) throw Error('P2.10 GLB byte-length mismatch');
  const bytes = await file.arrayBuffer();
  checkGlb(bytes);
  if (await sha256(bytes) !== profile.sha256.toLowerCase())
    throw Error('P2.10 GLB SHA-256 mismatch');
  return { manifest, profile:tier, glbBytes:bytes, fileName:file.name };
}
