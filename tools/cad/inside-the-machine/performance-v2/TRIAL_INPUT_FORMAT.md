# Input format — one measured V2 trial

Run `node evaluate_v2.mjs measured.json`. For integration into a browser harness, fill every field from actual observations. **Do not put synthetic values in acceptance reports.**

```json
{
  "scenario": "full_traversal",
  "tabVisible": true,
  "hardwareAccelerated": true,
  "idleIntervalsMs": [16.7, 16.8],
  "activeIntervalsMs": [16.8, 33.4],
  "scenePoseUpdates": 200,
  "chaptersVisited": [0,1,2,3,4,5],
  "activeLongTaskDurationsMs": [],
  "firstInputToUpdatedFrameMs": 24.1
}
```

The short arrays above are **format examples only**, not valid trials. A valid trial must include at least 10 seconds of idle samples and at least 15 seconds of active samples, with real scene pose progress, actual GPU acceleration, visible tab and a Long Task observer result. `scenario` may be `full_traversal` or `reassembly`; reassembly additionally requires `maxTransformDelta: 0`. Persist timestamp, GPU identifier, refresh display mode, viewport/DPR, selected graphics tier, browser version and raw collector metadata in your full record and decision report (the offline evaluator does not inspect all metadata yet).

The evaluator reports one trial only. Overall qualification requires all scenarios and repetitions from the contract; this script alone **cannot** authorize integration or production.
