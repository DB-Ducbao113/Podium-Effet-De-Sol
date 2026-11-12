/** P2.46 — progressively draw sampled vertices of authentic P2.8 CAD.
 *
 * The point geometry is allocated once by buildSourceCadVertexDots().
 * Each scroll frame changes BufferGeometry.drawRange only; it does NOT
 * allocate vertices, alter the source GLB, or generate substitute hardware.
 */
export type SourceCadDotFrame={
 drawCount:number;
 opacity:number;
 visible:boolean;
};

/** Early points emerge before the original solid's full material reveal.
 * The animation reaches every sampled CAD vertex by assembly fraction .64,
 * then the existing opaque source part takes over as its dot alpha fades.
 */
export function sourceCadDotFrame(
 sampledVertexCount:number,
 assemblyFraction:number,
 desiredOpacity:number,
):SourceCadDotFrame{
 if(!Number.isSafeInteger(sampledVertexCount)||sampledVertexCount<1||
    sampledVertexCount>30000||
    !Number.isFinite(assemblyFraction)||assemblyFraction<0||
    assemblyFraction>1||
    !Number.isFinite(desiredOpacity)||desiredOpacity<0||
    desiredOpacity>1)
  throw Error('Invalid original source CAD progressive dot frame');
 const t=Math.min(1,assemblyFraction/.64);
 const ease=t*t*(3-2*t);
 const drawCount=assemblyFraction===0?0:
  Math.min(sampledVertexCount,Math.ceil(sampledVertexCount*ease));
 return {
  drawCount,
  opacity:desiredOpacity,
  visible:drawCount>0&&desiredOpacity>.005,
 };
}

/** Do not update a GPU draw range unless progress actually changed.
 * This can be reused in regular frames, reverse scrolling, StrictMode and
 * source reloads without creating another BufferAttribute or Three.js mesh.
 */
export function updateSourceCadDotRange(
 geometry:{drawRange:{start:number;count:number};
   setDrawRange:(start:number,count:number)=>void},
 drawCount:number,
):boolean{
 if(!Number.isSafeInteger(drawCount)||drawCount<0||
    drawCount>30000)
  throw Error('Invalid original source CAD dot range');
 if(geometry.drawRange.start===0&&geometry.drawRange.count===drawCount)
  return false;
 geometry.setDrawRange(0,drawCount);
 return true;
}
