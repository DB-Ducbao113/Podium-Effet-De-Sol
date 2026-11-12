/** Pure frame sampling. No timelines/timers; scroll back reverses exactly. */
export type HomeV5Effect = 'left'|'right'|'rise'|'number'|'wipe-left'|'wipe-right';
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const ease = (a: number,b: number,n: number) => { const x=clamp((n-a)/(b-a));return x*x*(3-2*x); };

export function sampleV5Item(top: number, viewport: number, kind: HomeV5Effect, lite=false) {
  const p=ease(0,1,(Math.max(1,viewport)*.94-top)/(Math.max(1,viewport)*.67));
  const r=1-p;
  const distance=lite?26:92;
  return {
    progress:p,
    x: kind==='left'||kind==='wipe-left' ? -distance*r : kind==='right'||kind==='wipe-right' ? distance*r : 0,
    y: kind==='rise' ? (lite?18:52)*r : kind==='number' ? 32*r : 0,
    alpha:.18+.82*p,
    left:kind==='wipe-right'?(lite?40:86)*r:0,
    right:kind==='wipe-left'?(lite?40:86)*r:0,
    bottom:kind==='number'?(lite?45:95)*r:0,
  };
}

/** Video-editor-style wipes, slide transitions and cross-layer composition. */
export function sampleV5Scene(value:number) {
  const p=clamp(value);
  const exit1=ease(.16,.40,p);
  const enter2=ease(.22,.45,p);
  const exit2=ease(.59,.80,p);
  const enter3=ease(.63,.90,p);
  return {
    firstX:-112*exit1, firstMask:92*exit1,
    secondX:118*(1-enter2)-112*exit2,
    secondMaskLeft:92*exit2, secondMaskRight:92*(1-enter2),
    thirdX:118*(1-enter3), thirdMask:92*(1-enter3),
    photo2Opacity:.56*enter2*(1-exit2), photo2Clip:100*(1-enter2), photo2X:36*(1-enter2),
    photo3Opacity:.54*enter3, photo3Clip:100*(1-enter3), photo3X:-36*(1-enter3),
  };
}
