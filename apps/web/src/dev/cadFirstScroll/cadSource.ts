/**
 * CAD-first preview contract. It accepts the actual P2.8 front-corner manifest
 * or a future whole-car CAD manifest with explicit semantic part coverage.
 * It must NOT infer a whole car from a 59-body front-corner assembly.
 */
export type Profile = 'HIGH' | 'BALANCED' | 'PERFORMANCE';
export type CadPart = { id: string; node: string; system: string; label: string };
export type CadManifest = {
  schema: string;
  profiles: Record<string, { file: string; bytes: number; sha256: string }>;
  partIds?: string[];
  parts?: CadPart[];
  staticAuditFile?: string;
  staticAuditSha256?: string;
  masterSTEPsha256?: string;
  totalCadSolids?: number;
  allRoundtripValid?: boolean;
};
export type CadSource = {
  scope: 'front-corner' | 'full-car';
  parts: CadPart[];
  profile: Profile;
  glbBytes: ArrayBuffer;
  manifest: CadManifest;
  fileName: string;
  auditVerified: boolean;
};
export const FULL_CAR_SYSTEMS = [
  'FRONT_WING','FRONT_AXLE','BRAKES','FRONT_SUSPENSION','COCKPIT',
  'CHASSIS','SIDEPODS','COOLING','POWERTRAIN','FLOOR',
  'REAR_SUSPENSION','REAR_AXLE','REAR_WING'
] as const;
const maximumBytes = 150 * 1024 * 1024;
const frontCornerSystem = (id: string): string => {
  const text = id.toUpperCase();
  if (/TYRE|RIM|WHEEL/.test(text)) return 'WHEEL';
  if (/BRAKE|CALIPER|PAD|ROTOR|DISC/.test(text)) return 'BRAKES';
  if (/WISHBONE|SUSPENSION|PUSHROD|ROCKER|TIE_ROD|ARM/.test(text)) return 'SUSPENSION';
  if (/HUB|BEARING|UPRIGHT|BALL_JOINT|CLEVIS/.test(text)) return 'UPRIGHT + HUB';
  return 'FASTENERS + STRUCTURE';
};
const checkPart = (value: unknown): value is CadPart => {
  if (!value || typeof value !== 'object') return false;
  const part = value as Partial<CadPart>;
  return ['id','node','system','label'].every(key => typeof part[key as keyof CadPart] === 'string' && Boolean(part[key as keyof CadPart]));
};
export function readManifest(value: unknown): { manifest: CadManifest; scope: 'front-corner' | 'full-car'; parts: CadPart[] } {
  if (!value || typeof value !== 'object') throw Error('Invalid CAD manifest');
  const data = value as Partial<CadManifest>;
  if (!data.profiles || typeof data.profiles !== 'object') throw Error('No CAD profile evidence');
  if (data.schema === 'podium-eds.p2.cad-first.full-corner.remate.v1') {
    if (!Array.isArray(data.partIds) || data.partIds.length !== 59 || new Set(data.partIds).size !== 59)
      throw Error('P2.8 requires 59 distinct original source part IDs');
    const corner = data as CadManifest & {
      source?: string; staticFit?: { totalPairs?: number; singleStaticPosePass?: boolean;
        steeringTravelAndBumpValidated?: boolean };
    };
    if (!/^[a-f0-9]{64}$/i.test(corner.masterSTEPsha256 ?? '') ||
        corner.totalCadSolids !== 59 || corner.allRoundtripValid !== true ||
        corner.staticFit?.totalPairs !== 1711 || corner.staticFit?.singleStaticPosePass !== true ||
        corner.source !== 'Project-authored P2.6/P2.7 original B-Rep') {
      throw Error('P2.8 requires original STEP lineage and 59-solid native static audit provenance');
    }
    return { manifest: data as CadManifest, scope: 'front-corner',
      parts: data.partIds.map(id => ({ id, node: id, system: frontCornerSystem(id), label: id.replaceAll('_',' ') })) };
  }
  if (data.schema === 'podium-eds.cad-first.full-car.v1') {
    if (!Array.isArray(data.parts) || !data.parts.length || !data.parts.every(checkPart))
      throw Error('Whole-car CAD requires an explicit semantic parts list');
    // A list of 13 named meshes is not proof of a vehicle. Require CAD B-Rep
    // roundtrip evidence and the referenced source STEP digest as well.
    if (!/^[a-f0-9]{64}$/i.test(data.masterSTEPsha256 ?? '') ||
        data.totalCadSolids !== data.parts.length || data.allRoundtripValid !== true ||
        !data.staticAuditFile || !/^[a-f0-9]{64}$/i.test(data.staticAuditSha256 ?? ''))
      throw Error('Whole-car source requires STEP and native static-audit provenance');
    const names = new Set(data.parts.map(part => part.node));
    if (names.size !== data.parts.length) throw Error('Duplicate CAD node mapping');
    const covered = new Set(data.parts.map(part => part.system));
    const missing = FULL_CAR_SYSTEMS.filter(system => !covered.has(system));
    if (missing.length) throw Error('Whole-car CAD incomplete: ' + missing.join(', '));
    return { manifest: data as CadManifest, scope: 'full-car', parts: data.parts };
  }
  throw Error('Unknown CAD-first source. R4.5 and Model B are not accepted');
}
export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256',buffer);
  return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2,'0')).join('');
}
export function checkGlb(buffer: ArrayBuffer) {
  if (buffer.byteLength < 24) throw Error('Truncated GLB');
  const view = new DataView(buffer);
  if (view.getUint32(0,true) !== 0x46546c67 || view.getUint32(4,true) !== 2 ||
      view.getUint32(8,true) !== buffer.byteLength || view.getUint32(16,true) !== 0x4e4f534a)
    throw Error('Invalid glTF 2.0 binary');
  const length = view.getUint32(12,true);
  if (length + 20 > buffer.byteLength) throw Error('Corrupt GLB JSON');
  const json = JSON.parse(new TextDecoder().decode(buffer.slice(20,20+length))) as {
    buffers?: {uri?:string}[]; images?:{uri?:string}[];
  };
  if ([...(json.buffers ?? []),...(json.images ?? [])].some(item => item.uri && !item.uri.startsWith('data:')))
    throw Error('External GLB dependencies are prohibited');
}
export async function verifyCadSource(
  manifestInput: unknown, glb: File, audit?: File,
): Promise<CadSource> {
  if (glb.size > maximumBytes) throw Error('GLB exceeds 150 MB review limit');
  const {manifest,scope,parts} = readManifest(manifestInput);
  const profileEntry = Object.entries(manifest.profiles).find(([,p]) => p.file === glb.name);
  if (!profileEntry) throw Error('GLB is not named in source manifest');
  const [key, evidence] = profileEntry;
  if (key !== 'HIGH' && key !== 'BALANCED' && key !== 'PERFORMANCE') throw Error('Unknown quality profile');
  const bytes = await glb.arrayBuffer();
  checkGlb(bytes);
  if (bytes.byteLength !== evidence.bytes || await sha256(bytes) !== evidence.sha256.toLowerCase())
    throw Error('GLB source hash or byte length mismatch');
  let auditVerified = false;
  if (audit) {
    if (audit.size > 1024*1024 || audit.name !== manifest.staticAuditFile ||
        !manifest.staticAuditSha256 ||
        await sha256(await audit.arrayBuffer()) !== manifest.staticAuditSha256.toLowerCase())
      throw Error('Static B-Rep audit SHA-256 mismatch');
    auditVerified = true;
  }
  return {scope,parts,profile:key,glbBytes:bytes,manifest,fileName:glb.name,auditVerified};
}
