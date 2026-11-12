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

/** Bounds of THIS mesh's authored geometry after its Three.js world matrix.
 * Unlike Box3.setFromObject(mesh), these bounds exclude child mesh geometry.
 * Min/max and matrix elements refer to the original verified GLB data; this
 * helper creates no substitute vertices or CAD solids.
 */
export function sourceMeshOwnWorldBounds(
 min:readonly [number,number,number],
 max:readonly [number,number,number],
 world:ArrayLike<number>,
):{center:[number,number,number];size:[number,number,number];diagonal:number}{
 if(world.length!==16||
    !min.every(Number.isFinite)||!max.every(Number.isFinite)||
    Array.from(world).some(v=>!Number.isFinite(v))||
    min.some((v,i)=>v>max[i])||
    Math.abs(world[3])>1e-9||Math.abs(world[7])>1e-9||
    Math.abs(world[11])>1e-9||Math.abs(world[15]-1)>1e-9)
  throw Error('Invalid original GLB own geometry world bounds');
 const mx=(min[0]+max[0])/2,my=(min[1]+max[1])/2,
  mz=(min[2]+max[2])/2;
 const hx=(max[0]-min[0])/2,hy=(max[1]-min[1])/2,
  hz=(max[2]-min[2])/2;
 const cx=world[0]*mx+world[4]*my+world[8]*mz+world[12];
 const cy=world[1]*mx+world[5]*my+world[9]*mz+world[13];
 const cz=world[2]*mx+world[6]*my+world[10]*mz+world[14];
 const sx=2*(Math.abs(world[0])*hx+Math.abs(world[4])*hy+
  Math.abs(world[8])*hz);
 const sy=2*(Math.abs(world[1])*hx+Math.abs(world[5])*hy+
  Math.abs(world[9])*hz);
 const sz=2*(Math.abs(world[2])*hx+Math.abs(world[6])*hy+
  Math.abs(world[10])*hz);
 const diagonal=Math.hypot(sx,sy,sz);
 if(![cx,cy,cz,sx,sy,sz,diagonal].every(Number.isFinite))
  throw Error('Nonfinite original GLB own geometry world bounds');
 return {center:[cx,cy,cz],size:[sx,sy,sz],diagonal};
}

/** Original-world reveal is a unit direction: configured metres must not
 * silently grow by sqrt(2+0.5^2) due to an unnormalised x/y/z vector.
 */
export function sourceMeshRevealWorldDirection(
 center:readonly [number,number,number],
):[number,number,number]{
 if(center.length!==3||!center.every(Number.isFinite))
  throw Error('Invalid original Model B world source centre');
 const x=center[0]>0?1:-1;
 const y=center[1]>0?.7:-.5;
 const z=center[2]>=0?1:-1;
 const length=Math.hypot(x,y,z);
 return [x/length,y/length,z/length];
}
