import { checkGlb, sha256, type Profile } from '../cadFirstScroll/cadSource';
import { REAR_TOE_ALL_PARTS, REAR_TOE_NEW_PARTS } from './rearToeSource';

export const REAR_TOE_ADJUSTER_SCHEMA =
  'podium-eds.p2.cad-first.rear-toe-adjuster-static-proposal.v1';
export const REPLACED_FIXED_ROD = REAR_TOE_NEW_PARTS[0];
export const ADJUSTER_PARTS = [
  'P212_TOE_OUTER_RIGHT_HAND_THREADED_ROD_END',
  'P212_TOE_INNER_LEFT_HAND_THREADED_ROD_END',
  'P212_TOE_TURNBUCKLE_HOLLOW_SLEEVE',
  'P212_TOE_OUTER_HEX_LOCKNUT',
  'P212_TOE_INNER_HEX_LOCKNUT',
] as const;
export const REAR_TOE_ADJUSTER_ALL_PARTS = [
  ...REAR_TOE_ALL_PARTS.filter(name => name !== REPLACED_FIXED_ROD),
  ...ADJUSTER_PARTS,
];

type ProfileRow = {
  file: string;
  bytes: number;
  sha256: string;
  triangles: number;
  perPartTriangles: Record<string,number>;
  allNodesWatertight: true;
};
export type ToeAdjusterManifest = {
  schema: typeof REAR_TOE_ADJUSTER_SCHEMA;
  unitsCAD: 'mm';
  unitsGLB: 'm';
  partIds: string[];
  newPartIds: string[];
  sourcePartCount: 19;
  newParts: 5;
  replacedPriorPartId: typeof REPLACED_FIXED_ROD;
  totalCadSolids: 19;
  masterSTEPsha256: string;
  outerThreadHand: 'RIGHT';
  innerThreadHand: 'LEFT';
  externalHelicalCrestsModelled: true;
  pitchMm: number;
  radialSleeveClearanceMm: number;
  sourceP28Modified: false;
  modelBSourceModified: false;
  actualChassisToeHardpointMeasured: false;
  fullFemaleThreadProfileModelled: false;
  mechanicalThreadEngagementCertified: false;
  toeAdjustmentTravelCertified: false;
  locknutTorqueCertified: false;
  dynamicToeKinematicsCertified: false;
  mechanicalMateCertified: false;
  nativeStaticAudit: {
    pairCount: 171;
    aabbExcluded: number;
    nativeBrepIntersectionsEvaluated: number;
    unresolvedCollisions: unknown[];
    booleanErrors: unknown[];
    passStatic: true;
    dynamicKinematicsCertified: false;
    jointRetentionCertified: false;
  };
  profiles: Record<Profile,ProfileRow>;
};
export type ToeAdjusterSource = {
  manifest: ToeAdjusterManifest;
  profile: Profile;
  glbBytes: ArrayBuffer;
  fileName: string;
};

const tiers:Profile[] = ['HIGH','BALANCED','PERFORMANCE'];
const shaOK=(x:unknown):x is string=>
  typeof x==='string' && /^[a-f0-9]{64}$/i.test(x);
const exactNames=(input:unknown,expected:readonly string[]) =>
  Array.isArray(input) && input.length===expected.length &&
  new Set(input).size===expected.length &&
  input.every(id=>typeof id==='string' && expected.includes(id));

/** Verify original 19-body P2.12 static proposal, never imply certified
 * female-thread engagement or a physical structural chassis mate.
 */
export function readToeAdjusterManifest(input:unknown):ToeAdjusterManifest {
  if(!input || typeof input!=='object')
    throw Error('Missing original P2.12 source manifest');
  const m=input as Partial<ToeAdjusterManifest>;
  if(m.schema!==REAR_TOE_ADJUSTER_SCHEMA ||
    m.unitsCAD!=='mm' || m.unitsGLB!=='m' ||
    !shaOK(m.masterSTEPsha256) ||
    m.sourcePartCount!==19 || m.totalCadSolids!==19 || m.newParts!==5 ||
    m.replacedPriorPartId!==REPLACED_FIXED_ROD ||
    !exactNames(m.partIds,REAR_TOE_ADJUSTER_ALL_PARTS) ||
    !exactNames(m.newPartIds,ADJUSTER_PARTS) ||
    m.outerThreadHand!=='RIGHT' || m.innerThreadHand!=='LEFT' ||
    m.externalHelicalCrestsModelled!==true ||
    m.pitchMm!==2 || typeof m.radialSleeveClearanceMm!=='number' ||
    !Number.isFinite(m.radialSleeveClearanceMm) ||
    m.radialSleeveClearanceMm<=0 ||
    m.radialSleeveClearanceMm>.5 ||
    m.sourceP28Modified!==false || m.modelBSourceModified!==false ||
    m.actualChassisToeHardpointMeasured!==false ||
    m.fullFemaleThreadProfileModelled!==false ||
    m.mechanicalThreadEngagementCertified!==false ||
    m.toeAdjustmentTravelCertified!==false ||
    m.locknutTorqueCertified!==false ||
    m.dynamicToeKinematicsCertified!==false ||
    m.mechanicalMateCertified!==false)
    throw Error('P2.12 source identities or uncertified mechanical flags invalid');
  const a=m.nativeStaticAudit;
  if(!a || a.pairCount!==171 ||
     !Number.isSafeInteger(a.aabbExcluded) ||
     !Number.isSafeInteger(a.nativeBrepIntersectionsEvaluated) ||
     a.aabbExcluded<0 || a.nativeBrepIntersectionsEvaluated<0 ||
     a.aabbExcluded+a.nativeBrepIntersectionsEvaluated!==171 ||
     a.unresolvedCollisions?.length!==0 || a.booleanErrors?.length!==0 ||
     a.passStatic!==true || a.dynamicKinematicsCertified!==false ||
     a.jointRetentionCertified!==false)
    throw Error('Missing original P2.12 171-pair native B-Rep audit');
  if(!m.profiles || !tiers.every(tier=>{
    const p=m.profiles?.[tier];
    if(!p || !p.file || typeof p.file!=='string' ||
       !Number.isSafeInteger(p.bytes) || p.bytes<=0 || p.bytes>30*1024*1024 ||
       !shaOK(p.sha256) || p.allNodesWatertight!==true ||
       !Number.isSafeInteger(p.triangles) || p.triangles<=0 ||
       !p.perPartTriangles || typeof p.perPartTriangles!=='object' ||
       !exactNames(Object.keys(p.perPartTriangles),REAR_TOE_ADJUSTER_ALL_PARTS))
      return false;
    const counts=Object.values(p.perPartTriangles);
    return counts.every(n=>Number.isSafeInteger(n)&&n>0) &&
      counts.reduce((sum,n)=>sum+n,0)===p.triangles;
  })) throw Error('P2.12 source profiles require three original watertight 19-mesh LODs');
  return m as ToeAdjusterManifest;
}

export async function verifyToeAdjusterSource(
  input:unknown,file:File,
):Promise<ToeAdjusterSource> {
  const manifest=readToeAdjusterManifest(input);
  const tier=tiers.find(q=>manifest.profiles[q].file===file.name);
  if(!tier) throw Error('P2.12 GLB name missing from source manifest');
  const row=manifest.profiles[tier];
  if(file.size!==row.bytes) throw Error('P2.12 original GLB byte count mismatch');
  const bytes=await file.arrayBuffer();
  checkGlb(bytes);
  if(await sha256(bytes)!==row.sha256.toLowerCase())
    throw Error('P2.12 original GLB SHA-256 mismatch');
  return {manifest,profile:tier,glbBytes:bytes,fileName:file.name};
}
