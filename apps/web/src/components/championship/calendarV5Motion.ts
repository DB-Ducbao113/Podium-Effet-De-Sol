/**
 * A deterministic palette sampled from the existing World Tour scroll coordinate.
 * No timers, scroll interception, new maps or image assets. Moving up replays all
 * lighting changes in reverse because the coordinate alone determines the frame.
 */
const clamp = (n:number) => Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const smooth = (n:number) => {const v=clamp(n);return v*v*(3-2*v);};

export function sampleCalendarV5Backdrop(position:number,roundCount:number){
  const span=Math.max(1,roundCount);
  const p=clamp(position/span);
  // Blend across the entire tour, not by hard cuts at individual rounds.
  const warm=.12+.65*smooth(Math.sin(Math.PI*(p+.08))**2);
  const blue=.16+.62*smooth(Math.cos(Math.PI*(p+.10))**2);
  const violet=.10+.61*smooth(Math.sin(Math.PI*(p+.29))**2);
  return {progress:p,warm,blue,violet,shift:(p-.5)*42};
}
