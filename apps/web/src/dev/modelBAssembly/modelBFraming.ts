/** Source-based perspective framing for the ORIGINAL Model B GLB.
 *
 * Uses 8 corners of the decoded owner car bounds, the actual calibrated shell
 * scale and real canvas aspect. No fabricated wheel hardpoints or geometry.
 * A perspective depth check (rather than an arbitrary mobile multiplier)
 * keeps the full source car inside the WebGL canvas even at 390px width.
 */
export type ModelBFramingBounds=readonly [
 readonly [number,number,number],
 readonly [number,number,number],
];
export type ModelBFrame={
 targetM:readonly [number,number,number];
 distanceM:number;
 cameraDirection:readonly [number,number,number];
 xFraction:number;
 yFraction:number;
 source:'OWNER_MODEL_B_GLB_BOUNDS';
 mechanicalMateCertified:false;
};
type Vec=[number,number,number];
const dot=(a:Vec,b:Vec)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec,b:Vec):Vec=>[
 a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0],
];
const norm=(v:Vec):Vec=>{
 const d=Math.hypot(...v);
 if(!Number.isFinite(d)||d<1e-8)throw Error('Invalid source camera orientation');
 return [v[0]/d,v[1]/d,v[2]/d];
};
export function frameOriginalModelB(
 bounds:ModelBFramingBounds,
 scale:number,
 canvasAspect:number,
 fovDeg=35,
 cameraDirection:readonly [number,number,number]=[.88,.44,1],
):ModelBFrame{
 if(!Number.isFinite(scale)||scale<=0||
    !Number.isFinite(canvasAspect)||canvasAspect<=.15||canvasAspect>6||
    !Number.isFinite(fovDeg)||fovDeg<15||fovDeg>90)
   throw Error('Invalid Model B original source frame inputs');
 const [lower,upper]=bounds;
 if([...lower,...upper].some(v=>!Number.isFinite(v))||
    upper.some((v,i)=>v<=lower[i]))
   throw Error('Invalid original owner Model B source bounds');
 const centre:Vec=[
   (lower[0]+upper[0])*scale/2,
   (lower[1]+upper[1])*scale/2,
   (lower[2]+upper[2])*scale/2,
 ];
 const dimensions=upper.map((v,i)=>(v-lower[i])*scale);
 if(dimensions[0]<3.5||dimensions[0]>7||
    dimensions[1]>3||dimensions[2]>3.4)
   throw Error('Unexpected owner Model B dimensions; no made-up camera fit');
 const eye=norm([...cameraDirection]);
 const right=norm(cross([0,1,0],eye));
 const up=norm(cross(eye,right));
 const tanY=Math.tan(fovDeg*Math.PI/360);
 const tanX=tanY*canvasAspect;
 // Leave room for text/UI. On narrow displays use extra lateral safety;
 // unlike 1.45× distance heuristics, this fits the source's actual width.
 const xFraction=canvasAspect<.85?.77:.84;
 const yFraction=canvasAspect<.85?.54:.80;
 let distance=0;
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
   const local:Vec=[
      (bounds[x][0]-centre[0]/scale)*scale,
      (bounds[y][1]-centre[1]/scale)*scale,
      (bounds[z][2]-centre[2]/scale)*scale,
   ];
   const depth=dot(local,eye);
   const rightOffset=Math.abs(dot(local,right));
   const upOffset=Math.abs(dot(local,up));
   distance=Math.max(distance,
     depth+rightOffset/(tanX*xFraction),
     depth+upOffset/(tanY*yFraction));
 }
 if(!Number.isFinite(distance)||distance<=0)
   throw Error('Original Model B perspective framing failed');
 return {
   targetM:centre,
   distanceM:Math.max(5,distance*1.075),
   cameraDirection:eye,
   xFraction,yFraction,
   source:'OWNER_MODEL_B_GLB_BOUNDS',
   mechanicalMateCertified:false,
 };
}
/** Analytic scene bounding-box projected screen fit, independent of browser
 * splash overlays. Useful to assert a full-car final view stays on-screen.
 */
export function originalModelBFitsFrame(
 bounds:ModelBFramingBounds,scale:number,
 aspect:number,fovDeg:number,frame:ModelBFrame,
):boolean {
 const [min,max]=bounds;
 const eye:Vec=[...frame.cameraDirection];
 const right=norm(cross([0,1,0],eye));
 const up=norm(cross(eye,right));
 const tx=Math.tan(fovDeg*Math.PI/360)*aspect;
 const ty=Math.tan(fovDeg*Math.PI/360);
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
   const d:Vec=[
    (x?max[0]:min[0])*scale-frame.targetM[0],
    (y?max[1]:min[1])*scale-frame.targetM[1],
    (z?max[2]:min[2])*scale-frame.targetM[2],
   ];
   const depth=frame.distanceM-dot(d,eye);
   if(depth<=.01||Math.abs(dot(d,right))/depth>tx*frame.xFraction||
      Math.abs(dot(d,up))/depth>ty*frame.yFraction)return false;
 }
 return true;
}
