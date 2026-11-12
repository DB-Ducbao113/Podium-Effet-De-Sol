/** P2.36: normalized, reversible mapping between Model B track and page scroll. */
export function assemblyScrollTop(trackTop:number,trackHeight:number,viewportHeight:number,progress:number):number{
 if(![trackTop,trackHeight,viewportHeight,progress].every(Number.isFinite))
  throw Error('Nonfinite assembly scrub input');
 if(trackHeight<=0||viewportHeight<=0)
  throw Error('Invalid assembly track or viewport height');
 const range=Math.max(1,trackHeight-viewportHeight);
 const normalized=Math.max(0,Math.min(1,progress));
 return trackTop+range*normalized;
}
export function assemblyScrollProgress(trackTop:number,trackHeight:number,viewportHeight:number,scrollY:number):number{
 if(![trackTop,trackHeight,viewportHeight,scrollY].every(Number.isFinite))
  throw Error('Nonfinite assembly scroll position');
 if(trackHeight<=0||viewportHeight<=0)
  throw Error('Invalid assembly track or viewport height');
 return Math.max(0,Math.min(1,(scrollY-trackTop)/Math.max(1,trackHeight-viewportHeight)));
}
