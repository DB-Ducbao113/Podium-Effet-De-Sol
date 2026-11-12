/** P2.41 — source-only CAD X-ray compositing.
 *
 * Transparency alone cannot reveal a source bolt occluded by opaque body
 * triangles: transparent shell materials still depth-test by default.
 *
 * Move ONLY the real selected source mesh to a late transparent render queue
 * and temporarily disable its viewer-cloned material depth test. Restore the
 * exact source mesh renderOrder/material depthTest on clear or source change.
 *
 * These are renderer state overrides. The original GLB topology, vertices,
 * source material bytes and final source transforms remain unmodified.
 */
export type SourceCadRenderLayer={
 depthTest:boolean;
 renderOrder:number;
};

export const SOURCE_CAD_XRAY_RENDER_ORDER=1000;

/** No global depth buffer override: this affects just the selected real CAD
 * part, not its sibling meshes, tyres or original Formula 1 body.
 */
export function sourceCadXrayRenderLayer(
 inspecting:boolean,
 selected:boolean,
 originalDepthTest:boolean,
 originalRenderOrder:number,
):SourceCadRenderLayer{
 if(typeof originalDepthTest!=='boolean'||
    !Number.isSafeInteger(originalRenderOrder)||
    originalRenderOrder<0||originalRenderOrder===Number.MAX_SAFE_INTEGER)
  throw Error('Invalid original CAD viewer render-layer state');
 if(!inspecting||!selected)
  return {depthTest:originalDepthTest,renderOrder:originalRenderOrder};
 return {depthTest:false,
   renderOrder:Math.max(SOURCE_CAD_XRAY_RENDER_ORDER,originalRenderOrder+1)};
}

/** The UI may only advertise verified X-ray after a real R3F useFrame
 * applies the selected source CAD compositing state to the actual materials.
 * A valid manifest, selected source ID or camera target alone is not enough.
 */
export function sourceCadXrayFrameVerified(
 visible:boolean,renderOrder:number,
 materials:readonly {
   depthTest:boolean;
   depthWrite:boolean;
   opacity:number;
 }[],
):boolean{
 return visible&&renderOrder>=SOURCE_CAD_XRAY_RENDER_ORDER&&
   materials.length>0&&
   materials.every(m=>!m.depthTest&&m.depthWrite&&
     Number.isFinite(m.opacity)&&m.opacity>=.99&&m.opacity<=1);
}
