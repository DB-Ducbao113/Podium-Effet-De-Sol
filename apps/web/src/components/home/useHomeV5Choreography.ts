import { useEffect } from 'react';
import type { RefObject } from 'react';
import { sampleV5Target } from './homeV5Choreography';
import type { HomeV5Effect } from './homeV5Choreography';
import { HOME_V5_ENTRIES, HOME_V5_SECTIONS } from './homeV5ChoreographyEntries';
import { readMotionEngine } from '../../motion/motionEngine';

type Target={node:HTMLElement; section:HTMLElement; offset:number; height:number; kind:HomeV5Effect; order:number; lastEnter?:number; lastExit?:number};

/**
 * One scroll rAF. Geometry sampled with effects disabled on mount/resize,
 * preventing CSS-transform feedback and flickering when scrubbing backwards.
 */
export function useHomeV5Choreography(ref:RefObject<HTMLElement|null>) {
  useEffect(()=>{
    if(readMotionEngine() === 'gsap')return;
    const root=ref.current;
    if(!root)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const compact=matchMedia('(max-width: 860px)');
    const nav=navigator as Navigator & {connection?:{saveData?:boolean};deviceMemory?:number};
    let targets:Target[]=[];
    let frame=0, resizeFrame=0;

    const reset=()=>{
      root.removeAttribute('data-v5-choreo');
      root.removeAttribute('data-v5-engine');
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
        target,
        value:sampleV5Target(
          target,
          sections.get(target.section)??0,
          innerHeight,
          lite),
      }));
      // Write only when progress changes: offscreen/stable elements cost nothing.
      // Motion is tied to absolute scroll position, so backwards remains exact.
      for(const {target,value} of values) {
        // Both phases are required: before-entry and after-exit have
        // visibility=0 but deliberately opposite slide/mask positions.
        if(target.lastEnter!==undefined&&target.lastExit!==undefined&&
          Math.abs(target.lastEnter-value.enter)<.001&&
          Math.abs(target.lastExit-value.exit)<.001)continue;
        target.lastEnter=value.enter;
        target.lastExit=value.exit;
        const node=target.node;
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
      for(const [selector,kind] of HOME_V5_ENTRIES) {
        root.querySelectorAll<HTMLElement>(selector).forEach((node,order)=>{
          const section=node.closest<HTMLElement>(HOME_V5_SECTIONS);
          if(!section)return;
          let rect=sectionRects.get(section);
          if(!rect) {rect=section.getBoundingClientRect();sectionRects.set(section,rect);}
          const box=node.getBoundingClientRect();
          targets.push({node,section,offset:box.top-rect.top,height:box.height,kind,order});
        });
      }
      for(const {node,kind} of targets)node.dataset.v5Effect=kind;
      root.dataset.v5Choreo='active';
      root.dataset.v5Engine='classic';
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
    const sizeObserver=typeof ResizeObserver==='undefined'?null:new ResizeObserver(scheduleRebuild);
    sizeObserver?.observe(root);

    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',scheduleRebuild,{passive:true});
    reduced.addEventListener('change',scheduleRebuild);
    compact.addEventListener('change',scheduleRebuild);
    document.addEventListener('visibilitychange',onVisibility);
    rebuild();
    return ()=>{
      mutation?.disconnect();
      sizeObserver?.disconnect();
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
