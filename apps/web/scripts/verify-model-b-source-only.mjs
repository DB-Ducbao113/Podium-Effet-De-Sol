/**
 * P2.36B local Chromium visual smoke, NOT GitHub Actions.
 * Run against a locally started Vite DEV server. No source CAD files uploaded.
 *
 *   npm run dev --workspace=@peds/web
 *   npm run qa:model-b:source-only --workspace=@peds/web
 *
 * Requires installed npm dependencies and a Playwright-compatible Chromium.
 * Set PEDS_CHROMIUM_PATH if Chrome is not on the ordinary Playwright path.
 */
import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {analyzeModelBFrame,assertModelBFrameVisible,modelBFrameDifference} from './model-b-frame-audit.mjs';

const target=new URL(process.env.PEDS_MODEL_B_URL||
 'http://127.0.0.1:5173/engineering/model-b-build');
if(!['127.0.0.1','localhost','[::1]'].includes(target.hostname))
 throw Error('Model B smoke test must target a local DEV server');
target.searchParams.set('sourceOnly','1');

const destination=resolve(process.env.PEDS_MODEL_B_QA_OUTPUT||
 'artifacts/model-b-source-only');
const expectedBlob='74fbd44daf709d0d368adef9de66e4e22a49fed4';
const layouts=[
 {label:'desktop',width:1440,height:900},
 {label:'mobile',width:390,height:844},
];
const fractions=[
 {name:'00-reveal',value:0},
 {name:'01-exterior-reveal',value:.22},
 {name:'02-wheel-core',value:.40},
 {name:'03-four-wheels',value:.60},
 {name:'04-rear-proposal',value:.76},
 {name:'05-final',value:.93},
 {name:'reverse-01',value:.22},
 {name:'reverse-00',value:0},
];

await mkdir(destination,{recursive:true});
const launch={
 headless:true,
 ...(process.env.PEDS_CHROMIUM_PATH
   ?{executablePath:process.env.PEDS_CHROMIUM_PATH}:{})
};
const browser=await chromium.launch(launch);
let snapshots=0;
try{
 for(const frame of layouts){
  const errors=[];
  const page=await browser.newPage({
   viewport:{width:frame.width,height:frame.height},
   deviceScaleFactor:1,
   reducedMotion:'no-preference',
  });
  page.on('pageerror',error=>{errors.push(error.message);});
  try{
   await page.goto(target.href,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(sha=>{
    const root=document.querySelector('.mb-build-source-wrap');
    return root?.getAttribute('data-owner-model-b-git-blob-sha1')===sha;
   },expectedBlob,{timeout:45000});
   const audit=await page.locator('.mb-build-source-wrap').evaluate(node=>({
    stage:node.getAttribute('data-model-b-source-review-stage'),
    cad:node.getAttribute('data-model-b-cad-verified-meshes'),
    truth:node.getAttribute('data-model-b-scene-truth'),
    sourceOnly:node.getAttribute('data-model-b-source-only-review'),
    mechanical:node.getAttribute('data-model-b-source-mechanical-mate-certified'),
   }));
   if(audit.stage!=='OWNER_EXTERIOR_ONLY'||audit.cad!=='0'||
      audit.sourceOnly!=='true'||audit.mechanical!=='false'||
      audit.truth!=='SOURCE_ONLY_VISUAL_REVEAL')
    throw Error('Invalid source-only provenance status: '+JSON.stringify(audit));
   const canvas=page.locator('.mb-build-webgl canvas');
   await canvas.waitFor({state:'visible',timeout:20000});
   const hashes=new Map();
   const images=new Map();
   const auditRows=[];
   for(const sample of fractions){
    await page.evaluate(fraction=>{
     const track=document.querySelector('.mb-build-track');
     if(!track)throw Error('Assembly scroll track missing');
     const rect=track.getBoundingClientRect();
     const absoluteTop=window.scrollY+rect.top;
     const range=Math.max(1,rect.height-window.innerHeight);
     window.scrollTo({top:absoluteTop+range*fraction,behavior:'instant'});
    },sample.value);
    await page.waitForFunction(value=>{
     const input=document.querySelector('.mb-build-scrubber');
     return input instanceof HTMLInputElement&&
       Math.abs(Number(input.value)/1000-value)<.012;
    },sample.value,{timeout:5000});
    // Leave time for the real R3F frame and damped camera to settle.
    await page.waitForTimeout(600);
    const image=await canvas.screenshot();
    const hash=createHash('sha256').update(image).digest('hex');
    hashes.set(sample.name,hash);
    images.set(sample.name,image);
    const audit=assertModelBFrameVisible(await analyzeModelBFrame(image),{
     finalFrame:sample.name==='05-final',
    });
    auditRows.push({chapter:sample.name,hash,
      foregroundFraction:audit.foregroundFraction,
      sourceBounds:audit.bounds,
    });
    await writeFile(join(destination,frame.label+'-'+sample.name+'.png'),image);
    snapshots++;
   }
   const difference=await modelBFrameDifference(
    images.get('00-reveal'),images.get('02-wheel-core'));
   if(hashes.get('00-reveal')===hashes.get('02-wheel-core')||
      difference<.002)
    throw Error('WebGL source mesh did not visibly change between chapters');
   if(hashes.get('00-reveal')===undefined||hashes.get('05-final')===undefined)
    throw Error('Missing required chapter snapshots');
   if(errors.length)throw Error('Browser JavaScript errors: '+errors.join(' ; '));
   await writeFile(join(destination,frame.label+'-audit.json'),
     JSON.stringify({layout:frame,source:audit,chapterDifference:difference,
       screenshots:auditRows},null,2)+'\n');
   console.log('PASS '+frame.label+' 8 visible scroll/reverse WebGL snapshots; chapter pixel difference '+difference.toFixed(4));
  }finally{
   await page.close();
  }
 }
 console.log('PASS P2.36B Chromium source-only QA: '+snapshots+' screenshots');
 console.log('SCREENSHOTS '+destination);
}finally{
 await browser.close();
}
