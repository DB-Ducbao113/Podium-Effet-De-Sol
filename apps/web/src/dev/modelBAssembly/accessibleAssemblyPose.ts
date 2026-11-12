/** P2.35E: Reduced motion preserves a complete assembled source-CAD vehicle.
 * Disables per-part translations and screw rotations instead of hiding parts.
 */
export function accessibleAssemblyFraction(
 authoredFraction:number,reducedMotion:boolean,
):number{
 if(reducedMotion)return 1;
 if(!Number.isFinite(authoredFraction))return 0;
 return Math.max(0,Math.min(1,authoredFraction));
}

/** Original owner shell should stay opaque in reduced-motion mode. */
export function accessibleShellOpacity(
 authoredOpacity:number,reducedMotion:boolean,
):number{
 if(reducedMotion)return 1;
 if(!Number.isFinite(authoredOpacity))return 1;
 return Math.max(0,Math.min(1,authoredOpacity));
}
