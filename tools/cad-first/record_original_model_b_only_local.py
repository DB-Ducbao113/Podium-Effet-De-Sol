#!/usr/bin/env python3
"""Record the ACTUAL repository-committed owner Model B GLB in Chromium.

Standalone, no P2.8 59-mesh binary needed, no fake/stock F1 geometry.
This is a REAL original-car showroom/camera review, NOT a full assembly
or proof that all fasteners/suspension are correctly mounted.

Uses localhost Vite/React/Three.js with Git-blob-verified original Model B.
Never runs GitHub Actions, PR, merge, deploy or public asset upload.
"""
from __future__ import annotations
import argparse,hashlib,json,os,shutil,subprocess,time,urllib.request
from pathlib import Path
from verify_original_model_b_asset import verify as verify_model_b

ROOT=Path(__file__).resolve().parents[2]
CHAPTERS=(
 ('THE MACHINE.',.06),('EVERY LAYER.',.23),
 ('BUILT FROM THE CORE.',.39),('FOUR CORNERS.',.57),
 ('THE DETAILS LOCK IN.',.75),('MODEL B. REASSEMBLED.',.94),
)
GIT_SHA='74fbd44daf709d0d368adef9de66e4e22a49fed4'

def sha(file:Path)->str:
    return hashlib.sha256(file.read_bytes()).hexdigest()

def wait_http(url:str,timeout_s:int=90)->None:
    end=time.monotonic()+timeout_s
    last=''
    while time.monotonic()<end:
        try:
            with urllib.request.urlopen(url,timeout=2) as response:
                if response.status==200:return
                last=f'HTTP {response.status}'
        except Exception as exc:last=str(exc)
        time.sleep(.5)
    raise RuntimeError('Original Model B localhost Vite route unavailable: '+last)

def record(url:str,out:Path,frames:int=96,fps:int=16,
           existing_vite:bool=False)->dict:
    if frames<48 or frames>360 or fps<8 or fps>60:
        raise ValueError('Real Chromium capture requires 48–360 frames, 8–60 FPS')
    if not url.startswith('http://127.0.0.1:5184/engineering/model-b-build'):
        raise ValueError('Original source-only gate is restricted to localhost:5184')
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Refuse overwrite of previous browser evidence')
    source=ROOT/'apps/web/public/models/model-b-eds-optimized-v1.glb'
    original=verify_model_b(source)
    if original['gitBlobSHA1']!=GIT_SHA or original['fileBytes']!=2120816:
        raise RuntimeError('Not the correct owner Model B original source')
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError('Python Playwright + installed Chromium required') from exc
    npm=shutil.which('npm');ffmpeg=shutil.which('ffmpeg')
    if not ffmpeg or (not existing_vite and not npm):
        raise RuntimeError('Need local FFmpeg and npm to record genuine WebGL')
    out.mkdir(parents=True,exist_ok=True)
    frames_dir=out/'actual-browser-frames'
    frames_dir.mkdir()
    job=None
    log=None
    audit={
      'schema':'podium-eds.owner-model-b.original-only-chromium.v1',
      'sourceFile':'apps/web/public/models/model-b-eds-optimized-v1.glb',
      'gitBlobSha1':GIT_SHA,
      'sourceFileBytes':2120816,
      'sourceIdentityPreflightVerified':True,
      'browserOriginalGlbHTTP200':False,
      'browserOriginalGlbDecodedAndHashVerified':False,
      'realWebglContextVerified':False,
      'originalMobilePerspectiveFrameVerified':False,
      'originalCarOnly':True,
      'p28WheelCadLoaded':False,
      'fullAssemblyVerified':False,
      'mechanicalMateCertified':False,
      'mechanicalG2':'HOLD',
      'chapters':{},'canvasSha256':{},'framesCaptured':0,
      'browserExceptions':[],'webglErrors':[],
      'mp4File':None,'complete':False,
    }
    def persist():
        (out/'original-model-b-browser-evidence.json').write_text(
            json.dumps(audit,indent=2)+'\n',encoding='utf8')
    try:
        if not existing_vite:
            log=(out/'vite-dev.log').open('wb')
            job=subprocess.Popen(
                [npm,'run','dev','--workspace=@peds/web','--',
                 '--host','127.0.0.1','--port','5184','--strictPort'],
                cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,
                start_new_session=(os.name!='nt'))
        probe_url=url.split('?')[0]+'?sourceOnly=1'
        wait_http(probe_url)
        with sync_playwright() as pw:
            browser=pw.chromium.launch(
                headless=True,
                args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
                      '--disable-dev-shm-usage'])
            context=browser.new_context(
                viewport={'width':1440,'height':900},
                device_scale_factor=1,
                reduced_motion='no-preference')
            page=context.new_page()
            responses=[]
            page.on('response',lambda response:responses.append(response.status)
                    if 'model-b-eds-optimized-v1.glb' in response.url else None)
            page.on('pageerror',lambda error:audit['browserExceptions'].append(str(error)))
            page.on('console',lambda msg:audit['webglErrors'].append(msg.text)
                    if msg.type=='error' and any(term in msg.text.lower() for term in (
                       'webgl','shader error','gl_invalid_operation')) else None)
            try:
                response=page.goto(probe_url,
                    wait_until='domcontentloaded',timeout=60000)
                if not response or response.status!=200:
                    raise RuntimeError('Original Model B DEV route HTTP error')
                page.get_by_text('OWNER MODEL B LOADED',exact=False).first.wait_for(timeout=90000)
                if page.get_by_role('dialog',name='F1 Start Lights Preloader').count():
                    raise RuntimeError('PODIUM fullscreen intro obscures actual original Model B Chromium proof')
                selector=(
                    '.mb-build-source-wrap'
                    '[data-owner-model-b-git-blob-sha1="'+GIT_SHA+'"]'
                    '[data-owner-model-b-git-file-bytes="2120816"]'
                    '[data-model-b-source-only-review="true"]'
                    '[data-p28-cad-ready="false"]')
                page.locator(selector).wait_for(timeout=30000)
                audit['browserOriginalGlbDecodedAndHashVerified']=True
                audit['browserOriginalGlbHTTP200']=200 in responses
                if not audit['browserOriginalGlbHTTP200']:
                    raise RuntimeError('Actual owner showroom GLB not served by HTTP 200')
                canvas=page.locator('.mb-build-webgl canvas')
                canvas.wait_for(state='visible',timeout=20000)
                glinfo=page.evaluate('''()=>{
                  const canvas=document.querySelector('.mb-build-webgl canvas');
                  const gl=canvas?.getContext('webgl2');
                  if(!gl)return null;
                  return {version:gl.getParameter(gl.VERSION),
                    width:canvas.width,height:canvas.height,
                    lost:gl.isContextLost()};
                }''')
                if (not glinfo or glinfo['lost'] or
                    min(glinfo['width'],glinfo['height'])<500):
                    raise RuntimeError('Original Model B did not open real full-res WebGL2')
                audit['webglContext']=glinfo
                audit['realWebglContextVerified']=True
                def seek(p:float,hold:int=450):
                    page.evaluate('''(progress)=>{
                      const el=document.querySelector('.mb-build-track');
                      if(!el)throw Error('Owner Model B scroll track missing');
                      const length=Math.max(1,el.getBoundingClientRect().height-innerHeight);
                      const top=scrollY+el.getBoundingClientRect().top;
                      window.scrollTo({top:top+length*progress,behavior:'instant'});
                    }''',p)
                    page.wait_for_timeout(hold)
                for i,(title,p) in enumerate(CHAPTERS):
                    seek(p,1050)
                    shown=page.locator('.mb-build-content h1').inner_text().strip()
                    if shown!=title:
                        raise RuntimeError(f'Chapter {i}: expected {title!r}, got {shown!r}')
                    if page.locator(
                        '.mb-build-source-wrap[data-model-b-scene-truth="SOURCE_ONLY_CAMERA"]'
                    ).count()!=1:
                        raise RuntimeError('Original showroom step falsely claimed mounted P2.8 components')
                    description=page.locator('.mb-build-copy').inner_text()
                    if len(description)<40:
                        raise RuntimeError('Original showroom source-only scope not disclosed')
                    screenshot=out/f'original-model-b-chapter-{i:02d}.png'
                    canvas.screenshot(path=str(screenshot))
                    digest=sha(screenshot)
                    audit['chapters'][str(i)]={'name':title,'progress':p,
                                              'canvasFile':screenshot.name,
                                              'sha256':digest}
                    audit['canvasSha256'][str(i)]=digest
                # The source-only owner car must ALSO fit the real mobile
                # camera: the old review had the car completely outside 390px.
                page.set_viewport_size({'width':390,'height':844})
                seek(.94,1550)
                page.locator('.mb-build-source-wrap'
                    '[data-final-car-bounds-fit="true"]').wait_for(timeout=20000)
                mobile=out/'owner-source-only-mobile-full-car.png'
                canvas.screenshot(path=str(mobile))
                audit['originalMobilePerspectiveFrameVerified']=True
                audit['originalMobileCanvasSha256']=sha(mobile)
                page.set_viewport_size({'width':1440,'height':900})
                seek(.94,1250)
                # Verify changes in the 3D canvas independently of HTML titles.
                if len(set(audit['canvasSha256'].values()))<5:
                    raise RuntimeError('Original source camera did not visually change in Chromium')
                for i in range(frames):
                    seek(i/(frames-1),145)
                    dest=frames_dir/f'frame_{i:04d}.jpg'
                    page.screenshot(path=str(dest),
                        type='jpeg',quality=88,full_page=False)
                    audit['framesCaptured']+=1
                    if i%16==0:persist()
                if audit['browserExceptions'] or audit['webglErrors']:
                    raise RuntimeError('Actual Chromium JavaScript/WebGL errors were recorded')
            except Exception as error:
                audit['failure']=str(error)
                persist()
                raise
            finally:
                context.close();browser.close()
        movie=out/'original-model-b-showroom-chromium.mp4'
        subprocess.run([
          ffmpeg,'-hide_banner','-loglevel','error','-y',
          '-framerate',str(fps),
          '-i',str(frames_dir/'frame_%04d.jpg'),
          '-c:v','libx264','-crf','18','-pix_fmt','yuv420p',
          '-movflags','+faststart',str(movie)],
          check=True,timeout=240)
        if not movie.is_file() or movie.stat().st_size<25000:
            raise RuntimeError('Real original Model B MP4 not encoded')
        audit['mp4File']=movie.name
        audit['mp4Bytes']=movie.stat().st_size
        audit['mp4Sha256']=sha(movie)
        audit['complete']=True
        persist()
        return audit
    finally:
        if job is not None and job.poll() is None:
            job.terminate()
            try:job.wait(timeout=8)
            except subprocess.TimeoutExpired:job.kill()
        if log is not None:log.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--url',
        default='http://127.0.0.1:5184/engineering/model-b-build')
    parser.add_argument('--frames',type=int,default=96)
    parser.add_argument('--fps',type=int,default=16)
    parser.add_argument('--existing-vite',action='store_true')
    a=parser.parse_args()
    result=record(a.url,a.out.resolve(),a.frames,a.fps,a.existing_vite)
    print('ACTUAL ORIGINAL MODEL B CHROMIUM SOURCE-ONLY MP4:',
          result['mp4File'],result['mp4Sha256'])
