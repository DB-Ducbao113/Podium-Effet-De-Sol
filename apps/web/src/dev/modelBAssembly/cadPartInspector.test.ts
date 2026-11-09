import {describe,expect,it} from 'vitest';
import {REAR_TOE_ADJUSTER_ALL_PARTS} from '../assemblyPreview/rearToeAdjusterSource';
import {P214_PARTS} from '../assemblyPreview/splitRaceSource';
import {inspectOriginalCadMesh} from './cadPartInspector';

const front=[...Array.from({length:57},(_,i)=>'P2_SOURCE_PART_'+i),
 'P2_FASTENER_BOLT_01','P2_TYRE_SLICK_BODY'];
describe('Owner Model B native mesh raycast source inspection',()=>{
 it('reports original front fasteners, not generic object labels',()=>{
  const part=inspectOriginalCadMesh('P2_FASTENER_BOLT_01',
    'front-positive-z','p28',front);
  expect(part.subsystem).toContain('Fastener');
  expect(part.partId).toBe('P2_FASTENER_BOLT_01');
  expect(part.sourceAuthority).toBe('PROJECT_AUTHORED_ORIGINAL_CAD');
  expect(part.sourceWheelEndIsRearProxy).toBe(false);
  expect(part.mechanicalMateCertified).toBe(false);
 });
 it('identifies a rear front-source visual wheel-end proxy explicitly',()=>{
  const part=inspectOriginalCadMesh('P2_TYRE_SLICK_BODY',
    'rear-negative-z','p28',front);
  expect(part.sourceWheelEndIsRearProxy).toBe(true);
  expect(part.sourceLabel).toContain('REAR VISUAL PROXY');
  expect(part.mechanicalMateCertified).toBe(false);
 });
 it('distinguishes two native source versions of rear joint and toe',()=>{
  const toe=inspectOriginalCadMesh(REAR_TOE_ADJUSTER_ALL_PARTS[0],
    'rear-positive-z','rear-toe',front);
  expect(toe.sourceAuthority).toBe('PROJECT_AUTHORED_PROPOSAL');
  const race=inspectOriginalCadMesh(P214_PARTS[0],
    'rear-negative-z','joint',front);
  expect(race.subsystem).toContain('Split spherical');
  const sleeve=inspectOriginalCadMesh(
    P214_PARTS.find(s=>s.includes('SLEEVE'))!,
    'rear-positive-z','joint',front);
  expect(sleeve.subsystem).toContain('NOT validated');
  expect(sleeve.mechanicalMateCertified).toBe(false);
 });
 it('rejects fabricated IDs, invalid measured stations or front rear-joint picks',()=>{
  expect(()=>inspectOriginalCadMesh('INVENTED_F1_BOLT',
    'front-positive-z','p28',front)).toThrow(/identity/);
  expect(()=>inspectOriginalCadMesh(P214_PARTS[0],
    'front-positive-z','joint',front)).toThrow(/rear/);
  expect(()=>inspectOriginalCadMesh(P214_PARTS[0],
    'rear-positive-z','rear-toe',front)).toThrow(/P2.12/);
  expect(()=>inspectOriginalCadMesh(P214_PARTS[0],
    'rear-positive-z','joint',front.slice(0,58))).not.toThrow();
  expect(()=>inspectOriginalCadMesh('',
    'rear-positive-z','joint',front)).toThrow(/Invalid/);
 });
});
