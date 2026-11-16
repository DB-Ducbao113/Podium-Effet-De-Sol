/** Pure frame sampling. No timelines/timers; scroll back reverses exactly. */
export type HomeV5Effect = 'left'|'right'|'rise'|'number'|'wipe-left'|'wipe-right';
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const ease = (a: number,b: number,n: number) => { const x=clamp((n-a)/(b-a));return x*x*(3-2*x); };
/** A negative factor times 0 yields -0, which fails the Object.is identity used by parity assertions. */
const zero = (n: number) => n === 0 ? 0 : n;

/**
 * Full viewport cycle: enter from below, hold, exit above.
 * The same Y position maps to the same frame no matter which way user scrolls.
 * Returning back up through a section therefore reverses the outro and intro.
 */
export function sampleV5Item(
  top: number, viewport: number, kind: HomeV5Effect, lite=false, elementHeight=48,
) {
  const h=Math.max(1,viewport);
  const height=Math.max(1,elementHeight);
  const enter=ease(0,1,(h*.92-top)/(h*.60));
  const exit=ease(0,1,(h*.16-(top+height))/(h*.22));
  const visible=enter*(1-exit);
  const distance=lite?26:92;
  const fromLeft=kind==='left'||kind==='wipe-left';
  const fromRight=kind==='right'||kind==='wipe-right';
  const x=(fromLeft?-distance:fromRight?distance:0)*(1-enter)
    +(fromLeft?distance*.50:fromRight?-distance*.50:0)*exit;
  const y=(kind==='rise'?(lite?18:52):kind==='number'?32:0)*(1-enter)
    -(kind==='rise'?(lite?16:36):kind==='number'?22:0)*exit;
  return {
    progress: visible,
    enter, exit,
    x,y,
    alpha: .18+.82*visible,
    left: kind==='wipe-right'?(lite?40:86)*(1-enter):
      kind==='wipe-left'?(lite?40:86)*exit:0,
    right: kind==='wipe-left'?(lite?40:86)*(1-enter):
      kind==='wipe-right'?(lite?40:86)*exit:0,
    bottom: kind==='number'?(lite?45:95)*Math.max(1-enter,exit):0,
  };
}

/**
 * The single sampling call every Home engine makes. Keeping the per-item stagger
 * here means two schedulers cannot produce two different frames for one position.
 */
export function sampleV5Target(
  target: { offset: number; order: number; height: number; kind: HomeV5Effect },
  sectionTop: number, viewport: number, lite: boolean,
) {
  return sampleV5Item(
    sectionTop + target.offset + Math.min(5, target.order) * (lite ? 4 : 10),
    viewport, target.kind, lite, target.height,
  );
}

/** Video-editor-style wipes, slide transitions and cross-layer composition. */
export function sampleV5Scene(value:number) {
  const p=clamp(value);
  const exit1=ease(.16,.40,p);
  const enter2=ease(.22,.45,p);
  const exit2=ease(.59,.80,p);
  const enter3=ease(.63,.90,p);
  return {
    firstX:zero(-112*exit1), firstMask:92*exit1,
    secondX:118*(1-enter2)-112*exit2,
    secondMaskLeft:92*exit2, secondMaskRight:92*(1-enter2),
    thirdX:118*(1-enter3), thirdMask:92*(1-enter3),
    photo2Opacity:.56*enter2*(1-exit2), photo2Clip:100*(1-enter2), photo2X:36*(1-enter2),
    photo3Opacity:.54*enter3, photo3Clip:100*(1-enter3), photo3X:zero(-36*(1-enter3)),
  };
}
