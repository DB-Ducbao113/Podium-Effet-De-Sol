import {describe,expect,it} from 'vitest';
import {
 ORIGINAL_MODEL_B_SOURCE,gitBlobHash,verifyOriginalModelBBinary,
} from './originalModelBSource';

const data=(text:string)=>new TextEncoder().encode(text).buffer as ArrayBuffer;

describe('Owner original Model B immutable binary provenance',()=>{
 it('pins committed source path, byte count and exact Git object ID',()=>{
  expect(ORIGINAL_MODEL_B_SOURCE.assetPath)
   .toBe('models/model-b-eds-optimized-v1.glb');
  expect(ORIGINAL_MODEL_B_SOURCE.bytes).toBe(2120816);
  expect(ORIGINAL_MODEL_B_SOURCE.gitBlobSHA1)
   .toBe('74fbd44daf709d0d368adef9de66e4e22a49fed4');
  expect(ORIGINAL_MODEL_B_SOURCE.mechanicalMateCertified).toBe(false);
 });
 it('computes Git blob SHA-1 over literal header plus exact bytes',async()=>{
  // Independently checked against Python hashlib.sha1(
  // b"blob 11\\x00"+b"hello world").
  expect(await gitBlobHash(data('hello world')))
   .toBe('95d09f2b10159347eece71399a7e2e907ea3df4f');
  expect(await gitBlobHash(data('owner model B source fingerprint test')))
   .toBe('c3c414f322053334f0c58c0abbb46127f38f92c6');
 });
 it('fails fast for any substitute before original Model B is decoded',async()=>{
  await expect(verifyOriginalModelBBinary(data('hello world')))
   .rejects.toThrow(/byte count/);
  const altered=new ArrayBuffer(2120816);
  await expect(verifyOriginalModelBBinary(altered))
   .rejects.toThrow(/Git blob SHA/);
 });
 it('rejects missing and oversized binary without a hash operation',async()=>{
  await expect(gitBlobHash(new ArrayBuffer(0))).rejects.toThrow(/length/);
  await expect(gitBlobHash(new ArrayBuffer(9*1024*1024)))
   .rejects.toThrow(/length/);
 });
});
