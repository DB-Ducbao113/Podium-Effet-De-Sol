/** P2.35B: mesh-specific visual disassembly timing for original Model B.
 * The input mesh name is metadata from the verified owner GLB, never a synthetic part.
 */
const clamp=(v:number):number=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const smooth=(start:number,end:number,p:number):number=>{
 const t=clamp((p-start)/(end-start));
 return t*t*(3-2*t);
};
/** Stable name-based phase. No randomness or frame-to-frame mutation. */
export function sourceBodyMeshPhase(name:string):number{
 let hash=2166136261>>>0;
 for(let i=0;i<name.length;i++)
  hash=Math.imul(hash^name.charCodeAt(i),16777619)>>>0;
 return (hash%31)/30;
}
/** Zero at both ends: all original mesh transforms are fully restored. */
export function sourceBodyMeshSeparation(progress:number,name:string):number{
 const p=clamp(progress);
 const phase=sourceBodyMeshPhase(name);
 const outbound=smooth(.12+.10*phase,.27+.10*phase,p);
 const inbound=1-smooth(.60+.08*phase,.76+.08*phase,p);
 return .70*outbound*inbound;
}
