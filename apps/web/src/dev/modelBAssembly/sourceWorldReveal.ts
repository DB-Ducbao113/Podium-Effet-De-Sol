/** P2.37: source GLB exterior visual offsets, measured in world units.
 * THREE.Box3.setFromObject() already returns WORLD bounds (including any
 * parent shell scale). Never multiply its extent by shellScale a second time.
 * A world-space motion vector must be mapped through the inverse PARENT matrix
 * before being added to a mesh's parent-local Object3D.position.
 */
export function sourceBodyWorldRevealStrength(
 worldExtent:number,meshPhase:number,
):number{
 if(!Number.isFinite(worldExtent)||worldExtent<0)
  throw Error('Invalid original Model B world-space source bounds');
 if(!Number.isFinite(meshPhase)||meshPhase<0||meshPhase>1)
  throw Error('Invalid original Model B mesh phase');
 // Do not tear open the owner's giant authored chassis surfaces.
 if(worldExtent>2.3)return 0;
 return .10+.06*meshPhase;
}

/** Multiply the linear 3x3 of a THREE.Matrix4 inverse (column-major).
 * Translation is deliberately ignored because a displacement is a VECTOR,
 * not a point. Works with any invertible rotated/scaled parent hierarchy.
 */
export function worldDeltaToParentLocal(
 worldDelta:readonly [number,number,number],
 inverseParentWorld:ArrayLike<number>,
):[number,number,number]{
 if(inverseParentWorld.length!==16||
    !worldDelta.every(Number.isFinite)||
    Array.from(inverseParentWorld).some(v=>!Number.isFinite(v)))
  throw Error('Invalid GLB parent transform or reveal displacement');
 const [x,y,z]=worldDelta;
 const m=inverseParentWorld;
 const dx=m[0]*x+m[4]*y+m[8]*z;
 const dy=m[1]*x+m[5]*y+m[9]*z;
 const dz=m[2]*x+m[6]*y+m[10]*z;
 if(![dx,dy,dz].every(Number.isFinite))
  throw Error('Nonfinite GLB parent-local reveal displacement');
 return [dx,dy,dz];
}
