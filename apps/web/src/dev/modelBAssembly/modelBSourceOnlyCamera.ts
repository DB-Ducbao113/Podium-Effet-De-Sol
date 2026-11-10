/** Camera choreography of the EXACT committed Model B showroom GLB.
 *
 * This source-only stage is usable BEFORE private P2.8 59-part source has
 * been rebuilt. All focal points are derived from the original decoded
 * Model B geometry bounds; none are invented chassis/wheel hardpoints.
 *
 * It does NOT animate fictional wheel-end parts or claim an assembly mate.
 */
export type ShowroomBounds=readonly [
  readonly [number,number,number],
  readonly [number,number,number]
];
export type ShowroomCameraPose={
 targetM:readonly [number,number,number];
 distanceM:number;
 orbit:number;
 geometrySource:'OWNER_MODEL_B_GLTF_BOUNDS';
 rearMechanicalMateCertified:false;
};
const finite=(v:number)=>Number.isFinite(v);
const smooth=(a:number,b:number,v:number)=>{
 const u=Math.max(0,Math.min(1,(v-a)/(b-a)));
 return u*u*(3-2*u);
};
export function sourceOnlyModelBCamera(
 bounds:ShowroomBounds,
 scale:number,
 progress:number,
 aspectRatio=16/9,
):ShowroomCameraPose {
 if(!finite(scale)||scale<=0||scale>2||
    !finite(progress)||!finite(aspectRatio)||aspectRatio<=0)
   throw Error('Original owner Model B source camera arguments invalid');
 const [lower,upper]=bounds;
 if([...lower,...upper].some(v=>!finite(v))||
    upper.some((v,i)=>v<=lower[i]))
   throw Error('Original owner Model B geometry bounds invalid');
 const cx=(lower[0]+upper[0])/2*scale;
 const cy=(lower[1]+upper[1])/2*scale;
 const cz=(lower[2]+upper[2])/2*scale;
 const spanX=(upper[0]-lower[0])*scale;
 const spanY=(upper[1]-lower[1])*scale;
 const spanZ=(upper[2]-lower[2])*scale;
 // The measured original Model B bounding box has its longitudinal
 // direction on X (27.7926 original source units before calibrated scale).
 // For a different original model, fail rather than guess the vehicle axis.
 if(spanX<=spanZ||spanX<=spanY||spanX<2||spanX>10)
   throw Error('Unexpected original Model B long-axis source fingerprint');
 const p=Math.min(1,Math.max(0,progress));
 let offsetX=0;
 let offsetY=.08*spanY;
 let distance=spanX*1.88;
 let orbit:number;
 if(p<.15){
   // Source-only full car reveal.
   orbit=.07+smooth(0,.15,p)*.25;
 }else if(p<.30){
   // Original body panels and genuine cockpit: camera exploration only.
   offsetX=spanX*.09;
   offsetY=spanY*.12;
   distance=spanX*.91;
   orbit=.38;
 }else if(p<.50){
   // Original front-car exterior detail, not a claimed P2.8 hardpoint.
   offsetX=spanX*.28;
   distance=spanX*.64;
   orbit=.25;
 }else if(p<.69){
   // Real Model B exterior across its full original wheelbase.
   offsetX=spanX*.02;
   distance=spanX*1.52;
   orbit=-.23;
 }else if(p<.85){
   // Original rear-car exterior detail; no imaginary suspension.
   offsetX=-spanX*.28;
   distance=spanX*.65;
   orbit=-.40;
 }else{
   // Full original Model B: return source geometry to whole-car view.
   distance=spanX*1.77;
   orbit=.16;
 }
 if(aspectRatio<.8)distance*=1.42;
 return {
   targetM:[cx+offsetX,cy+offsetY,cz],
   distanceM:distance,
   orbit,
   geometrySource:'OWNER_MODEL_B_GLTF_BOUNDS',
   rearMechanicalMateCertified:false,
 };
}
