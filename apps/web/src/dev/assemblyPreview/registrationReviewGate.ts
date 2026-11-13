import type { RegistrationResult } from './assemblyRegistration';

/**
 * Project visual-preview tolerance, not a manufacturer clearance allowance.
 * This gate never certifies a physical CAD mate.
 */
export const VISUAL_REGISTRATION_LIMIT_M=0.005;

function finiteTriplet(value:unknown):value is [number,number,number] {
  return Array.isArray(value)&&value.length===3&&
    value.every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=10000);
}
function unitQuaternion(value:unknown):boolean {
  if(!Array.isArray(value)||value.length!==4||
     !value.every(x=>typeof x==='number'&&Number.isFinite(x)))return false;
  const n2=value.reduce((sum:number,v:number)=>sum+v*v,0);
  return Math.abs(n2-1)<=1e-4;
}

/** Refuse malformed or out-of-budget registrations BEFORE enabling overlay. */
export function assertVisualRegistrationReview(result:RegistrationResult):void {
  if(result.validatedForMechanicalFit!==false||
     !finiteTriplet(result.translationM)||
     !unitQuaternion(result.rotationQuaternion)||
     !Array.isArray(result.anchorResidualM)||
     result.anchorResidualM.length<3||
     result.anchorResidualM.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0)||
     !Number.isFinite(result.maxResidualM)||result.maxResidualM<0||
     !Number.isFinite(result.lengthMismatchM)||result.lengthMismatchM<0||
     Math.abs(Math.max(...result.anchorResidualM)-result.maxResidualM)>1e-8){
    throw Error('Invalid rigid registration diagnostics; visual overlay denied');
  }
  if(result.maxResidualM>VISUAL_REGISTRATION_LIMIT_M||
     result.lengthMismatchM>VISUAL_REGISTRATION_LIMIT_M){
    throw Error('Rigid registration exceeds 5 mm visual review threshold; never scale original CAD');
  }
}
