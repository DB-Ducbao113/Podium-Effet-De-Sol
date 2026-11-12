/** P2.39: presentation-only X-ray inspection of a REAL imported CAD mesh.
 * Source geometry and original part transformations remain untouched.
 */
const clamp=(value:number):number=>
 Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;

export type CadInspectionVisualFrame={
 opacity:number;
 depthWrite:boolean;
 visible:boolean;
};

/** Normal assembly remains unchanged until a real source part is selected.
 * All nonselected parts keep their *authored* scroll placement, but dim.
 */
export function cadInspectionVisualFrame(
 authoredFraction:number,inspecting:boolean,selected:boolean,
):CadInspectionVisualFrame{
 const fraction=clamp(authoredFraction);
 if(!inspecting)
  return {opacity:Math.min(1,fraction*3),depthWrite:fraction>.94,
   visible:fraction>.008};
 if(selected)
  return {opacity:1,depthWrite:true,visible:true};
 return {opacity:Math.min(.08,fraction*3),depthWrite:false,
  visible:fraction>.008};
}

/** Keep the source F1 silhouette for context but let the real CAD part
 * remain visible through body panels when inspection mode is active.
 */
export function cadInspectionShellAlpha(
 originalShellAlpha:number,inspecting:boolean,
):number{
 const baseline=clamp(originalShellAlpha);
 return inspecting?Math.min(.14,baseline):baseline;
}

/** Selected original CAD mesh comes to its native final source pose without
 * requiring the viewer to finish a smooth chapter scroll first.
 */
export function cadInspectionAssemblyFraction(
 authoredFraction:number,inspecting:boolean,selected:boolean,
):number{
 return inspecting&&selected?1:clamp(authoredFraction);
}
