#!/usr/bin/env python3
"""Record the real original Model B scroll route using local Chromium + FFmpeg.

Inputs: checked-out Podium Effet De Sol Vite DEV server and original P2.8
manifest/GLB; optional source P2.12/P2.14 CAD exported in matching quality.
This script NEVER generates surrogate 3D, synthetic stills or pretend video.
It fails if Chromium, original Model B source or imported meshes cannot load.
No GitHub Actions, merge, deployment or external asset upload.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import time
from typing import Any

from record_four_corners_local import verify

CHAPTERS=('THE MACHINE.','EVERY LAYER.','BUILT FROM THE CORE.',
          'FOUR CORNERS.','THE DETAILS LOCK IN.','MODEL B. REASSEMBLED.')
SAMPLE_PROGRESS=(.06,.23,.39,.57,.75,.94)

def check_source(folder:Path,manifest_file:str,quality:str)->tuple[Path,Path,dict[str,Any]]:
    path=folder/manifest_file
    if not path.is_file():
        raise FileNotFoundError('Missing original source manifest: '+str(path))
    record=json.loads(path.read_text(encoding='utf8'))
    tier=record.get('profiles',{}).get(quality)
    if not isinstance(tier,dict):raise ValueError('Missing requested native CAD tier: '+quality)
    glb=folder/tier['file']
    if not glb.is_file() or glb.stat().st_size!=tier['bytes']:
        raise RuntimeError('Original source GLB missing or byte length changed: '+str(glb))
    digest=hashlib.sha256(glb.read_bytes()).hexdigest()
    if digest!=tier['sha256']:
        raise RuntimeError('Original source GLB SHA-256 mismatch: '+str(glb))
    return path,glb,record

def capture(url:str,out:Path,p28:Path,quality:str='BALANCED',
            p212:Path|None=None,p214:Path|None=None,frames:int=96,fps:int=16,
            require_auto_source:bool=False)->dict[str,Any]:
    if frames<48 or frames>360 or fps<8 or fps>60:
        raise ValueError('Capture must contain 48–360 real browser frames at 8–60 FPS')
    if p214 and not p212:
        raise ValueError('P2.14 split joints require genuine P2.12 source')
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError('Python Playwright and Chromium required on owner machine') from exc
    if not shutil.which('ffmpeg'):
        raise RuntimeError('ffmpeg is required to encode the actual browser frames')
    front_manifest,front_glb,front_record=verify(p28,quality)
    rear=check_source(p212,'P212_rear_toe_adjuster_manifest.json',quality) if p212 else None
    split=check_source(p214,'P214_split_race_manifest.json',quality) if p214 else None
    if front_record.get('schema')!='podium-eds.p2.cad-first.full-corner.remate.v1':
        raise RuntimeError('Not the original project P2.8 remate source')
    if rear and rear[2].get('schema')!='podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3':
        raise RuntimeError('P2.12 source is not the threaded v3 native geometry')
    if split and split[2].get('schema')!='podium-eds.p214.split-race-radial-assembly.v1':
        raise RuntimeError('P2.14 source is not the split-race native CAD')
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Browser evidence output must be empty: '+str(out))
    out.mkdir(parents=True,exist_ok=True)
    frames_dir=out/'real-browser-frames'
    frames_dir.mkdir()
    audit:dict[str,Any]={
      'schema':'podium-eds.model-b.original-source-scroll.chromium.v1',
      'route':url,'quality':quality,
      'originalModelBSourceFile':'/models/model-b-eds-optimized-v1.glb',
      'p28OriginalSHA256':front_record['profiles'][quality]['sha256'],
      'autoSourceMandatory':require_auto_source,'autoSourceVerified':False,
      'p212SHA256':rear[2]['profiles'][quality]['sha256'] if rear else None,
      'p214SHA256':split[2]['profiles'][quality]['sha256'] if split else None,
      'originalModelBHTTP200':False,'modelBDecoded':False,
      'p28Decoded59':False,'p212Decoded19':False,'p214Decoded16':False,
      'fourOriginalModelBWheelCentresRegistered':False,
      'originalP28CadScale':None,'rearMechanicalMateCertified':None,
      'rearCompositeCadMeshesPerStation':None,
      'formerBearingProxiesSuppressedPerStation':None,
      'browserJSExceptions':[],'webglErrors':[],'sourceImportErrors':[],
      'chapterScreenshots':{},'chapterCanvasSHA256':{},'renderedFrames':0,'videoFile':None,
      'mechanicalG2':'HOLD','genuineRearMechanicalAssemblyCertified':False,
      'allSixChaptersConfirmed':False,
      'originalCadCatalogSelectionVerified':False,
      'sourceCadFocusCameraVisualChanged':False,
      'selectedOriginalCadPartId':None,
    }
    def persist()->None:
        (out/'model-b-scroll-browser-evidence.json').write_text(
            json.dumps(audit,indent=2)+'\n',encoding='utf8')
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(
            headless=True,args=['--enable-webgl','--use-gl=angle',
                                '--use-angle=swiftshader','--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':1440,'height':900},
                                    device_scale_factor=1,
                                    reduced_motion='no-preference')
        page=context.new_page()
        model_responses=[]
        page.on('response',lambda response:model_responses.append(response.status)
                if 'model-b-eds-optimized-v1.glb' in response.url else None)
        page.on('pageerror',lambda error:audit['browserJSExceptions'].append(str(error)))
        page.on('console',lambda msg:audit['webglErrors'].append(msg.text)
                if msg.type=='error' and any(word in msg.text.lower() for word in
                   ('webgl','shader error','gl_invalid_operation','compile error'))
                else None)
        try:
            response=page.goto(url,wait_until='domcontentloaded',timeout=60000)
            if not response or response.status>=400:raise RuntimeError('DEV scroll route unavailable')
            page.get_by_text('OWNER MODEL B LOADED',exact=False).first.wait_for(timeout=90000)
            audit['modelBDecoded']=True
            audit['originalModelBHTTP200']=200 in model_responses
            if not audit['originalModelBHTTP200']:
                raise RuntimeError('Actual original Model B asset was not fetched with HTTP 200')
            canvas=page.locator('.mb-build-webgl canvas')
            canvas.wait_for(state='visible',timeout=20000)
            if require_auto_source:
                # This must work WITHOUT clicking import or uploading source
                # files. The checked real GLBs are served by local-only Vite.
                page.locator('.mb-build-source-wrap[data-p28-cad-ready="true"]').wait_for(timeout=90000)
                audit['p28Decoded59']=True
                if rear:
                    page.locator('.mb-build-source-wrap[data-p212-cad-ready="true"]').wait_for(timeout=90000)
                    audit['p212Decoded19']=True
                if split:
                    page.locator('.mb-build-source-wrap[data-p214-cad-ready="true"]').wait_for(timeout=90000)
                    audit['p214Decoded16']=True
                audit['autoSourceVerified']=True
            else:
                page.get_by_role('button',name='CAD SOURCE',exact=False).click()
                imports=page.locator('.mb-build-input')
                if imports.count()!=3:raise RuntimeError('Original P2.8/P2.12/P2.14 importer missing')
                imports.nth(0).locator('input[type=file]').nth(0).set_input_files(str(front_manifest))
                imports.nth(0).locator('input[type=file]').nth(1).set_input_files(str(front_glb))
                page.get_by_text('59 CAD MESHES DECODED',exact=True).wait_for(timeout=90000)
                audit['p28Decoded59']=True
                if rear:
                    imports.nth(1).locator('input[type=file]').nth(0).set_input_files(str(rear[0]))
                    imports.nth(1).locator('input[type=file]').nth(1).set_input_files(str(rear[1]))
                    page.get_by_text('19 CAD MESHES DECODED',exact=True).wait_for(timeout=45000)
                    audit['p212Decoded19']=True
                if split:
                    imports.nth(2).locator('input[type=file]').nth(0).set_input_files(str(split[0]))
                    imports.nth(2).locator('input[type=file]').nth(1).set_input_files(str(split[1]))
                    page.get_by_text('16 CAD MESHES DECODED · G2 HOLD',exact=True).wait_for(timeout=45000)
                    audit['p214Decoded16']=True
                page.get_by_role('button',name='Close CAD source input').click()
            fit=page.locator('.mb-build-source-wrap[data-original-model-b-wheel-fit="true"]')
            fit.wait_for(timeout=90000)
            attributes=fit.evaluate('''el=>({
              count:Number(el.dataset.wheelStationCount),
              p28Scale:Number(el.dataset.originalP28Scale),
              mechanicalMate:el.dataset.originalMechanicalMateCertified
            })''')
            if (attributes.get('count')!=4
                or attributes.get('p28Scale')!=1
                or attributes.get('mechanicalMate')!='false'):
                raise RuntimeError('Four real source wheel centres unmeasured or false mechanical certification')
            audit['fourOriginalModelBWheelCentresRegistered']=True
            audit['originalP28CadScale']=attributes['p28Scale']
            audit['rearMechanicalMateCertified']=False
            if rear:
                expected_parts=31 if split else 19
                expected_hidden=4 if split else 0
                page.locator(
                    '.mb-build-source-wrap[data-rear-composite-cad-parts="'
                    +str(expected_parts)+'"][data-rear-legacy-bearing-proxies-hidden="'
                    +str(expected_hidden)+'"]').wait_for(timeout=45000)
                actual=fit.evaluate('''el=>({
                  rearCount:Number(el.dataset.rearCompositeCadParts),
                  oldBearingsHidden:Number(el.dataset.rearLegacyBearingProxiesHidden),
                  rearMechanicalMate:el.dataset.rearMechanicalMateCertified
                })''')
                if (actual.get('rearCount')!=expected_parts
                    or actual.get('oldBearingsHidden')!=expected_hidden
                    or actual.get('rearMechanicalMate')!='false'):
                    raise RuntimeError('P2.12/P2.14 actual source rear CAD composition invalid')
                audit['rearCompositeCadMeshesPerStation']=actual['rearCount']
                audit['formerBearingProxiesSuppressedPerStation']=actual['oldBearingsHidden']
            errors=page.locator('.mb-build-feedback[role=alert]')
            if errors.count():
                raise RuntimeError('Source review UI reports: '+errors.first.inner_text())
            page.wait_for_timeout(800)

            def seek(p:float,hold_ms:int=140)->None:
                page.evaluate('''(progress)=>{
                  const track=document.querySelector('.mb-build-track');
                  if(!track)throw new Error('Original Model B scroll track missing');
                  const length=Math.max(1,track.getBoundingClientRect().height-innerHeight);
                  const y=scrollY+track.getBoundingClientRect().top+length*progress;
                  scrollTo({top:y,behavior:'instant'});
                }''',p)
                page.wait_for_timeout(hold_ms)

            sources=[]
            for index,(progress,title) in enumerate(zip(SAMPLE_PROGRESS,CHAPTERS)):
                seek(progress,250)
                actual=page.locator('.mb-build-content h1').inner_text().strip()
                if actual!=title:
                    raise RuntimeError(f'Original source scene chapter {index}: {actual!r} != {title!r}')
                screenshot=out/f'chapter_{index:02d}.png'
                page.screenshot(path=str(screenshot),full_page=False)
                digest=hashlib.sha256(screenshot.read_bytes()).hexdigest()
                audit['chapterScreenshots'][str(index)]={'title':title,'progress':progress,
                                                         'sha256':digest,'file':screenshot.name}
                canvas_image=out/f'chapter_{index:02d}_actual_webgl.png'
                canvas.screenshot(path=str(canvas_image))
                canvas_digest=hashlib.sha256(canvas_image.read_bytes()).hexdigest()
                audit['chapterCanvasSHA256'][str(index)]=canvas_digest
                sources.append(digest)
            if len(set(sources))<5:
                raise RuntimeError('Actual Model B browser frames failed to change across scroll chapters')
            if len(set(audit['chapterCanvasSHA256'].values()))<4:
                raise RuntimeError('Real WebGL CANVAS stayed visually static across the scroll; no fake MP4 allowed')
            audit['allSixChaptersConfirmed']=True

            # Exercise the same genuine source inspector used by raycasting
            # directly on original P2.8 meshes. The catalog is populated
            # from the exact SHA-verified original 59-mesh manifest; this
            # route neither invents nor simulates geometry for testing.
            seek(.94,600)
            before_focus=out/'cad-focus-original-camera-before.png'
            canvas.screenshot(path=str(before_focus))
            page.get_by_role('button',name='EXPLORE REAL CAD PARTS',exact=False).click()
            catalog=page.get_by_label('Verified original CAD component catalog')
            catalog.wait_for(state='visible',timeout=20000)
            catalog.get_by_role('textbox',name='Search original CAD components').fill(
                'P2_TYRE_SLICK_BODY')
            catalog.get_by_role('combobox',name='Filter by measured wheel station').select_option(
                'front-positive-z')
            catalog.get_by_role('button',name=(
                'Inspect CAD P2_TYRE_SLICK_BODY at front-positive-z')).click()
            selected=page.locator(
                '.mb-build-part-inspector[data-inspected-cad-part-id="P2_TYRE_SLICK_BODY"]')
            selected.wait_for(timeout=15000)
            if ('FRONT-POSITIVE-Z' not in selected.inner_text()
                or 'VISUAL ONLY' not in selected.inner_text()
                or not selected.get_by_text('CAMERA FOCUS / SOURCE GEOMETRY').is_visible()):
                raise RuntimeError('Selected source CAD panel failed provenance G2 check')
            audit['selectedOriginalCadPartId']='P2_TYRE_SLICK_BODY'
            audit['originalCadCatalogSelectionVerified']=True
            page.wait_for_timeout(1500)
            after_focus=out/'cad-focus-original-camera-after.png'
            canvas.screenshot(path=str(after_focus))
            if hashlib.sha256(before_focus.read_bytes()).hexdigest()==hashlib.sha256(
                    after_focus.read_bytes()).hexdigest():
                raise RuntimeError('Native source-part selection failed to alter real WebGL camera')
            audit['sourceCadFocusCameraVisualChanged']=True
            selected.get_by_role('button',name='Clear selected CAD part').click()
            page.wait_for_timeout(500)

            audit['canvasExists']=canvas.count()==1
            audit['canvasSourceDimensions']=page.evaluate(
                '()=>{const c=document.querySelector(".mb-build-webgl canvas");'
                'return c?[c.width,c.height]:null;}')
            if (not audit['canvasSourceDimensions'] or
                min(audit['canvasSourceDimensions'])<500):
                raise RuntimeError('3D canvas is not a real frame-resolution surface')
            for frame_index in range(frames):
                p=frame_index/(frames-1)
                seek(p,95)
                image=frames_dir/f'frame_{frame_index:04d}.jpg'
                page.screenshot(path=str(image),type='jpeg',quality=87,full_page=False)
                audit['renderedFrames']+=1
                if frame_index%16==0:persist()
            if audit['browserJSExceptions'] or audit['webglErrors']:
                raise RuntimeError('Real browser exceptions or WebGL shader errors were recorded')
        except Exception as error:
            audit['sourceImportErrors'].append(str(error))
            persist()
            raise
        finally:
            context.close()
            browser.close()
    if audit['renderedFrames']!=frames or not audit['allSixChaptersConfirmed']:
        raise RuntimeError('Cannot encode partial or fabricated Model B video')
    mp4=out/'model-b-real-browser-scroll.mp4'
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y',
         '-framerate',str(fps),'-i',str(frames_dir/'frame_%04d.jpg'),
         '-c:v','libx264','-crf','18','-pix_fmt','yuv420p',
         '-movflags','+faststart',str(mp4)]
    subprocess.run(cmd,check=True,timeout=240)
    if not mp4.is_file() or mp4.stat().st_size<25000:
        raise RuntimeError('Actual Model B WebGL MP4 encoding did not produce valid evidence')
    audit['videoFile']=mp4.name
    audit['videoBytes']=mp4.stat().st_size
    audit['videoSHA256']=hashlib.sha256(mp4.read_bytes()).hexdigest()
    audit['complete']=True
    persist()
    return audit

def main()->None:
    p=argparse.ArgumentParser()
    p.add_argument('--url',default='http://127.0.0.1:5184/engineering/model-b-build')
    p.add_argument('--p28-dir',type=Path,required=True)
    p.add_argument('--p212-dir',type=Path)
    p.add_argument('--p214-dir',type=Path)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--quality',choices=['HIGH','BALANCED','PERFORMANCE'],default='BALANCED')
    p.add_argument('--frames',type=int,default=96)
    p.add_argument('--require-auto-source',action='store_true')
    p.add_argument('--fps',type=int,default=16)
    a=p.parse_args()
    r=capture(a.url,a.out.resolve(),a.p28_dir.resolve(),a.quality,
              a.p212_dir.resolve() if a.p212_dir else None,
              a.p214_dir.resolve() if a.p214_dir else None,
              frames=a.frames,fps=a.fps,require_auto_source=a.require_auto_source)
    print('MODEL B REAL CHROMIUM VIDEO:',r['videoFile'],r['videoSHA256'])

if __name__=='__main__':main()
