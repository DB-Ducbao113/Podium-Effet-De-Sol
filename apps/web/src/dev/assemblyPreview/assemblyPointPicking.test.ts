import {describe,expect,it} from 'vitest';
import {canonicalPickedPointM} from './assemblyPointPicking';

describe('P2.52 owner source point-picking coordinate contract',()=>{
  it('converts Model B native showroom units into root-local metres once',()=>{
    const original:[number,number,number]=[10,-2,5];
    expect(canonicalPickedPointM('modelb',original,.18,'assembled'))
      .toEqual([1.7999999999999998,-.36,.8999999999999999]);
    // Neither the original point nor Model B source geometry can be mutated.
    expect(original).toEqual([10,-2,5]);
  });
  it('preserves native 1:1 CAD metric coordinates with a new immutable tuple',()=>{
    const original:[number,number,number]=[.2,-.03,.11];
    const actual=canonicalPickedPointM('p28',original,.18,'assembled');
    expect(actual).toEqual(original);
    expect(actual).not.toBe(original);
  });
  it('permits hidden-tyre/cutaway display that does not translate CAD geometry',()=>{
    expect(canonicalPickedPointM('p28',[.11,.12,.13],.18,'tyre-hidden'))
      .toEqual([.11,.12,.13]);
    expect(canonicalPickedPointM('p28',[.11,.12,.13],.18,'mechanism-core'))
      .toEqual([.11,.12,.13]);
  });
  it('refuses points on temporarily exploded CAD part positions',()=>{
    expect(()=>canonicalPickedPointM('p28',[0,0,0],.18,'exploded'))
      .toThrow(/unshifted presentation/);
  });
  it('blocks uncalibrated or invalid Model B source scale',()=>{
    for(const scale of [null,0,-.18,Infinity,NaN,2])
      expect(()=>canonicalPickedPointM('modelb',[1,2,3],scale,'assembled'))
        .toThrow(/calibration is required/);
  });
  it('rejects nonfinite or unreasonable source-space points before saving',()=>{
    expect(()=>canonicalPickedPointM('p28',[NaN,0,0],.18,'assembled'))
      .toThrow(/Invalid source-local/);
    expect(()=>canonicalPickedPointM('modelb',[1e10,0,0],.18,'assembled'))
      .toThrow(/Invalid source-local/);
  });
});
