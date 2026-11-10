import { classifyP28Part, type PartSystem } from '../assemblyPreview/cadPresentation';

export type AssemblyChapterId = 'reveal'|'cutaway'|'wheel-core'|'four-wheels'|'rear-joints'|'final';
export type AssemblyChapter = {
  id:AssemblyChapterId;
  start:number;
  end:number;
  number:string;
  eyebrow:string;
  title:string;
  description:string;
  evidence:string;
};

export const MODEL_B_CHAPTERS:readonly AssemblyChapter[] = [
  {id:'reveal',start:0,end:.15,number:'00',eyebrow:'THE ORIGINAL / MODEL B',
   title:'THE MACHINE.',description:'The owner-authored Model B exterior, presented without substitutions.',
   evidence:'ORIGINAL MODEL B SHOWROOM GLB'},
  {id:'cutaway',start:.15,end:.30,number:'01',eyebrow:'DESIGN / INSIDE THE MACHINE',
   title:'EVERY LAYER.',description:'Non-destructive exterior separation reveals the engineering source beneath.',
   evidence:'ILLUSTRATIVE BODY EXPLOSION — NOT PHYSICAL CAD DISASSEMBLY'},
  {id:'wheel-core',start:.30,end:.50,number:'02',eyebrow:'P2.8 / HARDWARE FIRST',
   title:'BUILT FROM THE CORE.',description:'Original fasteners, bearings, uprights, brakes and hubs return to their authored wheel positions.',
   evidence:'REAL 59-MESH FRONT-CORNER SOURCE REQUIRED'},
  {id:'four-wheels',start:.50,end:.69,number:'03',eyebrow:'FOUR MEASURED WHEEL STATIONS',
   title:'FOUR CORNERS.',description:'Slicks, rims and brakes assemble at four measured Model B wheel centres.',
   evidence:'REAR WHEEL ENDS ARE FRONT-SOURCE VISUAL PROXIES'},
  {id:'rear-joints',start:.69,end:.85,number:'04',eyebrow:'P2.12 + P2.14 / REAR LINKAGE',
   title:'THE DETAILS LOCK IN.',description:'Source toe adjusters and split spherical races move into the rear-wheel preview.',
   evidence:'STATIC CAD PROPOSALS — MECHANICAL G2 HOLD'},
  {id:'final',start:.85,end:1.000001,number:'05',eyebrow:'THE COMPLETE EXTERIOR',
   title:'MODEL B. REASSEMBLED.',description:'The original vehicle returns to a complete exterior presentation.',
   evidence:'VISUAL REASSEMBLY / NOT A CERTIFIED PHYSICAL MATE'},
] as const;

export const clamp01=(v:number):number=>Number.isFinite(v)?Math.min(1,Math.max(0,v)):0;
export function smoothStep(start:number,end:number,value:number):number{
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)
    throw Error('A cinematic transition requires increasing finite endpoints');
  const p=clamp01((value-start)/(end-start));
  return p*p*(3-2*p);
}
export function chapterAt(progress:number):AssemblyChapter{
  const p=clamp01(progress);
  return MODEL_B_CHAPTERS.find(chapter=>p>=chapter.start&&p<chapter.end) ??
    MODEL_B_CHAPTERS[MODEL_B_CHAPTERS.length-1];
}
export function visualShellOpacity(progress:number,hasCornerCad:boolean):number{
  const p=clamp01(progress);
  if(!hasCornerCad)return 1;
  // The previous 13% shell opacity made the actual owner F1 virtually
  // disappear for three chapters. Retain its silhouette while source
  // wheel components enter and restore full opacity at final assembly.
  const off=smoothStep(.15,.28,p);
  const back=smoothStep(.70,.88,p);
  return 1-.22*off*(1-back);
}
export function exteriorSeparation(progress:number,hasCornerCad:boolean):number{
  if(!hasCornerCad)return 0;
  const p=clamp01(progress);
  // Architectural disclosure only. Large fake body explosions made the
  // authentic F1 vanish into scattered dark meshes; use a short controlled
  // 18% separation early in the engineering reveal, then return to source.
  return .18*smoothStep(.15,.28,p)*(1-smoothStep(.31,.50,p));
}
export type P28BuildSystem='hardware'|'bearing'|'upright'|'suspension'|'hub'|
  'carbon-brake'|'friction-pad'|'caliper'|'rim'|'tyre'|'other';
const WINDOWS:Record<P28BuildSystem,readonly [number,number]>={
  // Demonstrable source-mesh order. Hold completed inner parts while outer
  // layers arrive: upright -> bearing/structure -> hub -> carbon rotor ->
  // fastening -> brake hardware -> rim -> slick. This is not a verified
  // constrained mechanical insertion/torque procedure.
  upright:[.29,.40],suspension:[.34,.45],bearing:[.36,.47],
  hub:[.41,.52],'carbon-brake':[.45,.56],
  hardware:[.43,.62],'friction-pad':[.50,.60],caliper:[.52,.63],
  rim:[.60,.70],tyre:[.67,.78],other:[.37,.53],
};
export function stablePartOffset(name:string):number{
  let hash=2166136261>>>0;
  for(let i=0;i<name.length;i++)hash=Math.imul(hash^name.charCodeAt(i),16777619)>>>0;
  return (hash%13)/1000;
}
export function originalPartAssembly(name:string,progress:number):number{
  const category=classifyP28Part(name) as PartSystem;
  const [start,end]=WINDOWS[category]??WINDOWS.other;
  const stagger=stablePartOffset(name);
  return smoothStep(start+stagger,end+stagger,clamp01(progress));
}
export function rearSourceAssembly(progress:number,kind:'toe'|'joint',partName:string):number{
  const stagger=stablePartOffset(partName);
  return kind==='toe'
    ?smoothStep(.68+stagger,.79+stagger,clamp01(progress))
    :smoothStep(.73+stagger,.84+stagger,clamp01(progress));
}
export function wheelOffset(name:string,station:'front'|'rear'):[number,number,number]{
  const system=classifyP28Part(name);
  const side=station==='front'?1:-1;
  const offsets:Record<PartSystem,[number,number,number]>={
    // Local offsets are visual reveal distances, never fabricated source
    // hardpoints. Keep all parts near their true source final transforms.
    tyre:[.03,.24,.20*side],rim:[-.04,.17,.15*side],
    'carbon-brake':[-.02,.10,.12*side],
    caliper:[.11,-.05,.10*side],
    'friction-pad':[.09,-.05,.12*side],
    bearing:[-.08,.04,.12*side],
    hardware:[-.06,.015,.17*side],
    suspension:[-.16,-.08,-.13*side],
    upright:[-.12,-.04,.08*side],
    hub:[-.09,.04,.11*side],
    other:[-.08,.06,.08*side],
  };
  return offsets[system];
}
/** Shared source transform convention with the original four-corner reviewer.
 * Never reflect right-handed fasteners across the Z axis.
 */
export const sourceMateStatus='VISUAL_SOURCE_REGISTRATION_ONLY_G2_HOLD' as const;
