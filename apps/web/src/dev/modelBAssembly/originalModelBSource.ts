/** The authentic owner Model B showroom GLB committed to this repository.
 *
 * GitHub object ID verified against the work branch repository's exact
 * apps/web/public/models/model-b-eds-optimized-v1.glb entry.
 *
 * Verify before parsing or displaying a file as "ORIGINAL OWNER MODEL B".
 * Unlike a bounding-box fingerprint, a Git blob object SHA-1 binds all file
 * bytes and the exact byte length. This is source-identity validation, not
 * proof of CAD manufacturing authenticity or any mechanical mate.
 */
export const ORIGINAL_MODEL_B_SOURCE = {
  assetPath:'models/model-b-eds-optimized-v1.glb',
  bytes:2120816,
  gitBlobSHA1:'74fbd44daf709d0d368adef9de66e4e22a49fed4',
  sourceProvenance:'PODIUM_EDS_GITHUB_COMMITTED_OWNER_MODEL_B_GLB',
  mechanicalMateCertified:false,
} as const;

export async function gitBlobHash(bytes:ArrayBuffer):Promise<string>{
  if(!bytes.byteLength||bytes.byteLength>8*1024*1024)
    throw Error('Model B original binary length invalid');
  if(!globalThis.crypto?.subtle)
    throw Error('Secure Web Crypto SHA-1 required to verify owner Model B Git object');
  const header=new TextEncoder().encode('blob '+bytes.byteLength+'\0');
  const source=new Uint8Array(bytes);
  const payload=new Uint8Array(header.length+source.length);
  payload.set(header);
  payload.set(source,header.length);
  const digest=await crypto.subtle.digest('SHA-1',payload);
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function verifyOriginalModelBBinary(bytes:ArrayBuffer):Promise<string>{
  if(bytes.byteLength!==ORIGINAL_MODEL_B_SOURCE.bytes)
    throw Error('Original owner Model B binary byte count changed');
  const sha=await gitBlobHash(bytes);
  if(sha!==ORIGINAL_MODEL_B_SOURCE.gitBlobSHA1)
    throw Error('Original owner Model B GLB Git blob SHA differs from repository source');
  return sha;
}
