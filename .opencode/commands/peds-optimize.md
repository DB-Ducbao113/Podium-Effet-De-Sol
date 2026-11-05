---
description: Measure and optimize PEDS web performance while preserving behavior
---
Bottleneck/target: $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`; verify `rebuild` and existing tests first.
Collect actual before metrics at fixed route/device/network: LCP/INP/CLS when measurable, bundle sizes, network waterfall, React renders or Three.js FPS/memory appropriate to the bottleneck. Identify the dominant cause.
Optimize one cause at a time without breaking data accuracy, design boundaries, accessibility or 3D fallback. Compare before/after with the same setup.
Run full tests, build, applicable security gates and browser QA; if no measurement infrastructure exists, mark the claimed performance gain NOT MEASURED. Finish with rebuild local/remote checks and the PEDS report.
