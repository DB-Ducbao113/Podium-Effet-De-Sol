import {describe,expect,it} from 'vitest';
import type { RegistrationResult } from './assemblyRegistration';
import {assertVisualRegistrationReview,VISUAL_REGISTRATION_LIMIT_M} from './registrationReviewGate';

const valid=():RegistrationResult=>({
  translationM:[1,2,3],
  rotationQuaternion:[0,0,0,1],
  anchorResidualM:[.001,.002,.003],
  maxResidualM:.003,
  lengthMismatchM:.004,
  validatedForMechanicalFit:false,
});

describe('P2.54 fail-closed 5 mm preview gate',()=>{
  it('accepts an internally consistent sub-threshold visual pose only',()=>{
    expect(VISUAL_REGISTRATION_LIMIT_M).toBe(.005);
    expect(()=>assertVisualRegistrationReview(valid())).not.toThrow();
    expect(valid().validatedForMechanicalFit).toBe(false);
  });
  it('rejects an over-limit fit residual after least-squares outlier distribution',()=>{
    const r=valid();r.anchorResidualM[2]=.006;r.maxResidualM=.006;
    expect(()=>assertVisualRegistrationReview(r)).toThrow(/exceeds 5 mm/);
  });
  it('rejects an over-limit pairwise length mismatch independently of residual',()=>{
    const r=valid();r.lengthMismatchM=.22;
    expect(()=>assertVisualRegistrationReview(r)).toThrow(/exceeds 5 mm/);
  });
  it('rejects stale or contradictory max residual diagnostics',()=>{
    const r=valid();r.maxResidualM=0;
    expect(()=>assertVisualRegistrationReview(r)).toThrow(/Invalid rigid/);
  });
  it('rejects a non-finite diagnostic rather than allowing NaN comparison to pass',()=>{
    const r=valid();r.lengthMismatchM=Number.NaN;
    expect(()=>assertVisualRegistrationReview(r)).toThrow(/Invalid rigid/);
    const other=valid();other.anchorResidualM[1]=Infinity;
    expect(()=>assertVisualRegistrationReview(other)).toThrow(/Invalid rigid/);
  });
  it('rejects non-unit quaternion or invalid translation despite small residuals',()=>{
    const q=valid();q.rotationQuaternion=[0,0,0,0];
    expect(()=>assertVisualRegistrationReview(q)).toThrow(/Invalid rigid/);
    const p=valid();p.translationM=[Number.NaN,0,0];
    expect(()=>assertVisualRegistrationReview(p)).toThrow(/Invalid rigid/);
  });
  it('cannot certify a mechanical fit via a forged result flag',()=>{
    const r=valid();(r as {validatedForMechanicalFit:boolean}).validatedForMechanicalFit=true;
    expect(()=>assertVisualRegistrationReview(r)).toThrow(/Invalid rigid/);
  });
});
