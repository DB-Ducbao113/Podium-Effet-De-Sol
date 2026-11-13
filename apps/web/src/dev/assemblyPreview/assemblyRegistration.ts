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
  Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=10000);
const v3=(a:[number,number,number])=>new THREE.Vector3(...a);
/**
 * A rigid fit needs two independent axes in both sources. Reject nearly
 * collinear picks even if floating point arithmetic can construct a frame.
 * Units are metres; the thresholds prevent a numerically unstable preview.
 */
function ensureSpatialSpread(points:THREE.Vector3[]):void {
  const origin=points[0];
  let baseline=new THREE.Vector3();
  let span=0;
  for(const p of points){
    const delta=p.clone().sub(origin);
    if(delta.length()>span){baseline=delta;span=delta.length();}
  }
  if(span<.001)throw Error('Landmarks must be distinct and non-collinear');
  let height=0;
  for(const p of points){
    height=Math.max(height,
      new THREE.Vector3().crossVectors(baseline,p.clone().sub(origin)).length()/span);
  }
  if(height<Math.max(.001,span*.001))
    throw Error('Landmarks must be distinct and non-collinear');
}

/**
 * Horn's quaternion least-squares registration using ALL measured pairs.
 * Jacobi diagonalization of the symmetric 4x4 Davenport/Horn matrix avoids
 * first-three-anchor bias and handles 180-degree rotations. No scale term.
 */
function fitRigidRotation(source:THREE.Vector3[],target:THREE.Vector3[]):{
  quaternion:THREE.Quaternion;translation:THREE.Vector3
} {
  const sc=source.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).multiplyScalar(1/source.length);
  const tc=target.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).multiplyScalar(1/target.length);
  const h:number[][]=Array.from({length:3},()=>[0,0,0]);
  for(let i=0;i<source.length;i++){
    const p=source[i].clone().sub(sc),q=target[i].clone().sub(tc);
    const a=[p.x,p.y,p.z],b=[q.x,q.y,q.z];
    for(let j=0;j<3;j++)for(let k=0;k<3;k++)h[j][k]+=a[j]*b[k];
  }
  const [[xx,xy,xz],[yx,yy,yz],[zx,zy,zz]]=h;
  const n:number[][]=[
    [xx+yy+zz, yz-zy, zx-xz, xy-yx],
    [yz-zy, xx-yy-zz, xy+yx, zx+xz],
    [zx-xz, xy+yx, -xx+yy-zz, yz+zy],
    [xy-yx, zx+xz, yz+zy, -xx-yy+zz],
  ];
  const eigenvectors:number[][]=[
    [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  ];
  let converged=false;
  for(let iteration=0;iteration<80;iteration++){
    let a=0,b=1,offDiagonal=0;
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
      const magnitude=Math.abs(n[i][j]);
      if(magnitude>offDiagonal){a=i;b=j;offDiagonal=magnitude;}
    }
    const diagScale=Math.max(...n.map((row,i)=>Math.abs(row[i])));
    if(offDiagonal<=Math.max(1e-15,diagScale*1e-14)){converged=true;break;}
    const off=n[a][b],tau=(n[b][b]-n[a][a])/(2*off);
    const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.sqrt(1+tau*tau));
    const c=1/Math.sqrt(1+t*t),s=t*c;
    const aa=n[a][a],bb=n[b][b];
    n[a][a]=aa-t*off;n[b][b]=bb+t*off;n[a][b]=n[b][a]=0;
    for(let k=0;k<4;k++){
      if(k!==a&&k!==b){
        const ka=n[k][a],kb=n[k][b];
        n[k][a]=n[a][k]=c*ka-s*kb;
        n[k][b]=n[b][k]=s*ka+c*kb;
      }
      const va=eigenvectors[k][a],vb=eigenvectors[k][b];
      eigenvectors[k][a]=c*va-s*vb;
      eigenvectors[k][b]=s*va+c*vb;
    }
  }
  if(!converged)throw Error('Rigid landmark fit failed to converge');
  let best=0;
  for(let i=1;i<4;i++)if(n[i][i]>n[best][best])best=i;
  const w=eigenvectors[0][best],x=eigenvectors[1][best];
  const y=eigenvectors[2][best],z=eigenvectors[3][best];
  const quaternion=new THREE.Quaternion(x,y,z,w).normalize();
  // Determine the translation from the complete set, never one noisy anchor.
  const translation=tc.clone().sub(sc.clone().applyQuaternion(quaternion));
  return {quaternion,translation};
}
export function registerOwnerLandmarks(data:RegistrationInput):RegistrationResult {
  if(data.schema!=='podium-eds.modelb-p28.landmarks.v1'||data.sourceUnits!=='m'||
    data.targetUnits!=='m'||data.sourceScale!==1||!Array.isArray(data.landmarks)||
    data.landmarks.length<3||data.landmarks.length>50||
    !data.landmarks.every(a=>a&&typeof a.id==='string'&&a.id.trim()&&point(a.p28M)&&point(a.modelBM))||
    new Set(data.landmarks.map(a=>a.id.trim())).size!==data.landmarks.length||
    typeof data.evidence!=='string'||!data.evidence.trim()){
    throw Error('Invalid landmark data; three unique measured source/target point pairs and evidence required');
  }
  const source=data.landmarks.map(p=>v3(p.p28M));
  const target=data.landmarks.map(p=>v3(p.modelBM));
  ensureSpatialSpread(source);
  ensureSpatialSpread(target);
  const {quaternion,translation:shift}=fitRigidRotation(source,target);
  let mismatch=0;
  // Audit every measured pair, not only the three anchors used to build the frame.
  // A fourth or later mismatched landmark must not silently bypass the length gate.
  for(let i=0;i<data.landmarks.length;i++)for(let j=i+1;j<data.landmarks.length;j++){
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
