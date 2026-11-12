/** P2.49: do not accept the original source CAD browser screenshot merely
 * because the DOM scrollbar has reached a chapter. The R3F scene progress
 * and moving camera must both settle on the actual requested scroll pose.
 */
export type SourceFrameSettling={
 progress:number;
 cameraErrorM:number;
 frame:number;
};
export function sourceFrameSettled(
 actual:SourceFrameSettling,
 targetProgress:number,
 firstFrame:number,
):boolean{
 if(!Number.isFinite(targetProgress)||targetProgress<0||targetProgress>1||
    !Number.isSafeInteger(firstFrame)||firstFrame<0||
    !Number.isSafeInteger(actual.frame)||actual.frame<1||
    !Number.isFinite(actual.progress)||actual.progress<0||actual.progress>1||
    !Number.isFinite(actual.cameraErrorM)||actual.cameraErrorM<0)
  return false;
 // Require a *new* rendered R3F frame, not leftover canvas evidence from a
 // previous source/scroll chapter before this exact target was requested.
 return actual.frame>=firstFrame+2&&
   Math.abs(actual.progress-targetProgress)<=.004&&
   actual.cameraErrorM<=.015;
}
