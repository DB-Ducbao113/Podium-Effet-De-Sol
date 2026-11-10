import neutralPalette from './engineeringNeutralPalette.json';

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
/** Single, user-approved monochrome engineering palette. The source GLBs and
 * original Model B exterior stay immutable; only viewer render materials change. */
export function materialForP28Part(system:PartSystem):MaterialPreset{
 const preset=neutralPalette.presets[system];
 return {color:neutralPalette.uniformColor,
   metalness:preset.metalness,roughness:preset.roughness};
}
