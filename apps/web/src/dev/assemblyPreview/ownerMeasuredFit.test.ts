import {describe,expect,it} from 'vitest';
import {fitOwnerShellToOriginalP28} from './ownerMeasuredFit';
import type {SourceGeometryProbe} from './geometryProbe';

function fixtures() {
  const pts: [number,number,number][]=[];
  const front=[7.43,-1.075,5.077],rear=[-11.45,-1.12,5.74];
  for(const [base,side] of [[rear,-1],[rear,1],[front,-1],[front,1]] as const){
    const x=base[0]+(side===-1?-.02:0),y=base[1],z=(Math.abs(base[2]))*side;
    for(let i=0;i<900;i++){
      const theta=i*2*Math.PI/900;
      // Same visible wheel shoulder radius as original source, and hub spokes.
      pts.push([x+1.9*Math.cos(theta),y+1.9*Math.sin(theta),z+(i%17)/200]);
    }
    for(let i=0;i<900;i++){
      const theta=i*2*Math.PI/900;
      pts.push([x+.23*Math.cos(theta),y+.23*Math.sin(theta),z+(i%17)/200]);
    }
  }
  const shell={
    schema:'podium-eds.geometry-probe.v1',source:'model-b',unit:'m',
    vertexCount:176883,triangleCount:10000,meshCount:13,
    sourceBoundsM:[[-13.523,-3.1138,-5.5498],[14.2696,2.7565,5.9779]],
    subassemblies:{},sampledVerticesM:pts,samplingStride:7,sampleLimit:28000,visualOnly:true,
  } as SourceGeometryProbe;
  const corner={
    ...shell,source:'p28',meshCount:59,
    subassemblies:{P2_TYRE_SLICK_BODY:{
      vertexCount:1718,
      sourceBoundsM:[[-.332,-.332,-.157],[.332,.332,.157]]
    }}
  } as SourceGeometryProbe;
  return {shell,corner};
}
describe('original Model B showroom unit recovery from actual tyre geometry',()=>{
 it('keeps P2.8 CAD at exact 1:1 scale and locates front +Z wheel',()=>{
   const {shell,corner}=fixtures();
   const result=fitOwnerShellToOriginalP28(shell,corner);
   expect(result.p28Scale).toBe(1);
   expect(result.normalizedShellScale).toBeGreaterThan(.16);
   expect(result.normalizedShellScale).toBeLessThan(.19);
   expect(result.wheels).toHaveLength(4);
   expect(result.frontPositiveZCenterM[0]).toBeGreaterThan(1);
   expect(result.frontPositiveZCenterM[2]).toBeGreaterThan(.7);
   expect(result.mechanicalFitCertified).toBe(false);
   expect(result.axleSpacingPreviewM).toBeGreaterThan(3);
 });
 it('rejects source GLB with unexpected dimensions',()=>{
   const {shell,corner}=fixtures();
   shell.sourceBoundsM[1][0]=120;
   expect(()=>fitOwnerShellToOriginalP28(shell,corner)).toThrow(/fingerprint/);
 });
 it('rejects fake 58-part P2.8',()=>{
   const {shell,corner}=fixtures();corner.meshCount=58;
   expect(()=>fitOwnerShellToOriginalP28(shell,corner)).toThrow(/59-part/);
 });
 it('rejects altered CAD tyre radius',()=>{
   const {shell,corner}=fixtures();
   corner.subassemblies.P2_TYRE_SLICK_BODY.sourceBoundsM[1][0]=.7;
   expect(()=>fitOwnerShellToOriginalP28(shell,corner)).toThrow(/geometry changed/);
 });
});
