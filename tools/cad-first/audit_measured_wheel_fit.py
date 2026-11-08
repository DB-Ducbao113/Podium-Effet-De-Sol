#!/usr/bin/env python3
"""Independent metric audit of actual decoded Model B / original P2.8 fit.
Examines browser-exported measurements, not fictitious hardpoints or CAD source.
Source CAD B-Rep remains unchanged. It does NOT certify physical mating.
"""
from __future__ import annotations
import argparse
import json
import math
from pathlib import Path

def audit(probe:dict,placement:dict)->dict:
    profile=placement.get("ownerSourceWheelCalibration")
    transform=placement.get("resolvedOriginalRootTransform")
    if not isinstance(profile,dict) or not isinstance(transform,dict):
        raise ValueError("Browser did not export real measured source calibration and resolved transform")
    if transform.get("stagingBasis")!="measured_wheel":
        raise ValueError("P2.8 still staged by graphical center, not wheel-envelope alignment")
    if transform.get("scale")!=1 or profile.get("p28Scale")!=1:
        raise ValueError("Native original P2.8 geometry MUST NOT be rescaled")
    scale=profile["normalizedShellScale"]
    if not isinstance(scale,(int,float)) or not .14<scale<.21:
        raise ValueError("Unknown original showroom source units")
    if abs(scale-transform.get("modelBShellUnitScale",0))>1e-7:
        raise ValueError("Browser displayed a different showroom scale")
    wheels=profile["wheels"]
    if len(wheels)!=4 or {(w["station"],w["side"]) for w in wheels} != {
      ("front",-1),("front",1),("rear",-1),("rear",1)}:
        raise ValueError("Four measured original Model B wheel envelopes required")
    if any(w["matchingWheelSamples"]<350 or w["hubSamples"]<100 for w in wheels):
        raise ValueError("Insufficient original source wheel geometry samples")
    radii=[w["outerRadiusM"] for w in wheels]
    tyre=probe["p28"]["subassemblies"]["P2_TYRE_SLICK_BODY"]["sourceBoundsM"]
    tyre_radius=max((tyre[1][i]-tyre[0][i])/2 for i in (0,1))
    deviations=[abs(x-tyre_radius) for x in radii]
    if max(deviations)>.015:raise ValueError("Tyre envelope error >15 mm; visual mate is inconsistent")
    if profile.get("radiusSpreadFraction",float("inf"))>.09:
        raise ValueError("Original shell tyre radius spread too high")
    center=profile["frontPositiveZCenterM"]
    source_center=profile["originalP28WheelCenterM"]
    actual=transform["translationM"]
    fit_position_error=math.dist(actual,[a-b for a,b in zip(center,source_center)])
    if fit_position_error>.005:raise ValueError("P2.8 wheel center not at the measured original front axle")
    if not 2.8<profile["axleSpacingPreviewM"]<3.5:
        raise ValueError("Model B normalized source wheelbase outside review window")
    original_meshes=probe["modelB"]["meshCount"]
    if original_meshes<1 or probe["p28"]["meshCount"]!=59:
        raise ValueError("Original decoded meshes missing")
    return {
      "status":"VISUAL_4_WHEEL_ENVELOPE_FIT_PASS",
      "mechanical_gate":"G2_HOLD",
      "full_car_2026_certified":False,
      "original_model_b_mesh_nodes":original_meshes,
      "original_p28_part_nodes":59,
      "showroom_source_to_m":scale,
      "original_p28_cad_scale":1,
      "measured_front_positive_z_center_m":center,
      "measured_wheel_radius_m":radii,
      "original_p28_tyre_radius_m":tyre_radius,
      "max_radial_deviation_m":max(deviations),
      "max_front_wheel_center_offset_m":fit_position_error,
      "normalized_visual_wheelbase_m":profile["axleSpacingPreviewM"],
      "warnings":[
        "Actual physical hardpoints and front-left handedness NOT verified",
        "Model B is a showroom polygon asset, not native chassis CAD",
        "No four-corner, suspension loading, tyre clearance or 2026 homologation signoff",
        "Original sources not modified: visual showroom shell receives a uniform scene-scale only"
      ]
    }

def main()->None:
    p=argparse.ArgumentParser()
    p.add_argument("--probe",type=Path,required=True)
    p.add_argument("--placement",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    result=audit(json.loads(a.probe.read_text(encoding="utf8")),
                 json.loads(a.placement.read_text(encoding="utf8")))
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8")
    print("REAL SOURCE WHEEL ENVELOPE VISUAL FIT PASS; mechanical G2 HOLD")

if __name__=="__main__":main()
