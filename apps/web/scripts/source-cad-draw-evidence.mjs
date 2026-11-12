/** P2.47: verify original CAD render callbacks, not only requested drawRange.
 * No browser or dependency required: QA can reject false evidence before
 * accepting any screenshot of an allegedly assembled Model B.
 */
export function assertSourceCadDrawEvidence(dots,{requireBuild=false}={}){
 const numeric=[
  dots.scheduled,dots.scheduledVisible,dots.scheduledInspection,
  dots.rendered,dots.renderedInspection,dots.drawCalls,dots.frame,
 ];
 if(!numeric.every(Number.isSafeInteger)||dots.frame<1||
    !['PENDING','OBSERVED'].includes(dots.evidence)||
    dots.scheduled<0||dots.scheduled>10544||
    dots.scheduledVisible<0||
    dots.scheduledVisible>dots.scheduled||
    dots.rendered<0||dots.rendered>dots.scheduledVisible||
    dots.renderedInspection!==0||dots.scheduledInspection!==0||
    dots.drawCalls<0||dots.drawCalls>29||
    ((dots.rendered>0||dots.drawCalls>0)&&
      dots.evidence!=='OBSERVED')||
    ((dots.rendered>0)!==(dots.drawCalls>0))||
    (dots.scheduledVisible>0&&dots.rendered===0))
  throw Error('Original CAD drawRange versus render-callback evidence invalid: '+
    JSON.stringify(dots));
 if(requireBuild&&(dots.rendered<1||dots.drawCalls<1||
    dots.evidence!=='OBSERVED'))
  throw Error('Original CAD source build has no actual post-render draw');
 return dots;
}
