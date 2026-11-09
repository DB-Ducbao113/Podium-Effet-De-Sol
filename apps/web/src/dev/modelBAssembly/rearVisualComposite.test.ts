import {describe,expect,it} from 'vitest';
import {P213_REPLACED_BEARING_PARTS} from '../assemblyPreview/rearJointSource';
import {REAR_TOE_ADJUSTER_ALL_PARTS} from '../assemblyPreview/rearToeAdjusterSource';
import {P214_PARTS} from '../assemblyPreview/splitRaceSource';
import {rearVisualPartIds} from './rearVisualComposite';

describe('Owner Model B rear static CAD overlay identity',()=>{
 it('displays exactly 31 authored native solids after P2.14 replacement',()=>{
  const row=rearVisualPartIds(REAR_TOE_ADJUSTER_ALL_PARTS,P214_PARTS);
  expect(row.originalToeMeshes).toBe(19);
  expect(row.hiddenOldAnnularBearingProxies).toBe(4);
  expect(row.replacementJointMeshes).toBe(16);
  expect(row.count).toBe(31);
  expect(new Set(row.visiblePartNames).size).toBe(31);
  for(const name of P213_REPLACED_BEARING_PARTS)
   expect(row.visiblePartNames).not.toContain(name);
  for(const name of P214_PARTS)expect(row.visiblePartNames).toContain(name);
  expect(row.genuineRearMechanicalMateCertified).toBe(false);
 });
 it('retains true 19 P2.12 source meshes when P2.14 is not loaded',()=>{
  const row=rearVisualPartIds(REAR_TOE_ADJUSTER_ALL_PARTS,null);
  expect(row.count).toBe(19);
  expect(row.hiddenOldAnnularBearingProxies).toBe(0);
  expect(row.replacementJointMeshes).toBe(0);
 });
 it('rejects duplicate or fabricated rear CAD node identities',()=>{
  expect(()=>rearVisualPartIds(
   REAR_TOE_ADJUSTER_ALL_PARTS.slice(0,18),P214_PARTS)).toThrow(/19 mesh/);
  expect(()=>rearVisualPartIds(
   [...REAR_TOE_ADJUSTER_ALL_PARTS.slice(1),REAR_TOE_ADJUSTER_ALL_PARTS[1]],P214_PARTS))
   .toThrow(/19 mesh/);
  expect(()=>rearVisualPartIds(
   REAR_TOE_ADJUSTER_ALL_PARTS,[...P214_PARTS.slice(1),P214_PARTS[1]]))
   .toThrow(/split bearing/);
 });
});
