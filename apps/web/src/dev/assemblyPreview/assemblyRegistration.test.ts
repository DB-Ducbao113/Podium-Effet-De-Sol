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
 it('rejects collinear reference landmarks',()=>{
  const d=dataset();d.landmarks[2].p28M=[2,0,0];
  expect(()=>registerOwnerLandmarks(d)).toThrow(/non-collinear/);
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
