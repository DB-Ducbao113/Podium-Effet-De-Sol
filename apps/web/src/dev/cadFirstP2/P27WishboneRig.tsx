import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type P27WishbonePose = {
  lowerBumpMm: number;
  upperOuterMm: number[];
  lowerOuterMm: number[];
  maximumRodResidualMm: number;
};

/**
 * Project-authored P2.7 A-arm subassembly ONLY.
 *
 * Pivots stay at the proposed chassis-side hardpoints. Each forged arm
 * rotates around its own fixed Z-axis chassis hinge, rather than translating
 * the entire wheel. Each separate outer stud follows the actual constrained
 * outer-joint point. Chassis bushings remain stationary.
 *
 * Visual motion is based on 31 discrete CAD hardpoint solutions. It does not
 * imply the subassembly fits the legacy P2.6 upright or has real F1 dynamics.
 */
export default function P27WishboneRig({
  model, pose,
}: { model: THREE.Group; pose: P27WishbonePose }) {
  const { invalidate } = useThree();
  const nodes = useMemo(() => {
    const snapshots: Array<{
      node: THREE.Mesh; origin: THREE.Vector3; rotation: THREE.Quaternion;
    }> = [];
    model.traverse(node => {
      if (node instanceof THREE.Mesh) snapshots.push({
        node, origin: node.position.clone(), rotation: node.quaternion.clone(),
      });
    });
    return snapshots;
  }, [model]);

  useEffect(() => {
    invalidate();
    return () => {
      nodes.forEach(({node,origin,rotation})=>{
        node.position.copy(origin);
        node.quaternion.copy(rotation);
      });
      invalidate();
    };
  }, [nodes,invalidate]);
  useEffect(()=>invalidate(),[pose,invalidate]);

  const zAxis = useMemo(()=>new THREE.Vector3(0,0,1),[]);
  const quaternion = useMemo(()=>new THREE.Quaternion(),[]);
  const pivot = useMemo(()=>new THREE.Vector3(),[]);
  const oldOuter = useMemo(()=>new THREE.Vector3(),[]);
  const newOuter = useMemo(()=>new THREE.Vector3(),[]);
  const rotatedPivot = useMemo(()=>new THREE.Vector3(),[]);

  useFrame(()=>{
    for(const {node,origin,rotation} of nodes){
      const upper=node.name.includes('_UPPER_');
      const lower=node.name.includes('_LOWER_');
      if(!upper && !lower) continue;
      const isArm=node.name.includes('_A_ARM_');
      const isStud=node.name.includes('_OUTER_JOINT_STUD');
      node.position.copy(origin);
      node.quaternion.copy(rotation);
      if(!isArm && !isStud) continue;
      const neutralY=upper?114:-114;
      const innerY=upper?190:-190;
      oldOuter.set(-.098,neutralY/1000,-.170);
      const target=upper?pose.upperOuterMm:pose.lowerOuterMm;
      newOuter.set(target[0]/1000,target[1]/1000,target[2]/1000);
      if(isArm){
        const vx=oldOuter.x+.370,vy=oldOuter.y-innerY/1000;
        const wx=newOuter.x+.370,wy=newOuter.y-innerY/1000;
        const angle=Math.atan2(vx*wy-vy*wx,vx*wx+vy*wy);
        quaternion.setFromAxisAngle(zAxis,angle);
        pivot.set(-.370,innerY/1000,-.260);
        rotatedPivot.copy(pivot).applyQuaternion(quaternion);
        node.position.applyQuaternion(quaternion).add(pivot).sub(rotatedPivot);
        node.quaternion.premultiply(quaternion);
      }else{
        node.position.add(newOuter).sub(oldOuter);
      }
    }
  });
  return null;
}
