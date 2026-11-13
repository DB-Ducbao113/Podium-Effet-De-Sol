import type { CornerPresentation } from './cadPresentation';

/**
 * Source coordinate policy for source-authored Model B + P2.8 preview.
 *
 * Model B root-local coordinates are NOT metres. Its displayed shell is
 * normalized by the independently measured source-wheel scale (m/source-unit).
 * P2.8 root-local coordinates are already CAD metres and must not be scaled.
 *
 * Every returned tuple is a new copy and is in each source's original
 * root-local coordinate frame, expressed in metres for registration.
 */
export function canonicalPickedPointM(
  target: 'modelb' | 'p28',
  sourceRootLocal: [number,number,number],
  shellScaleMPerUnit: number | null,
  presentation: CornerPresentation,
): [number,number,number] {
  if(sourceRootLocal.length!==3||
     sourceRootLocal.some(v=>!Number.isFinite(v)||Math.abs(v)>10000))
    throw Error('Invalid source-local 3D pick coordinates');

  if(target==='modelb'){
    if(shellScaleMPerUnit===null||!Number.isFinite(shellScaleMPerUnit)||
       shellScaleMPerUnit<=0||shellScaleMPerUnit>1)
      throw Error('Original Model B wheel calibration is required before picking metric landmarks');
    return sourceRootLocal.map(v=>v*shellScaleMPerUnit) as [number,number,number];
  }

  // Exploded mode modifies individual native mesh positions for presentation.
  // A raycast there is NOT an original P2.8 root-local source landmark.
  if(presentation==='exploded')
    throw Error('Return P2.8 to an unshifted presentation before picking original CAD landmarks');
  return [...sourceRootLocal] as [number,number,number];
}
