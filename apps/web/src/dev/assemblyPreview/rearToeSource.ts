import { checkGlb, sha256, type Profile } from '../cadFirstScroll/cadSource';
import { REAR_SUSPENSION_PARTS } from './rearSuspensionSource';

export const REAR_TOE_SCHEMA =
  'podium-eds.p2.cad-first.rear-toe-link-static-proposal.v1';
export const REAR_TOE_NEW_PARTS = [
  'P211_REAR_TOE_LINK_TUBULAR_FORGED',
  'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
  'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
  'P211_REAR_TOE_OUTER_CLEVIS_PIN',
] as const;
export const REAR_TOE_ALL_PARTS = [...REAR_SUSPENSION_PARTS, ...REAR_TOE_NEW_PARTS] as const;

type ProfileEntry = {
  file: string;
  bytes: number;
  sha256: string;
  triangles: number;
  perPartTriangles: Record<string,number>;
  allNodesWatertight: true;
};
export type RearToeManifest = {
  schema: typeof REAR_TOE_SCHEMA;
  unitsCAD: 'mm';
  unitsGLB: 'm';
  masterSTEPsha256: string;
  totalCadSolids: 15;
  newSolids: 4;
  newP211Parts: string[];
  sourceP29P210P211PartIds: string[];
  actualChassisToeHardpointMeasured: false;
  rootP28SourceModified: false;
  modelBSourceModified: false;
  mechanicalMateCertified: false;
  dynamicToeKinematicsCertified: false;
  toeAdjustabilityCertified: false;
  jointRetentionCertified: false;
  nativeStaticAudit: {
    pairCount: 105;
    aabbExcluded: number;
    nativeBrepIntersectionsEvaluated: number;
    unresolvedCollisions: unknown[];
    booleanErrors: unknown[];
    passStatic: true;
    dynamicKinematicsCertified: false;
    jointRetentionCertified: false;
  };
  profiles: Record<Profile,ProfileEntry>;
};
export type RearToeSource = {
  manifest: RearToeManifest;
  profile: Profile;
  glbBytes: ArrayBuffer;
  fileName: string;
};
const TIERS: Profile[]=['HIGH','BALANCED','PERFORMANCE'];
const isSha=(value:unknown):value is string=>
  typeof value==='string' && /^[a-f0-9]{64}$/i.test(value);
const exactIds=(input:unknown,expected:readonly string[]):boolean=>
  Array.isArray(input) && input.length===expected.length &&
  new Set(input).size===expected.length &&
  input.every(value=>typeof value==='string' && expected.includes(value));

/** Source-linked static 15-body rear assembly, never rear dynamics certification.
 * Does not implicitly approve Model B structural chassis hardpoints.
 */
export function readRearToeManifest(input:unknown):RearToeManifest {
  if(!input || typeof input!=='object')throw Error('Missing original P2.11 source manifest');
  const m=input as Partial<RearToeManifest>;
  if(m.schema!==REAR_TOE_SCHEMA ||
    m.unitsCAD!=='mm'||m.unitsGLB!=='m' ||
    !isSha(m.masterSTEPsha256) ||
    m.totalCadSolids!==15 || m.newSolids!==4 ||
    !exactIds(m.newP211Parts,REAR_TOE_NEW_PARTS) ||
    !exactIds(m.sourceP29P210P211PartIds,REAR_TOE_ALL_PARTS) ||
    m.actualChassisToeHardpointMeasured!==false ||
    m.rootP28SourceModified!==false ||
    m.modelBSourceModified!==false ||
    m.mechanicalMateCertified!==false ||
    m.dynamicToeKinematicsCertified!==false ||
    m.toeAdjustabilityCertified!==false ||
    m.jointRetentionCertified!==false)
    throw Error('P2.11 source identities, native STEP evidence or mechanical HOLD flags invalid');
  const audit=m.nativeStaticAudit;
  if(!audit || audit.pairCount!==105 ||
    !Number.isSafeInteger(audit.aabbExcluded) ||
    !Number.isSafeInteger(audit.nativeBrepIntersectionsEvaluated) ||
    audit.aabbExcluded<0||audit.nativeBrepIntersectionsEvaluated<0 ||
    audit.aabbExcluded+audit.nativeBrepIntersectionsEvaluated!==105 ||
    audit.unresolvedCollisions?.length!==0 ||
    audit.booleanErrors?.length!==0 ||
    audit.passStatic!==true ||
    audit.dynamicKinematicsCertified!==false ||
    audit.jointRetentionCertified!==false)
    throw Error('P2.11 requires complete 105-pair static B-Rep source audit');
  if(!m.profiles || !TIERS.every(tier=>{
    const row=m.profiles?.[tier];
    if(!row || typeof row.file!=='string'||!row.file ||
      !Number.isSafeInteger(row.bytes)||row.bytes<=0||row.bytes>30*1024*1024 ||
      !isSha(row.sha256)||row.allNodesWatertight!==true ||
      !Number.isSafeInteger(row.triangles)||row.triangles<=0 ||
      !row.perPartTriangles || typeof row.perPartTriangles!=='object' ||
      !exactIds(Object.keys(row.perPartTriangles),REAR_TOE_ALL_PARTS))return false;
    const counts=Object.values(row.perPartTriangles);
    return counts.every(n=>Number.isSafeInteger(n)&&n>0) &&
      counts.reduce((sum,n)=>sum+n,0)===row.triangles;
  }))throw Error('P2.11 requires 3 SHA-locked watertight 15-node LOD profiles');
  return m as RearToeManifest;
}

export async function verifyRearToeSource(
  manifestInput:unknown,file:File,
):Promise<RearToeSource> {
  const manifest=readRearToeManifest(manifestInput);
  const profile=TIERS.find(key=>manifest.profiles[key].file===file.name);
  if(!profile)throw Error('P2.11 GLB file is absent from original CAD manifest');
  const entry=manifest.profiles[profile];
  if(file.size!==entry.bytes)throw Error('P2.11 GLB byte count mismatch');
  const bytes=await file.arrayBuffer();
  checkGlb(bytes);
  if(await sha256(bytes)!==entry.sha256.toLowerCase())
    throw Error('P2.11 source GLB SHA-256 mismatch');
  return {manifest,profile,glbBytes:bytes,fileName:file.name};
}
