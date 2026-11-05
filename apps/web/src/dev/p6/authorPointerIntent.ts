/**
 * Decal placement is an explicit authoring gesture. OrbitControls owns every
 * ordinary mouse drag, including when a decal happens to be selected.
 */
export function shouldStartDecalPlacement(event: Pick<PointerEvent, 'shiftKey' | 'button'>): boolean {
  return event.shiftKey && event.button === 0;
}
