/** Local assembly-preview placement only. Do not convert CAD coordinates by changing scale. */
export type Placement = {
  translationM: [number, number, number];
  rotationDeg: [number, number, number];
  displayedAtBodyCenter: boolean;
};
export const INITIAL_PLACEMENT: Placement = {
  translationM: [0, 0, 0],
  rotationDeg: [0, 0, 0],
  displayedAtBodyCenter: false,
};
export function checkedPlacement(value: Placement): Placement {
  if (value.translationM.length !== 3 || value.rotationDeg.length !== 3 ||
    [...value.translationM, ...value.rotationDeg].some(v => !Number.isFinite(v) || Math.abs(v) > 10000)) {
    throw new Error('Invalid P2.8 placement coordinates');
  }
  return value;
}
/**
 * Centers are graphics-only initial placement helpers, NOT physical mates.
 * Keep GLB scale at exactly 1; offsets and rotations are applied to root only.
 */
export function initialStagingPosition(
  bodyMin: [number, number, number], bodyMax: [number, number, number],
  cornerMin: [number, number, number],
): [number, number, number] {
  if ([...bodyMin, ...bodyMax, ...cornerMin].some(v=>!Number.isFinite(v))) throw Error('Invalid preview bounds');
  return [
    bodyMax[0] + 0.6 - cornerMin[0],
    bodyMin[1] - cornerMin[1],
    bodyMin[2] - cornerMin[2],
  ];
}
export function centerOffset(bodyCenter: [number,number,number], cornerCenter: [number,number,number]) {
  return bodyCenter.map((v,i)=>v-cornerCenter[i]) as [number,number,number];
}
