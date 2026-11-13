/**
 * Model B full-car visual story, NOT a full-car mechanical CAD assembly.
 * Chapters follow the source-first 2026 storyboard; status is never inferred
 * from the presence of generic showroom exterior meshes.
 */
export type StoryCoverage='exterior'|'front-corner'|'missing';
export type StoryChapter={
  id:string;number:string;title:string;detail:string;
  coverage:StoryCoverage;
  focus:[number,number,number]; // fractions of full Model B authored root bounds (X,Y,Z)
  azimuth:number; elevation:number; distance:number; // relative to whole-car span
  light:boolean;
  partSystem?:'wheel'|'brake'|'suspension'|'hardware'|'all';
};
export const STORY_CHAPTERS:readonly StoryChapter[]=[
  {id:'hero',number:'00',title:'THE MACHINE',detail:'Original Model B exterior · review stage',coverage:'exterior',focus:[0,0,0],azimuth:.70,elevation:.28,distance:1.48,light:false},
  {id:'blueprint',number:'01',title:'GEOMETRY',detail:'Showroom envelope, not native chassis B-Rep',coverage:'exterior',focus:[0,0,0],azimuth:1.53,elevation:.68,distance:1.72,light:true},
  {id:'front-aero',number:'02',title:'FRONT AERO',detail:'Model B surface only · aerodynamic hardware unverified',coverage:'exterior',focus:[.38,-.05,0],azimuth:.52,elevation:.12,distance:.86,light:false},
  {id:'front-wheel',number:'03',title:'FRONT WHEEL',detail:'Original P2.8 tyre, rim and hub when source is loaded',coverage:'front-corner',focus:[.25,-.17,.38],azimuth:.83,elevation:.15,distance:.53,light:false,partSystem:'wheel'},
  {id:'brakes',number:'04',title:'BRAKING SYSTEM',detail:'Original front-corner brake source only',coverage:'front-corner',focus:[.25,-.17,.38],azimuth:.95,elevation:.10,distance:.44,light:true,partSystem:'brake'},
  {id:'front-suspension',number:'05',title:'FRONT SUSPENSION',detail:'P2.8 wishbones · hardpoint fit not certified',coverage:'front-corner',focus:[.25,-.08,.25],azimuth:.60,elevation:.26,distance:.51,light:false,partSystem:'suspension'},
  {id:'steering',number:'06',title:'STEERING LINKAGE',detail:'Tie rod present in P2.8 · rack and coupled motion missing',coverage:'front-corner',focus:[.25,-.10,.26],azimuth:.9,elevation:.31,distance:.55,light:false,partSystem:'hardware'},
  {id:'cockpit',number:'07',title:'COCKPIT & HALO',detail:'Model B exterior silhouette · cockpit mechanics missing',coverage:'exterior',focus:[.05,.15,0],azimuth:.35,elevation:.56,distance:.80,light:true},
  {id:'monocoque',number:'08',title:'MONOCOQUE',detail:'Visual body shell · structural attachment points unverified',coverage:'exterior',focus:[.08,0,0],azimuth:1.55,elevation:.50,distance:1.06,light:true},
  {id:'sidepods',number:'09',title:'SIDEPODS',detail:'Original Model B exterior · no reconstructed internal duct',coverage:'exterior',focus:[-.06,0,.20],azimuth:1.75,elevation:.24,distance:.90,light:false},
  {id:'cooling',number:'10',title:'COOLING',detail:'Original cooling CAD and routing not supplied',coverage:'missing',focus:[-.08,0,.20],azimuth:1.8,elevation:.33,distance:.91,light:false},
  {id:'power-unit',number:'11',title:'POWER UNIT',detail:'ICE, turbo, MGU-K and energy store CAD missing',coverage:'missing',focus:[-.19,0,0],azimuth:2.3,elevation:.56,distance:.91,light:true},
  {id:'transmission',number:'12',title:'TRANSMISSION',detail:'Gearbox, differential and driveshaft CAD missing',coverage:'missing',focus:[-.27,-.07,0],azimuth:2.6,elevation:.32,distance:.82,light:true},
  {id:'floor',number:'13',title:'FLOOR & DIFFUSER',detail:'Model B external underside · no CFD or native floor source',coverage:'exterior',focus:[-.12,-.34,0],azimuth:2.48,elevation:-.40,distance:1.05,light:false},
  {id:'rear-mechanics',number:'14',title:'REAR MECHANICS',detail:'Rear suspension and brakes need distinct original CAD',coverage:'missing',focus:[-.37,-.17,.31],azimuth:2.50,elevation:.17,distance:.61,light:false},
  {id:'rear-wing',number:'15',title:'REAR AERO',detail:'Model B rear-wing exterior · active flap linkage unverified',coverage:'exterior',focus:[-.43,.19,0],azimuth:2.70,elevation:.28,distance:.77,light:true},
  {id:'explode',number:'16',title:'INSIDE THE MACHINE',detail:'Visual P2.8 part separation only · never an assembly motion audit',coverage:'front-corner',focus:[.25,-.15,.35],azimuth:.95,elevation:.28,distance:.85,light:true,partSystem:'all'},
  {id:'finale',number:'17',title:'REASSEMBLED',detail:'Original Model B silhouette; assembly G2 remains HOLD',coverage:'exterior',focus:[0,0,0],azimuth:.70,elevation:.28,distance:1.48,light:false}
] as const;
export const STORY_COUNT=STORY_CHAPTERS.length;
export type StoryReadiness='MODEL_B_EXTERIOR'|'P28_VISUAL_ONLY'|'SOURCE_MISSING';
export function chapterReadiness(
  chapter:StoryChapter,hasVerifiedP28:boolean,hasMetricWheelFit:boolean,
):StoryReadiness{
  if(chapter.coverage==='exterior')return 'MODEL_B_EXTERIOR';
  if(chapter.coverage==='missing')return 'SOURCE_MISSING';
  return hasVerifiedP28&&hasMetricWheelFit?'P28_VISUAL_ONLY':'SOURCE_MISSING';
}
export function storyAtProgress(progress:number):{
  index:number;nextIndex:number;blend:number;
}{
  const clamped=Number.isFinite(progress)?Math.min(1,Math.max(0,progress)):0;
  const frame=clamped*(STORY_COUNT-1);
  const index=Math.floor(frame);
  const t=frame-index;
  return {index,nextIndex:Math.min(STORY_COUNT-1,index+1),blend:t*t*(3-2*t)};
}
