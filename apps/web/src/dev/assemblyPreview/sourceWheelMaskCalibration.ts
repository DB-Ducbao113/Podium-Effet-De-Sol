/** P2.43 — Source-calibrated original Model B wheel masking.
 *
 * Use the SHA-verified P2.8 tyre axial thickness, not an arbitrary ±2.5
 * source-unit cylinder that can remove nearby original F1 body work.
 *
 * The original display shell uses authored nonmetric source units while
 * P2.8 tyre geometry is in metres. No CAD vertices are changed.
 */
export function sourceWheelMaskHalfWidth(
 originalTyreWidthM:number,shellScale:number,
):number{
 if(!Number.isFinite(originalTyreWidthM)||
    Math.abs(originalTyreWidthM-.314)>.008||
    !Number.isFinite(shellScale)||shellScale<.14||shellScale>.21)
  throw Error('Unverified original P2.8 tyre width or Model B source calibration');
 // A conservative 60% margin beyond native half tyre width accounts for
 // showroom tyre shoulder, while protecting the nearby source F1 body.
 return originalTyreWidthM*.8/shellScale;
}

/** Stable source-coordinate dither: unlike gl_FragCoord screen pixel noise,
 * it does not crawl across the original tyres as the orbit camera moves.
 * Same maths/coefficients as the injected native GLSL fragment shader.
 */
export function sourceWheelMaskThreshold(
 point:readonly [number,number,number],
):number{
 if(point.length!==3||!point.every(Number.isFinite))
  throw Error('Invalid original Model B source-local mask point');
 const seed=point[0]*12.9898+point[1]*78.233+
   point[2]*37.719;
 const value=Math.sin(seed)*43758.5453;
 return value-Math.floor(value);
}
