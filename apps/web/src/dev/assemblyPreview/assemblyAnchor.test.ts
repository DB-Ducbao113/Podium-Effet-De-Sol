import {describe,expect,it} from 'vitest';
import {anchoredSourceTranslation,rotatePointByQuaternion} from './assemblyAnchor';

const close3=(actual:[number,number,number],expected:[number,number,number])=>
  actual.forEach((v,i)=>expect(v).toBeCloseTo(expected[i],10));

describe('P2.53 P2.8 rigid overlay anchor invariants',()=>{
  const identity:[number,number,number,number]=[0,0,0,1];
  const z90:[number,number,number,number]=[0,0,Math.SQRT1_2,Math.SQRT1_2];

  it('matches the unrotated anchor translation exactly',()=>{
    close3(anchoredSourceTranslation([2,.3,1],[.3,0,-.15],identity,[0,0,0]),
      [1.7,.3,1.15]);
  });
  it('locks a non-origin wheel center in place while the assembly rotates 90 degrees',()=>{
    const source:[number,number,number]=[.3,0,-.15];
    const target:[number,number,number]=[2,.3,1];
    const offset:[number,number,number]=[.01,.02,.03];
    const translation=anchoredSourceTranslation(target,source,z90,offset);
    const rotated=rotatePointByQuaternion(source,z90);
    close3(rotated.map((v,i)=>v+translation[i]) as [number,number,number],
      target.map((v,i)=>v+offset[i]) as [number,number,number]);
  });
  it('handles 180-degree source rotations without mirroring',()=>{
    close3(rotatePointByQuaternion([.3,.2,-.15],[1,0,0,0]),[.3,-.2,.15]);
  });
  it('never mutates CAD wheel coordinates',()=>{
    const original:[number,number,number]=[.3,0,-.15];
    anchoredSourceTranslation([2,.3,1],original,z90,[0,0,0]);
    expect(original).toEqual([.3,0,-.15]);
  });
  it('rejects nonunit or nonfinite rotation quaternions',()=>{
    for(const q of [[0,0,0,0],[Infinity,0,0,0],[0,0,0,1.1]] as [number,number,number,number][])
      expect(()=>anchoredSourceTranslation([0,0,0],[1,0,0],q,[0,0,0]))
        .toThrow(/quaternion/);
  });
  it('rejects invalid source anchors and manual offsets',()=>{
    expect(()=>anchoredSourceTranslation([0,0,0],[NaN,0,0],identity,[0,0,0]))
      .toThrow(/coordinate/);
    expect(()=>anchoredSourceTranslation([0,0,0],[0,0,0],identity,[Infinity,0,0]))
      .toThrow(/coordinate/);
  });
});
