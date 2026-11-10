import {describe,expect,it} from 'vitest';
import {isEngineeringCadReviewPath} from './documentIntroState';

describe('Original Model B engineering CAD direct load has no global splash overlay',()=>{
 it('opens DEV engineering sources directly on real 3D model',()=>{
   expect(isEngineeringCadReviewPath('/engineering/model-b-build')).toBe(true);
   expect(isEngineeringCadReviewPath('/engineering/assembly-preview')).toBe(true);
 });
 it('keeps normal user-facing opening animation outside engineering review',()=>{
   expect(isEngineeringCadReviewPath('/')).toBe(false);
   expect(isEngineeringCadReviewPath('/showroom')).toBe(false);
   expect(isEngineeringCadReviewPath('/engineering')).toBe(false);
   expect(isEngineeringCadReviewPath('/engineering/model-b-build-other')).toBe(false);
 });
});
