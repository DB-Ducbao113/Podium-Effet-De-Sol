import { checkGlb, sha256, type Profile } from '../cadFirstScroll/cadSource';

export const REAR_UPRIGHT_PART = 'P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL';
export const REAR_UPRIGHT_SCHEMA = 'podium-eds.p2.cad-first.rear-upright-proposal.v1';

type RearProfile = {
  file: string;
  bytes: number;
  sha256: string;
  meshNodes: string[];
  tessellationWatertight: boolean;
};
export type RearUprightManifest = {
  schema: typeof REAR_UPRIGHT_SCHEMA;
  partId: typeof REAR_UPRIGHT_PART;
  axleAxis: 'Z';
  inboardDirection: '-Z';
  unitsCAD: 'mm';
  unitsGLB: 'm';
  masterSTEPsha256: string;
  roundtripSolids: 1;
  sourceP28WheelGeometryModified: false;
  independentActualRearWishbonesAvailable: false;
  actualRearChassisHardpointsMeasured: false;
  mechanicalMatingCertified: false;
  profiles: Record<Profile, RearProfile>;
};
export type RearUprightSource = {
  manifest: RearUprightManifest;
  profile: Profile;
  glbBytes: ArrayBuffer;
  fileName: string;
};

const VALID_PROFILES: Profile[] = ['HIGH', 'BALANCED', 'PERFORMANCE'];
const hexSha = /^[a-f0-9]{64}$/i;

/** Source-bound preview of independently authored rear carrier ONLY.
 * No independent rear wishbones, chassis hardpoints or mechanical approval.
 * File never leaves the browser or replaces the original Model B GLB.
 */
export function readRearUprightManifest(value: unknown): RearUprightManifest {
  if (!value || typeof value !== 'object') throw Error('Missing original P2.9 manifest');
  const record = value as Partial<RearUprightManifest>;
  if (record.schema !== REAR_UPRIGHT_SCHEMA ||
      record.partId !== REAR_UPRIGHT_PART ||
      record.axleAxis !== 'Z' || record.inboardDirection !== '-Z' ||
      record.unitsCAD !== 'mm' || record.unitsGLB !== 'm' ||
      !hexSha.test(record.masterSTEPsha256 ?? '') ||
      record.roundtripSolids !== 1 ||
      record.sourceP28WheelGeometryModified !== false ||
      record.independentActualRearWishbonesAvailable !== false ||
      record.actualRearChassisHardpointsMeasured !== false ||
      record.mechanicalMatingCertified !== false)
    throw Error('P2.9 source identity or unsigned mechanical constraints are invalid');
  if (!record.profiles || !VALID_PROFILES.every(key => {
    const item = record.profiles?.[key];
    return !!item && typeof item.file === 'string' && item.file.length > 0 &&
      Number.isSafeInteger(item.bytes) && item.bytes > 0 && item.bytes < 20 * 1024 * 1024 &&
      hexSha.test(item.sha256) && item.tessellationWatertight === true &&
      Array.isArray(item.meshNodes) && item.meshNodes.length === 1 &&
      item.meshNodes[0] === REAR_UPRIGHT_PART;
  })) throw Error('P2.9 profiles lack SHA-verified 1-node watertight source evidence');
  return record as RearUprightManifest;
}

export async function verifyRearUprightSource(
  manifestInput: unknown, file: File,
): Promise<RearUprightSource> {
  const manifest = readRearUprightManifest(manifestInput);
  const entry = VALID_PROFILES.find(key => manifest.profiles[key].file === file.name);
  if (!entry) throw Error('Unknown P2.9 rear upright GLB file');
  const profile = manifest.profiles[entry];
  if (file.size !== profile.bytes) throw Error('P2.9 GLB byte length mismatch');
  const bytes = await file.arrayBuffer();
  checkGlb(bytes);
  if (await sha256(bytes) !== profile.sha256.toLowerCase())
    throw Error('P2.9 source hash mismatch');
  return { manifest, profile: entry, glbBytes: bytes, fileName: file.name };
}
