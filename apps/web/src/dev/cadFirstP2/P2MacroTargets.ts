/**
 * Every macro candidate is a verified named object in the original P2.6
 * HIGH/BALANCED/PERFORMANCE GLB. Do not add synthetic "F1" source parts.
 */
export const P2_MACRO_PARTS = [
  {id:'P2_CENTER_LOCK_NUT_BORE',label:'LOCK NUT',detail:'Machined internal helix'},
  {id:'P2_CENTER_STUD_EXTERNAL_HELIX',label:'STUD',detail:'True external helical thread'},
  {id:'P2_WHEEL_HUB_SHAFT_FLANGE',label:'HUB',detail:'Step and radial faces'},
  {id:'P2_BEARING_INNER_RACE',label:'BEARING',detail:'Physical toroidal raceway'},
  {id:'P2_BRAKE_ROTOR_DRILLED_CARBON',label:'ROTOR',detail:'Source-cut through holes'},
  {id:'P2_CALIPER_OUTBOARD_CASTING',label:'CALIPER',detail:'Bored body for separate pistons'},
  {id:'P2_RIM_FORGED_BARREL',label:'RIM',detail:'Single connected forged-style profile'},
] as const;
