import { describe, it, expect } from 'vitest';
import { checkedPlacement, centerOffset, initialStagingPosition, INITIAL_PLACEMENT } from './assemblyPlacement';
describe('owner Model B + original P2.8 staging contract',()=>{
 it('never pre-scales or pre-mates donated CAD',()=>expect(INITIAL_PLACEMENT).toEqual({
   translationM:[0,0,0],rotationDeg:[0,0,0],displayedAtBodyCenter:false
 }));
 it('stages corner outside body box',()=>expect(initialStagingPosition([-2,-1,-.7],[2,1,.7],[-.4,-.3,-.3])[0]).toBeCloseTo(3));
 it('rejects reversed body bounds before computing an unsafe staging offset',()=>{
   expect(()=>initialStagingPosition([2,-1,-1],[1,1,1],[-.4,-.3,-.3])).toThrow('Invalid preview bounds');
   expect(()=>initialStagingPosition([-1,-1,-1],[1,1,1],[Infinity,0,0])).toThrow('Invalid preview bounds');
 });
 it('returns independent tuples so later edits cannot mutate a validated placement',()=>{
   const raw={displayedAtBodyCenter:false,translationM:[1,2,3] as [number,number,number],rotationDeg:[0,90,0] as [number,number,number]};
   const checked=checkedPlacement(raw);
   raw.translationM[0]=9;
   raw.rotationDeg[1]=180;
   expect(checked.translationM).toEqual([1,2,3]);
   expect(checked.rotationDeg).toEqual([0,90,0]);
 });
 it('provides graphic-center offset, not a certified hardpoint',()=>expect(centerOffset([3,2,1],[1,1,1])).toEqual([2,1,0]));
 it('rejects invalid placement',()=>expect(()=>checkedPlacement({...INITIAL_PLACEMENT,translationM:[NaN,0,0]})).toThrow());
 it('leaves manual coordinates and rotations unchanged',()=>expect(checkedPlacement({
   displayedAtBodyCenter:true,translationM:[1,.25,-.3],rotationDeg:[0,90,180]
 })).toEqual({displayedAtBodyCenter:true,translationM:[1,.25,-.3],rotationDeg:[0,90,180]}));
});
