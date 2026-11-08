import * as THREE from 'three';

/** Research-only rigid registration. No scaling, deformation or manufactured fit. */
export type Landmark = {
  id: string;
  p28M: [number,number,number];
  modelBM: [number,number,number];
};
export type RegistrationInput = {
  schema: 'podium-eds.modelb-p28.landmarks.v1';
  sourceUnits: 'm';
  targetUnits: 'm';
  sourceScale: 1;
  landmarks: Landmark[];
  evidence: string;
};
export type RegistrationResult = {
  translationM: [number,number,number];
  rotationQuaternion: [number,number,number,number];
  anchorResidualM: number[];
  maxResidualM: number;
  lengthMismatchM: number;
  validatedForMechanicalFit: false;
};

const point=(v:unknown):v is [number,number,number] =>
  Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n));
const v3=(a:[number,number,number])=>new THREE.Vector3(...a);
function frame(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3):THREE.Matrix4 {
  const x=b.clone().sub(a);
  const temp=c.clone().sub(a);
  const cross=new THREE.Vector3().crossVectors(x,temp);
  if(x.length()<.001||cross.length()<.000001)
    throw Error('Landmarks must be distinct and non-collinear');
  x.normalize();
  const z=cross.normalize();
  const y=new THREE.Vector3().crossVectors(z,x).normalize();
  return new THREE.Matrix4().makeBasis(x,y,z);
}
export function registerOwnerLandmarks(data:RegistrationInput):RegistrationResult {
  if(data.schema!=='podium-eds.modelb-p28.landmarks.v1'||data.sourceUnits!=='m'||
    data.targetUnits!=='m'||data.sourceScale!==1||!Array.isArray(data.landmarks)||
    data.landmarks.length<3||data.landmarks.length>50||
    !data.landmarks.every(a=>a&&typeof a.id==='string'&&a.id.trim()&&point(a.p28M)&&point(a.modelBM))||
    new Set(data.landmarks.map(a=>a.id)).size!==data.landmarks.length||
    typeof data.evidence!=='string'||!data.evidence.trim()){
    throw Error('Invalid landmark data; three unique measured source/target point pairs and evidence required');
  }
  const [a,b,c]=data.landmarks;
  const source=frame(v3(a.p28M),v3(b.p28M),v3(c.p28M));
  const target=frame(v3(a.modelBM),v3(b.modelBM),v3(c.modelBM));
  const rotation=target.clone().multiply(source.clone().invert());
  const quaternion=new THREE.Quaternion().setFromRotationMatrix(rotation).normalize();
  const shift=v3(a.modelBM).sub(v3(a.p28M).applyQuaternion(quaternion));
  let mismatch=0;
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
    const left=v3(data.landmarks[i].p28M).distanceTo(v3(data.landmarks[j].p28M));
    const right=v3(data.landmarks[i].modelBM).distanceTo(v3(data.landmarks[j].modelBM));
    mismatch=Math.max(mismatch,Math.abs(left-right));
  }
  const residuals=data.landmarks.map(p=>
    v3(p.p28M).applyQuaternion(quaternion).add(shift).distanceTo(v3(p.modelBM)));
  return {
    translationM:shift.toArray(),
    rotationQuaternion:[quaternion.x,quaternion.y,quaternion.z,quaternion.w],
    anchorResidualM:residuals,
    maxResidualM:Math.max(...residuals),
    lengthMismatchM:mismatch,
    validatedForMechanicalFit:false,
  };
}
