import type {WheelId} from '../assemblyPreview/fourCornerLayout';
import {classifyP28Part} from '../assemblyPreview/cadPresentation';

export const SOURCE_CAD_HARDWARE_DOT_LIMIT_PER_WHEEL=6;
export const SOURCE_CAD_HARDWARE_DOT_BUDGET=256;
export const SOURCE_CAD_TYRE_DOT_BUDGET=1100;
export const MAX_SOURCE_CAD_BUILD_DOT_SAMPLES=
 4*(SOURCE_CAD_TYRE_DOT_BUDGET+
    SOURCE_CAD_HARDWARE_DOT_LIMIT_PER_WHEEL*SOURCE_CAD_HARDWARE_DOT_BUDGET);

const STATIONS:readonly WheelId[]=[
 'front-positive-z','front-negative-z',
 'rear-positive-z','rear-negative-z',
];

/** Pick only authenticated P2.8 hardware already mounted at real Model B
 * wheel positions. Stable part-ID order and a strict per-station quota prevent
 * creating every-bolt draw calls in a dense source CAD model.
 *
 * No model names, bolt meshes or coordinates are generated here.
 */
export function selectNativeHardwareDotParts<
 T extends {station:WheelId;kind:'p28'|'rear-toe'|'joint';name:string}
>(parts:readonly T[]):T[]{
 const selected:T[]=[];
 for(const station of STATIONS){
  const originals=parts.filter(item=>item.station===station&&
    item.kind==='p28'&&classifyP28Part(item.name)==='hardware');
  const names=new Set<string>();
  for(const part of originals){
   if(!part.name||names.has(part.name))
    throw Error('Duplicate/empty authentic P2.8 hardware source ID');
   names.add(part.name);
  }
  originals.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  selected.push(...originals.slice(0,SOURCE_CAD_HARDWARE_DOT_LIMIT_PER_WHEEL));
 }
 return selected;
}

/** Strictly bounded point budget across 4 genuine tyres and a maximum
 * 24 original P2.8 hardware overlays. Counts are sampled source vertices,
 * not newly designed fasteners.
 */
export function validateNativeCadDotsBudget(
 layers:readonly {sampleCount:number}[],
):number{
 if(layers.length>4*(1+SOURCE_CAD_HARDWARE_DOT_LIMIT_PER_WHEEL))
  throw Error('Original CAD vertex-dot overlay draw budget exceeded');
 let sum=0;
 for(const layer of layers){
  if(!Number.isSafeInteger(layer.sampleCount)||
     layer.sampleCount<1||
     layer.sampleCount>SOURCE_CAD_TYRE_DOT_BUDGET)
   throw Error('Invalid authentic CAD sampled vertex count');
  sum+=layer.sampleCount;
 }
 if(sum>MAX_SOURCE_CAD_BUILD_DOT_SAMPLES)
  throw Error('Original CAD vertex-dot overlay sample budget exceeded');
 return sum;
}
