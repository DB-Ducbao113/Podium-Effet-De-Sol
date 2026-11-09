import * as THREE from 'three';

/** Clone-only visual choreography pivot around the authentic mesh centroid.
 *
 * P2.8 named bolt/stud/nut meshes are part of original project CAD. Animating
 * their source Object3D about its native origin might orbit the whole corner,
 * because CAD vertices may be authored in pre-transformed local coordinates.
 * Inserting this centre pivot preserves the ORIGINAL final mesh matrix
 * exactly, including scale, rotations and thread chirality.
 *
 * Cosmetic spin is not a validated thread screw-in, torque, or assembly path.
 */
export type CadAnimatedPivot={
  root:THREE.Group;
  mesh:THREE.Mesh;
  originalPosition:THREE.Vector3;
  originalQuaternion:THREE.Quaternion;
  spinAxis:THREE.Vector3;
};

export function pivotSourceMeshAtCentroid(mesh:THREE.Mesh):CadAnimatedPivot{
  const parent=mesh.parent;
  if(!parent)throw Error('Original CAD mesh must be attached to its cloned source parent');
  if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
  const bbox=mesh.geometry.boundingBox;
  if(!bbox||bbox.isEmpty())throw Error('Original CAD screw source geometry has no bounds');
  const centre=bbox.getCenter(new THREE.Vector3());
  const size=bbox.getSize(new THREE.Vector3());
  if(![centre.x,centre.y,centre.z,size.x,size.y,size.z].every(Number.isFinite))
    throw Error('Original CAD screw centroid/bounds are nonfinite');

  const originalPosition=mesh.position.clone();
  const originalQuaternion=mesh.quaternion.clone();
  const originalScale=mesh.scale.clone();
  const scaledCentre=centre.clone().multiply(originalScale).applyQuaternion(originalQuaternion);

  const pivot=new THREE.Group();
  pivot.name='CAD_VISUAL_PIVOT_'+mesh.name;
  pivot.position.copy(originalPosition).add(scaledCentre);
  pivot.quaternion.copy(originalQuaternion);
  pivot.scale.copy(originalScale);
  parent.add(pivot);
  parent.remove(mesh);
  pivot.add(mesh);
  mesh.position.copy(centre).multiplyScalar(-1);
  mesh.quaternion.identity();
  mesh.scale.set(1,1,1);
  mesh.updateMatrix();

  // Determine a visual axis from the local elongated solid; never infer a
  // verified machine thread direction from an unlabelled CAD node.
  const spinAxis=size.x>=size.y&&size.x>=size.z?
    new THREE.Vector3(1,0,0):
    size.y>=size.z?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1);
  return {root:pivot,mesh,originalPosition:pivot.position.clone(),
          originalQuaternion:pivot.quaternion.clone(),spinAxis};
}

/** At assembled fraction=1, restores the owner's exact original transform.
 * Any other fraction is a non-physical exploded showroom animation.
 */
export function applyVisualScrewSpin(
  item:CadAnimatedPivot,fraction:number,turns=1.5,
):void{
  const p=Number.isFinite(fraction)?THREE.MathUtils.clamp(fraction,0,1):1;
  if(!Number.isFinite(turns)||Math.abs(turns)>6)
    throw Error('Invalid visual screw turn count');
  const spin=new THREE.Quaternion().setFromAxisAngle(
    item.spinAxis,(1-p)*Math.PI*2*turns);
  item.root.quaternion.copy(item.originalQuaternion).multiply(spin);
}
