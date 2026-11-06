import * as THREE from 'three';

/**
 * P3 / CAD-first cinematic director. Source geometry is always the authority.
 * All shots and part offsets are deterministic and seekable at normalized time.
 */
export type P2FilmShot = {
  at: number;
  title: string;
  detail: string;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
  exposure: number;
  blueprint: number;
};

export const P2_CINEMA_SHOTS: readonly P2FilmShot[] = [
  {at:0, title:'PRECISION UNDER FIRE', detail:'CAD-FIRST / 53 SOURCED SOLIDS',
    position:[0.76,0.58,0.76],target:[-0.01,0.0,-0.08],fov:35,exposure:1.08,blueprint:0},
  {at:.17,title:'THE LOCK',detail:'HELICAL STEEL / MACHINED B-REP',
    position:[.44,.23,.82],target:[0,0,.08],fov:29,exposure:1.15,blueprint:0},
  {at:.34,title:'THE ROTATING MASS',detail:'ONE-PIECE RIM / SOURCE TYRE',
    position:[.84,.48,.57],target:[0,.01,-.02],fov:35,exposure:1.09,blueprint:0},
  {at:.51,title:'INSIDE THE CORNER',detail:'BEARING / UPRIGHT / ROTOR',
    position:[.65,.66,.48],target:[0,0,-.12],fov:31,exposure:1.18,blueprint:0},
  {at:.69,title:'TECHNICAL ANATOMY',detail:'REAL SOLIDS / SCHEMATIC MATERIAL',
    position:[.93,.72,.68],target:[0,.0,-.06],fov:38,exposure:1.02,blueprint:1},
  {at:.82,title:'REASSEMBLY',detail:'REVERSE THE SEQUENCE',
    position:[.84,.56,.76],target:[0,0,-.055],fov:36,exposure:1.12,blueprint:.50},
  {at:1,title:'BUILT FROM CAD',detail:'ALL 53 ORIGINAL PARTS RETURN',
    position:[.76,.58,.76],target:[-.01,0,-.08],fov:35,exposure:1.08,blueprint:0},
];

export const P2_CINEMA_DURATION_SECONDS = 26;

const saturate = (n:number):number => Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const smooth = (x:number):number => {const t=saturate(x);return t*t*(3-2*t);};
const mix = (a:number,b:number,t:number):number => a+(b-a)*t;
/**
 * Nonuniform Hermite across cinematic keyframes. Chapter anchors are exact,
 * camera velocity remains continuous (C1), and reverse scrubbing is identical.
 * Damped tangents reduce macro overshoot without stopping at every chapter.
 */
function cinemaHermite(
  axis:'position'|'target',
  segment:number,
  progress:number,
):[number,number,number] {
  const left=P2_CINEMA_SHOTS[segment];
  const right=P2_CINEMA_SHOTS[segment+1];
  const duration=right.at-left.at;
  const t=saturate((progress-left.at)/duration);
  const t2=t*t,t3=t2*t;
  const h00=2*t3-3*t2+1;
  const h10=t3-2*t2+t;
  const h01=-2*t3+3*t2;
  const h11=t3-t2;
  function tangent(index:number, component:number):number {
    if(index===0||index===P2_CINEMA_SHOTS.length-1)return 0;
    const before=P2_CINEMA_SHOTS[index-1];
    const after=P2_CINEMA_SHOTS[index+1];
    return .64*(after[axis][component]-before[axis][component])/(after.at-before.at);
  }
  return [0,1,2].map(k=>
    h00*left[axis][k]+h10*duration*tangent(segment,k)+
    h01*right[axis][k]+h11*duration*tangent(segment+1,k),
  ) as [number,number,number];
}
export function p2FilmFrame(progress:number) {
  const p=saturate(progress);
  if(p === 1) {
    const last=P2_CINEMA_SHOTS[P2_CINEMA_SHOTS.length-1];
    return {
      position:[...last.position] as [number,number,number],
      target:[...last.target] as [number,number,number],
      fov:last.fov,exposure:last.exposure,blueprint:last.blueprint,
      shotIndex:P2_CINEMA_SHOTS.length-1,shot:last,
    };
  }
  let i=0;
  while(i<P2_CINEMA_SHOTS.length-2&&p>P2_CINEMA_SHOTS[i+1].at)i++;
  const left=P2_CINEMA_SHOTS[i],right=P2_CINEMA_SHOTS[i+1];
  const amount=smooth((p-left.at)/(right.at-left.at));
  return {
    position:cinemaHermite('position',i,p),
    target:cinemaHermite('target',i,p),
    fov:mix(left.fov,right.fov,amount),
    exposure:mix(left.exposure,right.exposure,amount),
    blueprint:mix(left.blueprint,right.blueprint,amount),
    shotIndex:i,shot:left,
  };
}

/** Stagger part reveal and collapse to rest at 100%. Educational only. */
export function p2FilmPartSeparation(name:string,progress:number):number {
  const p=saturate(progress);
  const entry =
    name.includes('CENTER_LOCK') ? .18 :
    name.includes('TYRE') || name.includes('RIM') ? .30 :
    name.includes('HUB') || name.includes('CENTER_STUD') ? .39 :
    name.includes('BRAKE_ROTOR') || name.includes('ROTOR_MOUNT') ? .44 :
    name.includes('CALIPER') || name.includes('BRAKE_PAD') ? .48 :
    name.includes('BEARING') ? .54 :
    name.includes('UPRIGHT') || name.includes('WISHBONE') || name.includes('TIE_ROD') ? .59 : .50;
  return .64*smooth((p-entry)/.085)*(1-smooth((p-.79)/.205));
}

export function p2CinemaColor(partName:string):THREE.Color {
  if(partName.includes('TYRE'))return new THREE.Color('#242930');
  if(partName.includes('BRAKE_ROTOR'))return new THREE.Color('#40484e');
  if(partName.includes('CALIPER'))return new THREE.Color('#aa322a');
  if(partName.includes('PAD'))return new THREE.Color('#32353b');
  if(partName.includes('RIM'))return new THREE.Color('#8795a3');
  if(partName.includes('BEARING')||partName.includes('CENTER'))return new THREE.Color('#b1bdc8');
  if(partName.includes('UPRIGHT'))return new THREE.Color('#657782');
  return new THREE.Color('#8a9aa8');
}
