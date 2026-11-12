import {describe,it,expect} from 'vitest';
import {layoutFourCorners,visibleInFourCornerPreview,wheelLayoutReport} from './fourCornerLayout';
import type {OwnerMeasuredFit} from './ownerMeasuredFit';

function originalMeasuredFixture():OwnerMeasuredFit{
  return {
    calibration:'podium-eds.owner-modelb-p28.visual-wheel-envelope.v1',
    source:'actual decoded original Model B + SHA-matched original P2.8 tyre',
    sourceModelBGeometry:'Model B showroom scene coordinates, as-authored (NOT metres)',
    p28SourceUnits:'m',normalizedShellScale:.17357287237986882,p28Scale:1,
    bodyBoundsRaw:[[-13.52299976,-3.11384813,-5.54979670],[14.2695999,2.75646706,5.97793609]],
    wheels:[
      {station:'rear',side:-1,centerSourceUnits:[-11.453,-1.12272,-5.32590525],
        centerM:[-1.987930107,-.194873735,-.924432672],outerRadiusSourceUnits:1.89510685,
        outerRadiusM:.328939139,matchingWheelSamples:1152,hubSamples:515},
      {station:'rear',side:1,centerSourceUnits:[-11.23671,-1.10873,5.740865],
        centerM:[-1.950388031,-.192445451,.996458428],outerRadiusSourceUnits:1.938344999,
        outerRadiusM:.336444109,matchingWheelSamples:1161,hubSamples:515},
      {station:'front',side:-1,centerSourceUnits:[7.24193,-1.06293,-5.234695],
        centerM:[1.257002592,-.184495813,-.908601047],outerRadiusSourceUnits:1.919690861,
        outerRadiusM:.333206257,matchingWheelSamples:1153,hubSamples:514},
      {station:'front',side:1,centerSourceUnits:[7.43235,-1.07544,5.07737],
        centerM:[1.290054338,-.18666721,.881293695],outerRadiusSourceUnits:1.903977402,
        outerRadiusM:.330478827,matchingWheelSamples:1142,hubSamples:514},
    ],
    frontPositiveZCenterM:[1.290054338,-.18666721,.881293695],
    originalP28WheelCenterM:[.001,-.001,0],
    originalP28TyreWidthM:.314,
    axleSpacingPreviewM:3.24268753,
    normalizedShellEnvelopeM:[4.824041357,1.018927469,2.000901692],
    radiusSpreadFraction:.023,mechanicalFitCertified:false,
    gate:'VISUAL_REVIEW_ONLY_HARDPOINTS_UNVERIFIED',
  };
}
describe('exactly four measured source wheel mount transforms',()=>{
 it('has four independently measured XYZ targets and no duplicate positions',()=>{
   const fit=originalMeasuredFixture();
   const all=layoutFourCorners(fit);
   expect(all.map(w=>w.id)).toEqual([
     'rear-negative-z','rear-positive-z','front-negative-z','front-positive-z'
   ]);
   expect(new Set(all.map(w=>w.centerM.join('/'))).size).toBe(4);
   expect(all.every(w=>w.p28Scale===1&&!w.mechanicalMateCertified)).toBe(true);
 });
 it('matches each actual wheel centre after chirality-preserving yaw',()=>{
   const fit=originalMeasuredFixture();
   for(const w of layoutFourCorners(fit)){
     const [sx,sy,sz]=fit.originalP28WheelCenterM;
     const c=Math.cos(w.rotationYRad),s=Math.sin(w.rotationYRad);
     const rotated=[c*sx+s*sz,sy,-s*sx+c*sz];
     for(let axis=0;axis<3;axis++){
       expect(w.translationM[axis]+rotated[axis]).toBeCloseTo(w.centerM[axis],7);
     }
     expect(w.rotationYRad===0||w.rotationYRad===Math.PI).toBe(true);
   }
 });
 it('keeps rear suspension and upright explicitly absent, wheel-end present',()=>{
   expect(visibleInFourCornerPreview('P2_TYRE_SLICK_BODY','rear')).toBe(true);
   expect(visibleInFourCornerPreview('P2_BRAKE_ROTOR_DRILLED_CARBON','rear')).toBe(true);
   expect(visibleInFourCornerPreview('P2_CENTER_LOCK_NUT_BORE','rear')).toBe(true);
   expect(visibleInFourCornerPreview('P2_BEARING_INNER_RACE','rear')).toBe(true);
   expect(visibleInFourCornerPreview('P27_UPPER_A_ARM_FORGED','rear')).toBe(false);
   expect(visibleInFourCornerPreview('P2_UPRIGHT_BEARING_CARRIER','rear')).toBe(false);
   expect(visibleInFourCornerPreview('P27_UPPER_A_ARM_FORGED','front')).toBe(true);
 });
 it('rejects missing measured wheel and deliberately reports rear as proxy',()=>{
   const fit=originalMeasuredFixture();
   const report=wheelLayoutReport(fit);
   expect(report.mechanicalG2).toBe('HOLD');
   expect(report.genuineRearAssemblyAvailable).toBe(false);
   expect(report.corners.filter(x=>x.station==='rear')
       .every(x=>x.sourceStatus==='FRONT_WHEEL_END_PROXY_FOR_REAR')).toBe(true);
   fit.wheels.pop();
   expect(()=>layoutFourCorners(fit)).toThrow(/four-wheel/);
 });
 it('rejects wheel-mismatch rather than silently stretching original CAD',()=>{
   const fit=originalMeasuredFixture();
   fit.wheels[0].outerRadiusM=.48;
   expect(()=>layoutFourCorners(fit)).toThrow(/envelope/);
 });
});
