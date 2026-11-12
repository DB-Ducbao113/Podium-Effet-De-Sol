/** Analyze the actual canvas PNG, not DOM overlays or material metadata.
 * Dark canvas #080e18 is the renderer background, not evidence of a vehicle.
 * This only gates missing/blank/offscreen visuals; it does not prove CAD fit.
 */
import sharp from 'sharp';

const BACKGROUND=[8,14,24];
const THRESHOLD=18;
export async function analyzeModelBFrame(png){
 const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width<64||info.height<64||info.channels!==3)
  throw Error('Invalid Model B canvas PNG dimensions or channels');
 let foregroundPixels=0;
 let minX=info.width,minY=info.height,maxX=-1,maxY=-1;
 let luminanceSum=0;
 const stride=info.width*3;
 for(let y=0;y<info.height;y++){
  for(let x=0;x<info.width;x++){
   const index=y*stride+x*3;
   const r=data[index],g=data[index+1],b=data[index+2];
   luminanceSum+=.2126*r+.7152*g+.0722*b;
   const delta=Math.max(Math.abs(r-BACKGROUND[0]),
    Math.abs(g-BACKGROUND[1]),Math.abs(b-BACKGROUND[2]));
   if(delta<=THRESHOLD)continue;
   foregroundPixels++;
   if(x<minX)minX=x;
   if(x>maxX)maxX=x;
   if(y<minY)minY=y;
   if(y>maxY)maxY=y;
  }
 }
 const total=info.width*info.height;
 const bounds=foregroundPixels?{
  left:minX/info.width,top:minY/info.height,
  width:(maxX-minX+1)/info.width,height:(maxY-minY+1)/info.height,
 }:null;
 return {
  width:info.width,height:info.height,
  foregroundPixels,foregroundFraction:foregroundPixels/total,
  meanLuminance:luminanceSum/total,bounds,
 };
}
/** Reject completely blank or nearly invisible source-only screenshots.
 * Use a generous threshold because dark-carbon F1 liveries vary widely.
 */
export function assertModelBFrameVisible(audit,{finalFrame=false}={}){
 if(!audit.bounds||audit.foregroundFraction<.0025)
  throw Error('Original Model B not visibly rendered in the WebGL canvas');
 if(finalFrame&&(audit.bounds.width<.08||audit.bounds.height<.04))
  throw Error('Final full-car source bounds are too small/offscreen');
 return audit;
}
/** Pixel comparison detects chapter changes, beyond unique PNG file hashes. */
export async function modelBFrameDifference(pngA,pngB){
 const a=await sharp(pngA).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const b=await sharp(pngB).removeAlpha().raw().toBuffer({resolveWithObject:true});
 if(a.info.width!==b.info.width||a.info.height!==b.info.height||
    a.info.channels!==3||b.info.channels!==3)
  throw Error('Model B frame dimensions differ');
 let changed=0;
 const pixels=a.info.width*a.info.height;
 for(let i=0;i<a.data.length;i+=3){
  const delta=Math.abs(a.data[i]-b.data[i])+
   Math.abs(a.data[i+1]-b.data[i+1])+
   Math.abs(a.data[i+2]-b.data[i+2]);
  if(delta>42)changed++;
 }
 return changed/pixels;
}
