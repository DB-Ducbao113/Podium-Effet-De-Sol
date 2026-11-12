/** P2.38A real source-CAD Model B Chromium acceptance.
 *
 * Requires the existing DEV-only, loopback-bound original source staging
 * (P2.8 59 meshes, P2.12 19, P2.14 16). Never creates substitute CAD.
 *
 * In terminal 1: npm run dev --workspace=@peds/web
 * In terminal 2: PEDS_CHROMIUM_PATH=/usr/bin/chromium \
 *   npm run qa:model-b:cad-assembly --workspace=@peds/web
 *
 * Runs locally only. No GitHub Actions, deployment, merge or source upload.
 */
import {chromium} from 'playwright-core';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {
 analyzeModelBFrame,assertModelBFrameVisible,modelBFrameDifference,
} from './model-b-frame-audit.mjs';
import {assertSourceCadDrawEvidence} from './source-cad-draw-evidence.mjs';
import {assertSourceCadFrameSnapshot} from './source-cad-frame-snapshot.mjs';

const target=new URL(process.env.PEDS_MODEL_B_URL||
 'http://127.0.0.1:5173/engineering/model-b-build');
if(!['127.0.0.1','localhost','[::1]'].includes(target.hostname))
 throw Error('Full CAD assembly acceptance is restricted to a local DEV server');
target.searchParams.delete('sourceOnly');
const base=target.origin;
const indexResponse=await fetch(base+'/__peds-model-b-cad/index.json',{
 cache:'no-store',
});
if(!indexResponse.ok)
 throw Error('Original P2.8/P2.12/P2.14 local source staging required: '+
  indexResponse.status);
const index=await indexResponse.json();
if(index?.schema!=='podium-eds.model-b-assembly.local-owner-cad.v1'||
 index?.localOnlyNotDeployed!==true||index?.noFabricatedGeometry!==true||
 index?.mechanicalG2!=='HOLD'||
 index?.sources?.p28?.meshCount!==59||
 index?.sources?.p212?.meshCount!==19||
 index?.sources?.p214?.meshCount!==16)
 throw Error('CAD stage does not contain all 94 original named source meshes');

const destination=resolve(process.env.PEDS_MODEL_B_CAD_QA_OUTPUT||
 'artifacts/model-b-cad-assembly');
await mkdir(destination,{recursive:true});
const steps=[
 {label:'00-original',progress:0},
 {label:'01-cutaway',progress:.22},
 {label:'02-wheel-core',progress:.42},
 {label:'02-native-hardware-dots',progress:.535},
 {label:'03-four-corners',progress:.62},
 {label:'04-wheel-stagger',progress:.735},
 {label:'04-rear-joints',progress:.78},
 {label:'05-final-car',progress:.94},
 {label:'reverse-wheel-stagger',progress:.735},
 {label:'reverse-native-hardware-dots',progress:.535},
 {label:'reverse-02',progress:.42},
 {label:'reverse-00',progress:0},
];
const layouts=[
 {label:'desktop',width:1440,height:900},
 {label:'mobile',width:390,height:844},
];
const browser=await chromium.launch({
 headless:true,
 ...(process.env.PEDS_CHROMIUM_PATH
   ?{executablePath:process.env.PEDS_CHROMIUM_PATH}:{})
});
let shots=0;
try{
 for(const layout of layouts){
  const page=await browser.newPage({
   viewport:{width:layout.width,height:layout.height},
   deviceScaleFactor:1,reducedMotion:'no-preference',
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(target.href,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>{
    const el=document.querySelector('.mb-build-source-wrap');
    if(!el)return false;
    return el.getAttribute('data-model-b-cad-verified-meshes')==='94'&&
     el.getAttribute('data-original-model-b-wheel-fit')==='true'&&
     el.getAttribute('data-wheel-station-count')==='4'&&
     el.getAttribute('data-rear-composite-cad-parts')==='31'&&
     el.getAttribute('data-model-b-mounted-source-identity')==='PASS'&&
     el.getAttribute('data-model-b-front-p28-per-station')==='59'&&
     el.getAttribute('data-model-b-rear-toe-per-station')==='15'&&
     el.getAttribute('data-model-b-rear-joint-per-station')==='16'&&
     Number(el.getAttribute('data-model-b-authentic-cad-vertex-dots'))>0&&
     Number(el.getAttribute('data-model-b-authentic-cad-fastener-dot-meshes'))>0;
   },undefined,{timeout:90000});
   const source=await page.locator('.mb-build-source-wrap').evaluate(el=>({
    blob:el.getAttribute('data-owner-model-b-git-blob-sha1'),
    stage:el.getAttribute('data-model-b-source-review-stage'),
    verified:el.getAttribute('data-model-b-cad-verified-meshes'),
    p28:el.getAttribute('data-p28-cad-ready'),
    p212:el.getAttribute('data-p212-cad-ready'),
    p214:el.getAttribute('data-p214-cad-ready'),
    wheels:el.getAttribute('data-wheel-station-count'),
    rearParts:el.getAttribute('data-rear-composite-cad-parts'),
    replaced:el.getAttribute('data-rear-legacy-bearing-proxies-hidden'),
    mountedIdentity:el.getAttribute('data-model-b-mounted-source-identity'),
    mounted:el.getAttribute('data-model-b-mounted-cad-meshes'),
    sourceVertexDots:el.getAttribute('data-model-b-authentic-cad-vertex-dots'),
    fastenerVertexLayers:el.getAttribute('data-model-b-authentic-cad-fastener-dot-meshes'),
    mountedFrontPerStation:el.getAttribute('data-model-b-front-p28-per-station'),
    mountedRearProxyPerStation:el.getAttribute('data-model-b-rear-p28-proxy-per-station'),
    mountedRearToePerStation:el.getAttribute('data-model-b-rear-toe-per-station'),
    mountedRearJointPerStation:el.getAttribute('data-model-b-rear-joint-per-station'),
    certified:el.getAttribute('data-original-mechanical-mate-certified'),
    rearCertified:el.getAttribute('data-rear-mechanical-mate-certified'),
    sourceCertified:el.getAttribute('data-model-b-source-mechanical-mate-certified'),
   }));
   if(source.blob!=='74fbd44daf709d0d368adef9de66e4e22a49fed4'||
    source.stage!=='ALL_AVAILABLE_SOURCES'||source.verified!=='94'||
    source.p28!=='true'||source.p212!=='true'||source.p214!=='true'||
    source.wheels!=='4'||source.rearParts!=='31'||source.replaced!=='4'||
    source.mountedIdentity!=='PASS'||
    !(Number(source.sourceVertexDots)>=1024&&
      Number(source.sourceVertexDots)<=10544)||
    !(Number(source.fastenerVertexLayers)>0&&
      Number(source.fastenerVertexLayers)<=24)||
    source.mountedFrontPerStation!=='59'||
    source.mountedRearToePerStation!=='15'||
    source.mountedRearJointPerStation!=='16'||
    !(Number(source.mountedRearProxyPerStation)>0)||
    Number(source.mounted)!==180+
      2*Number(source.mountedRearProxyPerStation)||
    source.certified!=='false'||source.rearCertified!=='false'||
    source.sourceCertified!=='false')
    throw Error('Original CAD assembly evidence rejected: '+JSON.stringify(source));
   const canvas=page.locator('.mb-build-webgl canvas');
   await canvas.waitFor({state:'visible',timeout:20000});
   const images=new Map();
   const rows=[];
   for(const [stepIndex,step] of steps.entries()){
    const previousR3fFrame=await canvas.evaluate(el=>{
     const raw=el.dataset.pedsModelBRenderFrame;
     return raw===undefined?0:Number(raw);
    });
    await page.evaluate(fraction=>{
     const track=document.querySelector('.mb-build-track');
     if(!track)throw Error('Model B scroll track absent');
     const r=track.getBoundingClientRect();
     const baseY=window.scrollY+r.top;
     window.scrollTo({top:baseY+
      Math.max(1,r.height-window.innerHeight)*fraction,behavior:'instant'});
    },step.progress);
    await page.waitForFunction(fraction=>{
     const slider=document.querySelector('.mb-build-scrubber');
     return slider instanceof HTMLInputElement&&
      Math.abs(Number(slider.value)/1000-fraction)<.012;
    },step.progress,{timeout:6000});
    // The DOM scrubber reaches the target before R3F's smoothed camera.
    // Require the actual Model B THREE scene AND camera to settle in at
    // least two subsequent frames before inspecting native CAD pixels.
    const requireNewTarget=stepIndex>0;
    await page.waitForFunction(({target,firstFrame,requireNewTarget})=>{
     const el=document.querySelector('.mb-build-webgl canvas');
     if(!(el instanceof HTMLCanvasElement))return false;
     const read=name=>el.dataset[name]===undefined?
       NaN:Number(el.dataset[name]);
     const frame=read('pedsModelBRenderFrame');
     const issued=read('pedsModelBTargetIssuedFrame');
     const progress=read('pedsModelBSceneProgress');
     const cameraError=read('pedsModelBCameraErrorM');
     const visible=read('pedsModelBVisibleCadDots');
     const rendered=read('pedsModelBRenderedCadDots');
     return el.dataset.pedsModelBSceneSettled==='true'&&
       Number.isSafeInteger(frame)&&Number.isSafeInteger(issued)&&
       frame>=firstFrame+2&&frame>=issued+2&&
       (!requireNewTarget||issued>firstFrame)&&
       Number.isFinite(progress)&&Math.abs(progress-target)<=.004&&
       Number.isFinite(cameraError)&&cameraError<=.015&&
       Number.isSafeInteger(visible)&&Number.isSafeInteger(rendered)&&
       (visible===0||(el.dataset.pedsModelBRenderEvidence==='OBSERVED'&&
         rendered>0));
    },{target:step.progress,firstFrame:previousR3fFrame,
       requireNewTarget},{timeout:18000});
    // P2.47: distinguish scheduled drawRange counts from real Three.js
    // onAfterRender callbacks. A range request alone is NOT GPU evidence.
    // Read scene/camera and post-render callbacks atomically from one
    // canvas snapshot. Separate page.evaluate calls could mix two frames.
    const snapshot=await canvas.evaluate(el=>{
     const read=name=>el.dataset[name]===undefined?
       NaN:Number(el.dataset[name]);
     const dots={
      scheduled:read('pedsModelBDrawnCadDots'),
      scheduledVisible:read('pedsModelBVisibleCadDots'),
      scheduledInspection:read('pedsModelBInspectionCadDots'),
      rendered:read('pedsModelBRenderedCadDots'),
      renderedInspection:read('pedsModelBRenderedInspectionDots'),
      drawCalls:read('pedsModelBRenderCalls'),
      frame:read('pedsModelBRenderFrame'),
      evidence:el.dataset.pedsModelBRenderEvidence,
     };
     return {
      frame:dots.frame,
      targetIssuedFrame:read('pedsModelBTargetIssuedFrame'),
      sceneProgress:read('pedsModelBSceneProgress'),
      cameraErrorM:read('pedsModelBCameraErrorM'),
      settled:el.dataset.pedsModelBSceneSettled,
      scheduledVisible:dots.scheduledVisible,rendered:dots.rendered,
      drawCalls:dots.drawCalls,evidence:dots.evidence,dots,
     };
    });
    assertSourceCadFrameSnapshot(snapshot,{
     targetProgress:step.progress,previousFrame:previousR3fFrame,
     requireNewTarget,
    });
    const dots=snapshot.dots;
    assertSourceCadDrawEvidence(dots,{
     requireBuild:step.label==='02-native-hardware-dots',
    });
    if((step.label==='00-original'||step.label==='reverse-00'||
        step.label==='05-final-car')&&dots.rendered!==0)
     throw Error('Native CAD construction dots rendered outside build chapter');
    const png=await canvas.screenshot();
    const audit=assertModelBFrameVisible(await analyzeModelBFrame(png),{
     finalFrame:step.label==='05-final-car',
    });
    const sha256=createHash('sha256').update(png).digest('hex');
    images.set(step.label,png);
    rows.push({step:step.label,progress:step.progress,sha256,
     actualSceneConvergence:{
       frame:snapshot.frame,targetIssuedFrame:snapshot.targetIssuedFrame,
       actualSceneProgress:snapshot.sceneProgress,
       cameraErrorM:snapshot.cameraErrorM,sceneSettled:snapshot.settled,
     },actualGpuDotDraw:dots,
     foregroundFraction:audit.foregroundFraction,bounds:audit.bounds});
    await writeFile(join(destination,layout.label+'-'+step.label+'.png'),png);
    shots++;
   }
   const difference=await modelBFrameDifference(
    images.get('02-wheel-core'),images.get('05-final-car'));
   if(difference<.002)
    throw Error('Wheel build and full-car source CAD frames are visually identical');
   const staggerDifference=await modelBFrameDifference(
    images.get('04-wheel-stagger'),images.get('04-rear-joints'));
   if(staggerDifference<.002)
    throw Error('Four-wheel stagger has no visible CAD source progression');
   const hardwareDifference=await modelBFrameDifference(
    images.get('02-native-hardware-dots'),images.get('02-wheel-core'));
   if(hardwareDifference<.002)
    throw Error('Native fastener vertex assembly has no visible progression');
   const hardwareGpu=rows.find(row=>
     row.step==='02-native-hardware-dots')?.actualGpuDotDraw;
   const beforeGpu=rows.find(row=>
     row.step==='02-wheel-core')?.actualGpuDotDraw;
   if(!hardwareGpu||!beforeGpu||
      hardwareGpu.rendered<=beforeGpu.rendered)
    throw Error('Actual P2.8 hardware render callback count did not increase');
   const partButton=page.getByRole('button',{name:/EXPLORE REAL CAD PARTS/});
   await partButton.click();
   const list=page.locator('.mb-build-catalog-row');
   await list.first().waitFor({state:'visible',timeout:12000});
   // After reverse-00, the selected original part must focus at the current
   // scroll chapter. The old catalog incorrectly jumped to progress .95.
   const progressBefore=Number(await page.locator('.mb-build-scrubber').inputValue());
   if(!Number.isFinite(progressBefore)||progressBefore>20)
    throw Error('P2.40 X-ray must start at the early reveal chapter');
   const beforeSelectFrame=await canvas.evaluate(el=>{
    const value=el.dataset.pedsModelBRenderFrame;
    return value===undefined?NaN:Number(value);
   });
   await list.first().click();
   const inspector=page.locator('.mb-build-part-inspector');
   await inspector.waitFor({state:'visible',timeout:12000});
   const selected=await inspector.getAttribute('data-inspected-cad-part-id');
   const label=(await inspector.innerText()).toUpperCase();
   if(!selected||!label.includes('VISUAL ONLY')||!label.includes('G2 HOLD'))
    throw Error('Original CAD source part inspection did not preserve G2 truth');
   await page.waitForFunction(()=>{
    const el=document.querySelector('.mb-build-source-wrap');
    return el?.getAttribute('data-model-b-cad-xray-active')==='true'&&
      el.getAttribute('data-model-b-cad-xray-compositing')==='PASS';
   },undefined,{timeout:12000});
   const progressFocused=Number(await page.locator('.mb-build-scrubber').inputValue());
   if(Math.abs(progressFocused-progressBefore)>12)
    throw Error('Selecting original CAD source hijacked the user scroll position');
   // The source part can be verified while the camera is still flying
   // toward it; wait for actual 3D camera convergence before the PNG.
   await page.waitForFunction(previousFrame=>{
    const el=document.querySelector('.mb-build-webgl canvas');
    if(!(el instanceof HTMLCanvasElement))return false;
    const read=name=>el.dataset[name]===undefined?
      NaN:Number(el.dataset[name]);
    const frame=read('pedsModelBRenderFrame');
    const issued=read('pedsModelBTargetIssuedFrame');
    const scheduled=read('pedsModelBInspectionCadDots');
    const rendered=read('pedsModelBRenderedInspectionDots');
    return el.dataset.pedsModelBSceneSettled==='true'&&
      Number.isSafeInteger(frame)&&Number.isSafeInteger(issued)&&
      issued>previousFrame&&frame>=issued+2&&
      read('pedsModelBCameraErrorM')<=.015&&
      Number.isSafeInteger(scheduled)&&
      Number.isSafeInteger(rendered)&&rendered>0&&
      rendered<=scheduled&&
      el.dataset.pedsModelBRenderEvidence==='OBSERVED';
   },beforeSelectFrame,{timeout:18000});
   const xrayDotCount=await canvas.evaluate(el=>{
    const scheduled=el.dataset.pedsModelBInspectionCadDots;
    const rendered=el.dataset.pedsModelBRenderedInspectionDots;
    const evidence=el.dataset.pedsModelBRenderEvidence;
    const count=rendered===undefined?NaN:Number(rendered);
    if(scheduled===undefined||!Number.isSafeInteger(Number(scheduled))||
       evidence!=='OBSERVED')return NaN;
    return count;
   });
   if(!Number.isSafeInteger(xrayDotCount)||xrayDotCount<1||
      xrayDotCount>1200)
    throw Error('Original CAD X-ray lacks actual Three.js point render callback');
   const focusPng=await canvas.screenshot();
   assertModelBFrameVisible(await analyzeModelBFrame(focusPng));
   const focusDifference=await modelBFrameDifference(
    images.get('05-final-car'),focusPng);
   if(focusDifference<.002)
    throw Error('Selected original CAD part did not visibly focus in WebGL');
   await writeFile(join(destination,layout.label+'-selected-cad-xray.png'),
     focusPng);
   shots++;
   // P2.50: a cleared inspection requires an entirely new source
   // target epoch, not the last settled frame of the selected component.
   const beforeClearFrame=await canvas.evaluate(el=>{
    const value=el.dataset.pedsModelBRenderFrame;
    return value===undefined?NaN:Number(value);
   });
   await page.getByRole('button',{name:'Clear selected CAD part'}).click();
   await page.waitForFunction(()=>{
    const el=document.querySelector('.mb-build-source-wrap');
    return el?.getAttribute('data-model-b-cad-xray-active')==='false'&&
      el.getAttribute('data-model-b-cad-xray-compositing')==='OFF';
   },undefined,{timeout:12000});
   const progressRestored=Number(await page.locator('.mb-build-scrubber').inputValue());
   if(Math.abs(progressRestored-progressBefore)>12)
    throw Error('Clearing CAD X-ray changed the scroll position');
   await page.waitForFunction(previousFrame=>{
    const el=document.querySelector('.mb-build-webgl canvas');
    if(!(el instanceof HTMLCanvasElement))return false;
    const read=name=>el.dataset[name]===undefined?
      NaN:Number(el.dataset[name]);
    const frame=read('pedsModelBRenderFrame');
    const issued=read('pedsModelBTargetIssuedFrame');
    return el.dataset.pedsModelBSceneSettled==='true'&&
      Number.isSafeInteger(frame)&&Number.isSafeInteger(issued)&&
      issued>previousFrame&&frame>=issued+2&&
      read('pedsModelBCameraErrorM')<=.015&&
      read('pedsModelBRenderedInspectionDots')===0&&
      read('pedsModelBInspectionCadDots')===0;
   },beforeClearFrame,{timeout:18000});
   const selectedPointsAfterClear=await canvas.evaluate(el=>{
    const value=el.dataset.pedsModelBRenderedInspectionDots;
    return value===undefined?NaN:Number(value);
   });
   if(selectedPointsAfterClear!==0)
    throw Error('Original CAD inspection vertex dots leaked after clearing focus');
   const restoredPng=await canvas.screenshot();
   assertModelBFrameVisible(await analyzeModelBFrame(restoredPng));
   const restoredDifference=await modelBFrameDifference(focusPng,restoredPng);
   if(restoredDifference<.002)
    throw Error('Clearing X-ray did not visually restore original scroll scene');
   await writeFile(join(destination,layout.label+'-cad-focus-cleared.png'),
     restoredPng);
   shots++;
   if(errors.length)throw Error('Browser JavaScript errors: '+errors.join(' ; '));
   await writeFile(join(destination,layout.label+'-audit.json'),
    JSON.stringify({layout,source,chapterDifference:difference,
     selectedOriginalCadPart:selected,xrayFrameDifference:focusDifference,
     fourWheelStaggerDifference:staggerDifference,
     nativeHardwareProgressDifference:hardwareDifference,
     inspectedSourceGpuDotCount:xrayDotCount,
     selectedSourceGpuDotsAfterClear:selectedPointsAfterClear,
     xrayClearDifference:restoredDifference,progressBefore,
     progressFocused,progressRestored,frames:rows},null,2)+'\n');
   console.log('PASS '+layout.label+': 94 source meshes, 4 native-vertex sampled tyre overlays, exact four-corner CAD IDs, 31 rear source meshes/station, 28 screenshots across both layouts.');
  }finally{
   await page.close();
  }
 }
 console.log('PASS P2.40 source-CAD four-wheel and reversible X-ray visual review: '+shots+' screenshots in '+destination);
}finally{
 await browser.close();
}
