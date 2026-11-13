import {describe,it,expect} from 'vitest';
import {registerOwnerLandmarks,type RegistrationInput} from './assemblyRegistration';
const dataset=():RegistrationInput=>({
 schema:'podium-eds.modelb-p28.landmarks.v1',sourceUnits:'m',targetUnits:'m',sourceScale:1,evidence:'synthetic unit test only',
 landmarks:[
  {id:'axle',p28M:[0,0,0],modelBM:[1,2,3]},
  {id:'outer',p28M:[1,0,0],modelBM:[1,3,3]},
  {id:'upper',p28M:[0,1,0],modelBM:[0,2,3]},
  {id:'extra',p28M:[0,0,1],modelBM:[1,2,4]},
 ]
});
describe('owner-specific non-scaled registration',()=>{
 it('registers rigid 90deg Z motion plus translation',()=>{
  const r=registerOwnerLandmarks(dataset());expect(r.maxResidualM).toBeLessThan(1e-7);
  expect(r.lengthMismatchM).toBeLessThan(1e-7);
  expect(r.validatedForMechanicalFit).toBe(false);
 });
 it('rejects scale mismatch rather than scaling P2.8',()=>{
  const d=dataset();d.landmarks[1].modelBM=[1,4,3];
  const r=registerOwnerLandmarks(d);
  expect(r.lengthMismatchM).toBeGreaterThan(.1);
 });
 it('audits every anchor pair, including the fourth and later landmarks',()=>{
  const d=dataset();
  d.landmarks[3].modelBM=[1,2,4.25];
  const r=registerOwnerLandmarks(d);
  expect(r.lengthMismatchM).toBeGreaterThan(.2);
  expect(r.maxResidualM).toBeGreaterThan(.2);
  expect(r.anchorResidualM).toHaveLength(4);
  expect(r.validatedForMechanicalFit).toBe(false);
 });
 it('does not hide inconsistent late anchors when the first triangle matches',()=>{
  const d=dataset();
  d.landmarks.push({id:'fifth',p28M:[0,0,2],modelBM:[1,2,5.1]});
  expect(registerOwnerLandmarks(d).lengthMismatchM).toBeGreaterThan(.09);
 });
 it('fits all landmarks and is order-independent under measured noise',()=>{
  const d=dataset();
  d.landmarks[0].modelBM=[1.004,2,3]; // 4 mm error in first pick.
  const fit=registerOwnerLandmarks(d);
  const reversed=registerOwnerLandmarks({...d,landmarks:[...d.landmarks].reverse()});
  // First-anchor-only registration would leave a 4 mm residual; all-point
  // least squares distributes measurement error without scaling source CAD.
  expect(fit.maxResidualM).toBeLessThan(.003);
  expect(fit.lengthMismatchM).toBeGreaterThan(.003);
  expect(fit.validatedForMechanicalFit).toBe(false);
  expect(reversed.maxResidualM).toBeCloseTo(fit.maxResidualM,10);
  fit.translationM.forEach((value,i)=>
    expect(reversed.translationM[i]).toBeCloseTo(value,10));
  fit.rotationQuaternion.forEach((value,i)=>
    expect(reversed.rotationQuaternion[i]).toBeCloseTo(value,10));
 });
 it('recovers a rigid 180-degree rotation without scale or mirroring',()=>{
  const d=dataset();
  d.landmarks=d.landmarks.map(p=>({
    ...p,modelBM:[p.p28M[0]+3,4-p.p28M[1],-5-p.p28M[2]] as [number,number,number],
  }));
  const fit=registerOwnerLandmarks(d);
  expect(fit.maxResidualM).toBeLessThan(1e-8);
  expect(fit.lengthMismatchM).toBeLessThan(1e-8);
 });
 it('uses additional noncollinear anchors when the first three are collinear',()=>{
  const d=dataset();
  d.landmarks[2].p28M=[2,0,0];
  d.landmarks[2].modelBM=[1,4,3];
  expect(registerOwnerLandmarks(d).maxResidualM).toBeLessThan(1e-8);
 });
 it('rejects a fully collinear source even when target is well-conditioned',()=>{
  const d=dataset();
  d.landmarks[2].p28M=[2,0,0];
  d.landmarks[3].p28M=[3,0,0];
  expect(()=>registerOwnerLandmarks(d)).toThrow(/non-collinear/);
 });
 it('rejects near-collinear target picks regardless of source shape',()=>{
  const d=dataset();
  d.landmarks.forEach((p,i)=>{
    p.modelBM=[1+i*.5,2+(i===2?.0001:0),3];
  });
  expect(()=>registerOwnerLandmarks(d)).toThrow(/non-collinear/);
 });
 it('rejects unreasonable source coordinates before covariance arithmetic',()=>{
  const d=dataset();
  d.landmarks[3].p28M=[1e150,0,0];
  expect(()=>registerOwnerLandmarks(d)).toThrow(/Invalid landmark data/);
 });
 it('rejects a reflected source even when all pairwise lengths are unchanged',()=>{
  const d=dataset();
  d.landmarks=d.landmarks.map(p=>({
    ...p,modelBM:[1+p.p28M[0],2+p.p28M[1],3-p.p28M[2]] as [number,number,number],
  }));
  const r=registerOwnerLandmarks(d);
  expect(r.lengthMismatchM).toBeLessThan(1e-8);
  expect(r.maxResidualM).toBeGreaterThan(.005);
  expect(r.validatedForMechanicalFit).toBe(false);
 });
 it('rejects duplicated landmark IDs after whitespace normalization',()=>{
  const d=dataset();d.landmarks[2].id='  axle  ';
  expect(()=>registerOwnerLandmarks(d)).toThrow(/unique/);
 });
 it('rejects absent provenance',()=>{
  const d=dataset();d.evidence='';
  expect(()=>registerOwnerLandmarks(d)).toThrow(/evidence/);
 });
 it('rejects duplicated IDs',()=>{
  const d=dataset();d.landmarks[2].id='axle';
  expect(()=>registerOwnerLandmarks(d)).toThrow(/unique/);
 });
});
