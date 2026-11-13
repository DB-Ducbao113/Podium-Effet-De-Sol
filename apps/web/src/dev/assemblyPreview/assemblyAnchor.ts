/**
 * One original CAD anchor mapped to a Model B presentation anchor, using a
 * rotation and translation only. Never scales or mutates original source data.
 * All coordinates must already be in metres and the quaternion is [x,y,z,w].
 */
export type MeterPoint = [number,number,number];
export type UnitQuaternion = [number,number,number,number];

function checkedPoint(value: MeterPoint): void {
  if(value.length!==3 || value.some(n=>!Number.isFinite(n)||Math.abs(n)>10000))
    throw Error('Invalid CAD anchor coordinate');
}

export function rotatePointByQuaternion(point: MeterPoint, q: UnitQuaternion): MeterPoint {
  checkedPoint(point);
  if(q.length!==4||q.some(n=>!Number.isFinite(n)))
    throw Error('Invalid rigid rotation quaternion');
  const [x,y,z,w]=q;
  const magnitude=x*x+y*y+z*z+w*w;
  if(Math.abs(magnitude-1)>1e-4)
    throw Error('Rigid rotation quaternion must be unit length');
  const [vx,vy,vz]=point;
  const cx=y*vz-z*vy,cy=z*vx-x*vz,cz=x*vy-y*vx;
  const dx=y*cz-z*cy,dy=z*cx-x*cz,dz=x*cy-y*cx;
  return [vx+2*(w*cx+dx),vy+2*(w*cy+dy),vz+2*(w*cz+dz)];
}

/**
 * Translation for a rigid pose that keeps sourceAnchor centered on targetAnchor
 * even when the source assembly is manually rotated. This corrects the
 * center-minus-unrotated-center drift of the P2.8 wheel overlay.
 */
export function anchoredSourceTranslation(
  targetAnchorM: MeterPoint,
  sourceAnchorM: MeterPoint,
  rotation: UnitQuaternion,
  userOffsetM: MeterPoint,
): MeterPoint {
  checkedPoint(targetAnchorM);
  checkedPoint(userOffsetM);
  const rotated=rotatePointByQuaternion(sourceAnchorM,rotation);
  return targetAnchorM.map((value,i)=>value-rotated[i]+userOffsetM[i]) as MeterPoint;
}
