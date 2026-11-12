/** P2.40: fit the actual source CAD bounds in a perspective camera.
 * No invented assembly dimensions: the dimensions come from the selected
 * decoded GLB mesh's transformed original position vertices.
 */
export function sourceCadFocusDistance(
 worldSize:readonly [number,number,number],
 aspect:number,
 verticalFovDeg=35,
 hardware=false,
):number{
 if(worldSize.length!==3||
    !worldSize.every(v=>Number.isFinite(v)&&v>=0)||
    !Number.isFinite(aspect)||aspect<=0||
    !Number.isFinite(verticalFovDeg)||
    verticalFovDeg<=5||verticalFovDeg>=120)
   throw Error('Invalid original CAD source focus bounds or camera');
 const radius=Math.hypot(...worldSize)*.5;
 if(!Number.isFinite(radius)||radius===0)
   throw Error('Original CAD source focus geometry has zero world extent');
 const verticalHalf=verticalFovDeg*Math.PI/360;
 const horizontalHalf=Math.atan(Math.tan(verticalHalf)*aspect);
 const limitingHalf=Math.min(verticalHalf,horizontalHalf);
 const fitDistance=1.24*radius/Math.sin(limitingHalf);
 const minimum=hardware?.24:.50;
 const distance=Math.max(minimum,fitDistance);
 if(!Number.isFinite(distance))
   throw Error('Original CAD source focus camera distance nonfinite');
 return distance;
}
