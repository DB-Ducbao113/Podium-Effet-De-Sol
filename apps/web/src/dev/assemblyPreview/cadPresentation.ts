/**
 * Non-destructive visualization policy for project-authored 59-solid P2.8 CAD.
 * All native mesh positions and part identities are retained.
 * Not a mechanical separation simulation or manufacturing mate.
 */
export type CornerPresentation = 'assembled'|'tyre-hidden'|'mechanism-core'|'exploded';
export type PartSystem =
  'tyre'|'rim'|'carbon-brake'|'caliper'|'friction-pad'|'bearing'|
  'hardware'|'suspension'|'upright'|'hub'|'other';
export type PartDisplay={
  visible:boolean;
  offsetM: [number,number,number];
  system:PartSystem;
};

export function classifyP28Part(name:string):PartSystem {
  if(name==='P2_TYRE_SLICK_BODY')return 'tyre';
  if(name==='P2_RIM_FORGED_BARREL')return 'rim';
  if(name.includes('ROTOR_DRILLED_CARBON'))return 'carbon-brake';
  if(name.includes('BRAKE_PAD'))return 'friction-pad';
  if(name.includes('CALIPER') && !name.includes('STUD'))return 'caliper';
  if(name.includes('BEARING_'))return 'bearing';
  if(name.includes('NUT')||name.includes('FASTENER')||name.includes('STUD')||
     name.includes('HELIX')||name.includes('LOCK')||name.includes('RETAINER')||
     name.includes('FACE_RING'))return 'hardware';
  if(name.startsWith('P27_')||name==='P2_TIE_ROD')return 'suspension';
  if(name.startsWith('P2_UPRIGHT'))return 'upright';
  if(name.includes('HUB')||name.includes('ROTOR_HAT'))return 'hub';
  return 'other';
}
export function presentationForP28Part(name:string, mode:CornerPresentation):PartDisplay {
  const system=classifyP28Part(name);
  if(mode==='assembled')return {visible:true,offsetM:[0,0,0],system};
  if(mode==='tyre-hidden')return {visible:system!=='tyre',offsetM:[0,0,0],system};
  if(mode==='mechanism-core')return {
    visible:system!=='tyre'&&system!=='rim',
    offsetM:[0,0,0],system,
  };
  // Use spatially separated, deliberate showroom offsets. These do NOT
  // represent STEP assembly constraints, kinematics, or disassembly paths.
  // Move opaque tyre and rim upwards to reveal the rotor and bearing core.
  const displacement:Record<PartSystem,[number,number,number]>={
    tyre:[-.65,.72,.12],
    rim:[-.34,.34,.05],
    'carbon-brake':[.04,-.04,.13],
    caliper:[.11,-.22,.06],
    'friction-pad':[.09,-.15,.075],
    bearing:[.0,.0,.20],
    hardware:[.0,.0,.34],
    suspension:[.0,-.24,-.14],
    upright:[.0,0,-.07],
    hub:[.0,.0,.09],
    other:[0,0,0],
  };
  return {visible:true,offsetM:displacement[system],system};
}

export type MaterialPreset={
  color:string;metalness:number;roughness:number;
};
export function materialForP28Part(system:PartSystem):MaterialPreset{
  switch(system){
    case 'tyre':return {color:'#272d35',metalness:0,roughness:.91};
    case 'rim':return {color:'#b7c6d2',metalness:.79,roughness:.31};
    case 'carbon-brake':return {color:'#5a616d',metalness:.24,roughness:.71};
    case 'caliper':return {color:'#ba5950',metalness:.55,roughness:.39};
    case 'friction-pad':return {color:'#8c8175',metalness:.14,roughness:.87};
    case 'bearing':return {color:'#b5c8d3',metalness:.84,roughness:.26};
    case 'hardware':return {color:'#c1cbd6',metalness:.79,roughness:.25};
    case 'suspension':return {color:'#69727c',metalness:.44,roughness:.52};
    case 'upright':return {color:'#8f99a4',metalness:.7,roughness:.38};
    case 'hub':return {color:'#a7abb3',metalness:.76,roughness:.33};
    default:return {color:'#848e98',metalness:.48,roughness:.51};
  }
}
