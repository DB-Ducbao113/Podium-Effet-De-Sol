import type { OwnerMeasuredFit } from './ownerMeasuredFit';
import { classifyP28Part } from './cadPresentation';

export type WheelId =
  'front-positive-z' | 'front-negative-z' | 'rear-positive-z' | 'rear-negative-z';
export type CornerSourceStatus = 'ORIGINAL_FRONT_P28' | 'ROTATED_FRONT_P28_VISUAL' |
  'FRONT_WHEEL_END_PROXY_FOR_REAR';
export type FourCornerMount = {
  id: WheelId;
  station: 'front' | 'rear';
  side: -1 | 1;
  centerM: [number,number,number];
  rotationYRad: number;
  translationM: [number,number,number];
  p28Scale: 1;
  measuredRadiusM: number;
  sourceStatus: CornerSourceStatus;
  mechanicalMateCertified: false;
};

/**
 * Only rigid rotations and translations of one real, SHA-verified P2.8 front
 * CAD corner. Never mirror a threaded fastener: negative-determinant reflection
 * reverses handedness. For the opposite side rotate 180 degrees around Y,
 * preserving screw chirality. The resulting wishbone/hardpoint fit is NOT
 * mechanically approved. For rear wheels expose only a wheel-end proxy;
 * P2.8 FRONT suspension cannot substitute for a genuine rear suspension.
 *
 * Input centres are the four independently measured ORIGINAL Model B wheel
 * envelopes; do not assume left/right symmetry.
 */
export function layoutFourCorners(fit: OwnerMeasuredFit): FourCornerMount[] {
  if (fit.calibration !== 'podium-eds.owner-modelb-p28.visual-wheel-envelope.v1' ||
      fit.p28Scale !== 1 || fit.wheels.length !== 4)
    throw Error('Source-verified four-wheel measurement required');
  const src=fit.originalP28WheelCenterM;
  if (!src || src.length !== 3 || !src.every(Number.isFinite))
    throw Error('Original P2.8 wheel origin unavailable');
  const result:FourCornerMount[]=[];
  const ids=new Set<WheelId>();
  for(const wheel of fit.wheels) {
    const id=(wheel.station+'-'+(wheel.side===1?'positive':'negative')+'-z') as WheelId;
    if(ids.has(id))throw Error('Duplicate measured wheel center '+id);
    ids.add(id);
    const sign=wheel.side;
    const yaw=sign===1?0:Math.PI;
    // R_y(pi) = diag(-1,1,-1). Proper rotation preserves thread chirality.
    const sourceRotated: [number,number,number]=sign===1
      ? [...src] as [number,number,number]
      : [-src[0],src[1],-src[2]];
    const translated=wheel.centerM.map((value,i)=>value-sourceRotated[i])
      as [number,number,number];
    if(!translated.every(Number.isFinite) ||
       !Number.isFinite(wheel.outerRadiusM) ||
       Math.abs(wheel.outerRadiusM-.332)>.016)
      throw Error('Unverified owner source wheel envelope: '+id);
    result.push({
      id,station:wheel.station,side:wheel.side,
      centerM:[...wheel.centerM],rotationYRad:yaw,
      translationM:translated,p28Scale:1,
      measuredRadiusM:wheel.outerRadiusM,
      sourceStatus:wheel.station==='rear'?'FRONT_WHEEL_END_PROXY_FOR_REAR':
        sign===1?'ORIGINAL_FRONT_P28':'ROTATED_FRONT_P28_VISUAL',
      mechanicalMateCertified:false,
    });
  }
  if(ids.size!==4 || result.filter(x=>x.station==='front').length!==2 ||
     result.filter(x=>x.station==='rear').length!==2)
    throw Error('All four separately measured Model B wheel positions are required');
  const front=result.filter(x=>x.station==='front');
  const rear=result.filter(x=>x.station==='rear');
  const frontX=(front[0].centerM[0]+front[1].centerM[0])/2;
  const rearX=(rear[0].centerM[0]+rear[1].centerM[0])/2;
  const wb=Math.abs(frontX-rearX);
  if(wb<2.8||wb>3.6)throw Error('Source-wheel wheelbase outside provisional 2026 visual range');
  return result;
}

/**
 * The front wheel assembly is not a rear suspension model. The rear visual
 * preview reuses only original source wheel-end/brake/bearing/fastener parts.
 */
export function visibleInFourCornerPreview(partName:string,station:'front'|'rear'):boolean {
  if(station==='front')return true;
  const subsystem=classifyP28Part(partName);
  return subsystem==='tyre'||subsystem==='rim'||
    subsystem==='carbon-brake'||subsystem==='caliper'||
    subsystem==='friction-pad'||subsystem==='bearing'||
    subsystem==='hardware'||subsystem==='hub';
}

export function wheelLayoutReport(fit:OwnerMeasuredFit) {
  const corners=layoutFourCorners(fit);
  return {
    schema:'podium-eds.four-corner-visual-review.v1' as const,
    modelBOriginalSourceModified:false as const,
    originalP28CadScale:1 as const,
    garageSource:'original P2.8 front wheel-end 59 CAD-derived meshes' as const,
    dimensionsM:fit.normalizedShellEnvelopeM,
    shellDisplayScale:fit.normalizedShellScale,
    corners,
    genuineRearAssemblyAvailable:false as const,
    mechanicalG2:'HOLD' as const,
    scope:'4 WHEEL-ENVELOPE VISUAL REVIEW — NOT 4 AUTHENTIC CORNER CAD MATES' as const,
  };
}
