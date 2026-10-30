"""Compare authored R4.3 shaft endpoints with hub pivots in the R4.4 manifest.

These are design coordinates, not manufacturer measurements or collision QA.
"""
import json
import math
from pathlib import Path

repo=Path(__file__).resolve().parents[3]
source=repo/'source-assets/models/inside-the-machine/authoring/r4-4-c'
m=json.loads((source/'assembly-manifest-r4-4-c.json').read_text(encoding='utf-8'))
records=[]
for side,sign in [('LEFT',1),('RIGHT',-1)]:
    wheel=next(a for a in m['assemblies'] if a['id']==f'REAR_{side}_WHEEL')
    pivot=wheel['pivotWorld']
    shaft_start=(-1.94,sign*.12,.40)
    shaft_end=(-2.11,sign*.62,.37)
    flange_center=(pivot[0],pivot[1]-sign*.055,pivot[2])
    vector=[shaft_end[i]-shaft_start[i] for i in range(3)]
    axial=abs(flange_center[1]-shaft_end[1])
    radial=math.hypot(flange_center[0]-shaft_end[0],flange_center[2]-shaft_end[2])
    axis_angle=math.degrees(math.atan2(math.hypot(vector[0],vector[2]),abs(vector[1])))
    records.append({'side':side,'shaftStart':shaft_start,'shaftOuterJointCenter':shaft_end,'hubPivot':pivot,'hubFlangeCenter':flange_center,'axialCenterGap':round(axial,6),'radialCenterOffset':round(radial,6),'shaftAxisToHubAxialAngleDeg':round(axis_angle,3),'exactMechanicalEngagementEstablished':False})
report={'basis':'R4.3 authoring script source endpoints and unchanged R4.4 manifest wheel pivots; model units; no manufacturer dimensions','records':records,'decision':'Retain accepted shaft/hub geometry. Earlier longer-shaft experiment violated exterior silhouette; current interface remains illustrative pending owner mechanical review.'}
(source/'shaft-hub-qa.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
