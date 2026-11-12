/** Source-only sampler: exactly min(totalVertices,budget) monotonically spaced indices.
 * O(budget), independent of total GLB vertex count. No geometry fabrication.
 */
export function sourceSampleIndices(totalVertices:number,budget:number):number[]{
 if(!Number.isSafeInteger(totalVertices)||totalVertices<1)
  throw Error('Invalid original source vertex count');
 if(!Number.isInteger(budget)||budget<256||budget>30000)
  throw Error('Original source vertex budget invalid');
 const limit=Math.min(totalVertices,budget);
 const indices=new Array<number>(limit);
 for(let k=0;k<limit;k++){
  // Integer-balanced samples, matching the old global cumulative rule.
  indices[k]=Math.ceil((k+1)*totalVertices/limit)-1;
 }
 return indices;
}
