/** P2.35C: preserve every original Model B material channel independently.
 * The owner GLB may use multiple materials per mesh (glass, paint, decals).
 */
export type SourceMaterialState={
 opacity:number;
 depthWrite:boolean;
};
export function sourceMaterialFrame(
 source:SourceMaterialState,
 shellOpacity:number,
):SourceMaterialState{
 if(!Number.isFinite(source.opacity)||source.opacity<0||source.opacity>1)
  throw Error('Invalid original Model B material opacity');
 if(!Number.isFinite(shellOpacity))
  throw Error('Invalid shell opacity');
 const fraction=Math.max(0,Math.min(1,shellOpacity));
 return {
  opacity:source.opacity*fraction,
  depthWrite:source.depthWrite&&fraction>.92,
 };
}
