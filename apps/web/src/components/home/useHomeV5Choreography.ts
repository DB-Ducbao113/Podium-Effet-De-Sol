import { useEffect } from 'react';
import type { RefObject } from 'react';
import { sampleV5Item } from './homeV5Choreography';
import type { HomeV5Effect } from './homeV5Choreography';

/** Scoped targets: section layouts remain normal and all F1 numbers remain factual. */
const entries: ReadonlyArray<[string,HomeV5Effect]> = [
  ['#race-control .home-live__heading h2','left'],
  ['#race-control .home-live__heading > a','right'],
  ['#race-control .home-rc__next','wipe-left'],
  ['#race-control .home-rc__identity h3','left'],
  ['#race-control .home-rc__map','wipe-right'],
  ['#race-control .home-rc__timing','wipe-right'],
  ['#race-control .home-rc__digits > div','number'],
  ['#race-control .home-rc__session','rise'],
  ['#race-control .home-rc__result','rise'],
  ['#race-control .home-rc__result > strong','number'],
  ['#championship-overview .home-live__heading h2','left'],
  ['#championship-overview .home-title-fight__panel:first-child','wipe-left'],
  ['#championship-overview .home-title-fight__panel:last-child','wipe-right'],
  ['#championship-overview .home-title-fight__rows li','rise'],
  ['#championship-overview .home-title-fight__rank','number'],
  ['#championship-overview .home-title-fight__rows strong','number'],
  ['.home-v5__editorial .home-v5__eyebrow','rise'],
  ['.home-v5__editorial h2','left'],
  ['.home-v5__editorial-copy > p','rise'],
  ['.home-v5__editorial-link','left'],
  ['.home-v5__editorial-art','wipe-right'],
  ['#eds-explore .eds-explore__header h2','left'],
  ['#eds-explore .eds-explore__card:nth-child(odd)','wipe-left'],
  ['#eds-explore .eds-explore__card:nth-child(even)','wipe-right'],
  ['#eds-explore .eds-explore__number','number'],
  ['#eds-explore .eds-explore__bottom strong','rise'],
];
type Target={node:HTMLElement; section:HTMLElement; offset:number; kind:HomeV5Effect; order:number};
const sectionQuery='#race-control, #championship-overview, .home-v5__editorial, #eds-explore';

/**
 * One scroll rAF. Geometry sampled with effects disabled on mount/resize,
 * preventing CSS-transform feedback and flickering when scrubbing backwards.
 */
export function useHomeV5Choreography(ref:RefObject<HTMLElement|null>) {
  useEffect(()=>{
    const root=ref.current;
    if(!root)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const compact=matchMedia('(max-width: 860px)');
    const nav=navigator as Navigator & {connection?:{saveData?:boolean};deviceMemory?:number};
    let targets:Target[]=[];
    let frame=0, resizeFrame=0;

    const reset=()=>{
      root.removeAttribute('data-v5-choreo');
      for(const {node} of targets) {
        node.removeAttribute('data-v5-effect');
        for(const prop of ['--v5-anim-x','--v5-anim-y','--v5-anim-alpha','--v5-anim-left','--v5-anim-right','--v5-anim-bottom'])
          node.style.removeProperty(prop);
      }
      targets=[];
    };

    const draw=()=>{
      frame=0;
      if(document.hidden||reduced.matches)return;
      const lite=compact.matches||Boolean(nav.connection?.saveData||(nav.deviceMemory!==undefined&&nav.deviceMemory<=4));
      // Layout read phase: section positions are not animated.
      const sections=new Map<HTMLElement,number>();
      for(const target of targets) {
        if(!sections.has(target.section))sections.set(target.section,target.section.getBoundingClientRect().top);
      }
      const values=targets.map(target=>({
        node:target.node,
        value:sampleV5Item(
          (sections.get(target.section)??0)+target.offset+Math.min(5,target.order)*(lite?4:10),
          innerHeight,target.kind,lite),
      }));
      // Write phase: no React re-render and no changes to data/text.
      for(const {node,value} of values) {
        node.style.setProperty('--v5-anim-x',value.x.toFixed(1)+'px');
        node.style.setProperty('--v5-anim-y',value.y.toFixed(1)+'px');
        node.style.setProperty('--v5-anim-alpha',value.alpha.toFixed(3));
        node.style.setProperty('--v5-anim-left',value.left.toFixed(1)+'%');
        node.style.setProperty('--v5-anim-right',value.right.toFixed(1)+'%');
        node.style.setProperty('--v5-anim-bottom',value.bottom.toFixed(1)+'%');
      }
    };
    const schedule=()=>{if(!frame&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(draw);};

    const rebuild=()=>{
      reset();
      if(reduced.matches)return;
      const sectionRects=new Map<HTMLElement,DOMRect>();
      for(const [selector,kind] of entries) {
        root.querySelectorAll<HTMLElement>(selector).forEach((node,order)=>{
          const section=node.closest<HTMLElement>(sectionQuery);
          if(!section)return;
          let rect=sectionRects.get(section);
          if(!rect) {rect=section.getBoundingClientRect();sectionRects.set(section,rect);}
          targets.push({node,section,offset:node.getBoundingClientRect().top-rect.top,kind,order});
        });
      }
      for(const {node,kind} of targets)node.dataset.v5Effect=kind;
      root.dataset.v5Choreo='active';
      draw();
    };
    const scheduleRebuild=()=>{
      if(resizeFrame)cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;rebuild();});
    };
    const mutation=typeof MutationObserver==='undefined'?null:new MutationObserver(records=>{
      if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(node=>node.nodeType===1)))
        scheduleRebuild();
    });
    mutation?.observe(root,{childList:true,subtree:true});
    const onVisibility=()=>{if(!document.hidden)schedule();};

    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',scheduleRebuild,{passive:true});
    reduced.addEventListener('change',scheduleRebuild);
    compact.addEventListener('change',scheduleRebuild);
    document.addEventListener('visibilitychange',onVisibility);
    rebuild();
    return ()=>{
      mutation?.disconnect();
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',scheduleRebuild);
      reduced.removeEventListener('change',scheduleRebuild);
      compact.removeEventListener('change',scheduleRebuild);
      document.removeEventListener('visibilitychange',onVisibility);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      reset();
    };
  },[ref]);
}
