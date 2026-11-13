import {describe,expect,it} from 'vitest';
import {classifyP28Part,materialForP28Part,presentationForP28Part} from './cadPresentation';

const sourceNames=[
 'P2_TYRE_SLICK_BODY',
 'P2_RIM_FORGED_BARREL',
 'P2_BRAKE_ROTOR_DRILLED_CARBON',
 'P2_CALIPER_OUTBOARD_CASTING',
 'P2_BEARING_INNER_RACE',
 'P2_BEARING_BALL_01',
 'P2_CENTER_LOCK_NUT_BORE',
 'P2_CENTER_STUD_EXTERNAL_HELIX',
 'P2_WHEEL_HUB_SHAFT_FLANGE',
 'P27_UPPER_A_ARM_FORGED',
 'P2_UPRIGHT_BEARING_CARRIER',
];
describe('original P2.8 non-destructive source presentation',()=>{
 it('keeps every existing source part in original native assembled pose',()=>{
  for(const name of sourceNames){
    expect(presentationForP28Part(name,'assembled')).toMatchObject({
      visible:true,offsetM:[0,0,0],
    });
  }
 });
 it('hides only tyre in tyre-off inspection',()=>{
  expect(presentationForP28Part('P2_TYRE_SLICK_BODY','tyre-hidden').visible).toBe(false);
  expect(presentationForP28Part('P2_RIM_FORGED_BARREL','tyre-hidden').visible).toBe(true);
  expect(presentationForP28Part('P2_BEARING_BALL_01','tyre-hidden').visible).toBe(true);
 });
 it('exposes native rotor and bearings in mechanism-core view',()=>{
  expect(presentationForP28Part('P2_TYRE_SLICK_BODY','mechanism-core').visible).toBe(false);
  expect(presentationForP28Part('P2_RIM_FORGED_BARREL','mechanism-core').visible).toBe(false);
  expect(presentationForP28Part('P2_BRAKE_ROTOR_DRILLED_CARBON','mechanism-core').visible).toBe(true);
  expect(presentationForP28Part('P2_BEARING_INNER_RACE','mechanism-core').visible).toBe(true);
  expect(presentationForP28Part('P27_UPPER_A_ARM_FORGED','mechanism-core').visible).toBe(true);
 });
 it('spatially separates tyre and rim in exploded preview, preserving all source parts',()=>{
  const tyre=presentationForP28Part('P2_TYRE_SLICK_BODY','exploded');
  const rim=presentationForP28Part('P2_RIM_FORGED_BARREL','exploded');
  const rotor=presentationForP28Part('P2_BRAKE_ROTOR_DRILLED_CARBON','exploded');
  expect(tyre.visible&&rim.visible&&rotor.visible).toBe(true);
  expect(Math.hypot(...tyre.offsetM)).toBeGreaterThan(.65);
  expect(Math.hypot(...rim.offsetM)).toBeGreaterThan(.3);
  expect(tyre.offsetM).not.toEqual(rim.offsetM);
 });
 it('gives source-identifiable fasteners, friction parts, forged rims and bearings distinct looks',()=>{
  expect(classifyP28Part('P2_BEARING_BALL_09')).toBe('bearing');
  expect(classifyP28Part('P2_ROTOR_MOUNT_NUT_01')).toBe('hardware');
  expect(classifyP28Part('P2_CALIPER_BRIDGE_STUD_02')).toBe('hardware');
  expect(classifyP28Part('P2_CALIPER_INBOARD_CASTING')).toBe('caliper');
  const metal=materialForP28Part('bearing');
  const rubber=materialForP28Part('tyre');
  expect(metal.metalness).toBeGreaterThan(.7);
  expect(rubber.metalness).toBe(0);
  expect(materialForP28Part('caliper').color).not.toBe(metal.color);
 });
});
