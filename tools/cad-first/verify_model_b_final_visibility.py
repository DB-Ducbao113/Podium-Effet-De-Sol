#!/usr/bin/env python3
"""Fail-closed final Model B MOBILE WebGL canvas visibility regression.

This tests *pixels from a real Chromium canvas*, never HTML text / CSS
overlays or an AI-generated vehicle render. It is deliberately a coarse
foreground occupancy gate, not automated physical mating certification.

Input is the WebGL canvas-only screenshot after source GLB/CAD SHA and the
original-car final perspective framing checks have already passed.
"""
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path

def inspect(path:Path,require_mobile:bool=True)->dict:
    try:
        from PIL import Image
    except ImportError as error:
        raise RuntimeError('Pillow needed for original Model B canvas pixel QA') from error
    if not path.is_file():
        raise FileNotFoundError('Actual Chromium WebGL final canvas missing: '+str(path))
    with Image.open(path) as src:
        image=src.convert('RGB')
        w,h=image.size
        if w<300 or h<500:
            raise RuntimeError('Actual 3D canvas screenshot too small')
        if require_mobile and not (.35<=w/h<=.85):
            raise RuntimeError('Source screenshot is not a portrait mobile WebGL canvas')
        if not require_mobile and w/h<=1:
            raise RuntimeError('Desktop viewport did not render a landscape source canvas')
        # Avoid HTML headings, HUDs, and lateral side wheels. The centre
        # 40–72% vertical strip must contain the ORIGINAL VEHICLE silhouette,
        # not only isolated wheel circles off the left/right edges.
        y1,y2=int(h*.40),int(h*.72)
        stripe=[]
        for i in range(5):
            x1=int(w*(.17+i*.132))
            x2=int(w*(.17+(i+1)*.132))
            bright=0
            for y in range(y1,y2,3):
                for x in range(x1,x2,3):
                    r,g,b=image.getpixel((x,y))
                    if max(r,g,b)>62 and r+g+b>130:
                        bright+=1
            stripe.append(bright)
    center=stripe[1:4]
    threshold=45 if require_mobile else 180
    min_center_count=2
    # Old user review mobile final is black/empty in the central view; this
    # catches that image even if a bright CAD tyre enters one side of frame.
    clear_count=sum(n>=threshold for n in center)
    minimum_total=170 if require_mobile else 800
    status=(clear_count>=min_center_count and sum(center)>=minimum_total)
    return {
      'schema':'podium-eds.original-model-b.mobile-visibility-pixel.v1',
      'file':path.name,
      'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
      'canvasSize':[w,h],
      'centerBandSampleCounts':stripe,
      'centerBandsWithForeground':clear_count,
      'minimumCenterBands':min_center_count,
      'minimumCenterTotal':minimum_total,
      'thresholdPerBand':threshold,
      'passed':status,
      'scope':'VISUAL FRAME OCCUPANCY, NOT MECHANICAL CAD MATE',
      'mechanicalG2':'HOLD',
    }

def enforce(path:Path,require_mobile:bool=True)->dict:
    report=inspect(path,require_mobile)
    if not report['passed']:
        raise RuntimeError(
          'Original Model B final WebGL view fails centre foreground visibility: '+
          str(report['centerBandSampleCounts']))
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--image',type=Path,required=True)
    p.add_argument('--desktop',action='store_true')
    p.add_argument('--out',type=Path)
    a=p.parse_args()
    report=inspect(a.image,not a.desktop)
    if a.out:
        a.out.parent.mkdir(parents=True,exist_ok=True)
        a.out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
    if not report['passed']:
        raise SystemExit('FAIL: final source-car not visually visible in centre of real WebGL canvas')
    print('PASS: actual owner Model B final car foreground visible',report['canvasSize'])
