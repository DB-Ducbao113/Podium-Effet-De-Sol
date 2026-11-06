# CAD-FIRST — Consolidated program, remaining gates and final owner review

**Project:** Podium Effet De Sol / Inside the Machine  
**Revision:** 2026-11-07  
**Working branch:** `feat/engineering-inside-machine-v2` / Draft PR #4  
**Direction:** Original parametric CAD → justified source hardware → cinematic 3D → measured web delivery  
**Owner instruction:** Run all useful stages without repeated approval requests. Do not run/inspect/await CI. Do not merge or deploy. Final owner review only after a single evidence package is assembled.

This document is an **honest scope ledger**, not a declaration that every future idea is already finished. New issues discovered during implementation are tracked here instead of being silently called PASS.

## Current results and unresolved gates

| Stage | Actual status | Verifiable output | What is still open |
|---|---|---|---|
| P1 V1 Model B lookdev | RETIRED | 37 pilot files removed from active feature branch, recoverable from Git history | Not a valid high-fidelity geometry foundation |
| P2.0 CAD pipeline | IMPLEMENTED/LOCAL CHECKED | Original STEP master + independent solids + 3 GLBs | Authentic F1 OEM geometry not established |
| P2.1 CAD source selection | RESEARCHED, RIGHTS HOLD | Source registry, STEP metadata and license notes | No third-party source approved for public commercial use |
| P2.2 original front corner | IMPLEMENTED/LOCAL CHECKED | 49-solid original CAD, B-Rep and LOD evidence | Low-detail engineering interfaces |
| P2.3 internal mechanical detail | IMPLEMENTED/LOCAL CHECKED | 58 solids, helical nut, bearing grooves, pistons | Manufacturing tolerances and realistic brake hydraulics |
| P2.4 static mechanical fit | IMPLEMENTED/LOCAL CHECKED | 53 solids, 1,378 source pairs considered, 0 collisions >0.05 mm³ at one pose | Motion and minimum separation distances |
| P2.5 sampled wheel spin | IMPLEMENTED/LOCAL CHECKED | 24 discrete angular poses, 3,036 exact B-Rep intersections, 0 over threshold | Continuously swept envelope, true bearing rolling physics |
| P2.6 sampled steering | IMPLEMENTED/LOCAL CHECKED | 53 native valid solids, 769 faces; 17 length-conserving mate samples and nine collision samples | 4-wheel and suspension kinematics, unsampled angles |
| P2.7 original double-wishbone subassembly | **SOURCE CAD + LOCAL SAMPLED AUDIT PASS** | 8 connected B-Rep solids, 31 hardpoint poses, 186 exact intersections without overlap >0.05 mm³ | Re-mate with P2.6 upright; full-corner coupled steering/bump remains OPEN |
| P3.1 CAD cinematic | CODE IMPLEMENTED | 26-second seven-beat film, source-named exploded parts, macro camera, studio PBR/PMREM, Blueprint/rebuild | WebGL video/screenshot visual acceptance |
| P3.2 hyperreal source geometry | **OPEN** | Defects and macro candidates identified | Tire bead/sidewall, valve, caliper hydraulic architecture, suspension joints, rotor cooling, sharp machined details |
| P4 web quality | CODE IMPLEMENTED | Per-tier DPR/AA/PMREM budget, WebGL FPS/draw-call overlay, context-loss status | Actual browser GPU benchmarks on representative devices |
| P5 source QA | LOCAL GEOMETRY AUDIT ONLY | Verified STEP/GLB hash and identities, P2.6 owner ZIP | Full TS/React build, runtime crashes, LOD visuals, reverse assembly, source loading tests |
| P6 app integration | DEV ONLY | /engineering/cad-lab; root Engineering DEV pilot | Mergeable architecture, production performance, license signoff, accessibility |
| P7 final release | HOLD | Draft PR #4 | Owner visual approval, legal/data rights, QA evidence; do not merge/deploy |

## Mechanical completion scope

### P2.8 full-corner source re-mating (CURRENT BLOCKER)
- P2.7 now has real project-authored STEP geometry: upper/lower A-arm bodies, four chassis bushings and two outer joint studs, eight solids. Its independent 31-pose Boolean audit measured 186 exact cross-part operations and passed after physically remodeling the outer through-bore.
- **Actual P2.8 neutral-pose preflight failed**: P2.7 new solids vs 51 retained P2.6 corner solids (after removing two obsolete links) = 408 considered cross-pairs; 10 exact B-Rep checks and four substantial upright interferences (about 3,033 to 12,714 mm³). This is recorded in the owner evidence pack and source audit tool `p2_8_full_corner_preflight.py`.
- The old P2.6 upright must be reauthored with actual compatible joint boss/clevis interfaces and separate positive manufacturing clearances; do not simply hide new A-arm parts or ignore penetrations in WebGL.
- Only after native source remodeling can the 59-solid intended combined assembly be audited at the neutral pose and across the 31 bump samples, then combine ±8° steering with bump and recheck safety envelopes.
- The new A-arm subassembly remains a separate CAD Lab mode until the full 59-part integration gate is passed.

### P2.9 hardware completion
- Bearing preload/retaining ring spacing, real axle interfaces, bolt shank/bore/fastener head seating, dust seals.
- Caliper cylinder piston seal, pads, pins and bridge topology; brake disc hat and thermal expansion representation.
- Rotor ventilation, tire bead seating and wheel valve geometry. These remain **original educational geometry**, not authenticated race manufacturer dimensions.
- Preserve local check scripts and save detailed inspection sections / solid validity evidence.
- Explicit requirement: prevent excessive runtime mass/draw calls; use genuine macro HIGH and low-end quality tier.

## Cinematic + Web completion scope

### P3.2 hyperreal visual acceptance
- In-browser matched capture of 0% Hero, 17% Lock, 34% Wheel, 51% Internal, 69% Blueprint, 82% Rebuild, 100% Hero.
- HIGH macro review on **all seven source-verified parts**; check silhouette and threads at intended zoom, normal seam smoothing, genuine rim spoke profile, rotor holes, piston clarity and blueprinted section readability.
- Work from source solid changes first. Visual tricks must not claim physical threads, additional mechanical bores or other nonexisting hardware.
- Studio PMREM/cloned materials may be refined only after comparing source vs resulting browser screenshots.
- Compare against owner-provided 59-second Anime.js reference as *art direction*, not claim an identical 3D geometry source.

### P4 browser/device performance
- Run manual DEV-only browser measurements at 375/768/1440/1920px; record actual FPS, draw calls, render triangles, memory/context loss and responsive clips.
- Film playback has 26-second deterministic timeline, Pause, seek, return-to-film, reduced motion. Test reverse seeking and original state restoration.
- Limit GPU allocations: PERFORMANCE drops PMREM and antialiasing, DPR max 1; BALANCED DPR max 1.5; HIGH DPR max 2.
- Make any further quality auto-scaling based on **measured** frame-time stability; do not invent GPU numbers.
- No silently looping unskippable intro or 5–7s forced waiting.

### P5 QA and release discipline
- Native CAD scripts are NOT CI. Their passing results only certify the exact source geometry questions they checked.
- Require local TS typecheck, relevant unit tests and real browser QA when the full repo and runtime assets are available; user specifically prohibited CI workflows, not reasonable local manual checks.
- Check no unrelated homepage, Showroom, Championship, API or Engineering legacy regressions.
- Ensure no source rights, licensed team logos or owner-only STEP/GLB binaries leak to public assets.
- Capture original/after WebGL snapshots and exact reproduction steps for failures.
- Owner gate is final decision. No merge or deploy until approval.

## Evidence bundle prepared

**`PODIUM_EDS_P2_6_P3_CAD_REVIEW.zip`** (owner review, not checked into Git):
- native STEP B-Rep master;
- HIGH/BALANCED/PERFORMANCE GLBs and original source manifest;
- local geometric and steering audits;
- six actual-source offline GLB frame renders and storyboard contact sheet;
- parametric source scripts and independent SHA-256 inventory.

The offline images show **actual GLB shapes**, but are **not** WebGL browser screenshots and do not establish the target photoreal quality. Source file geometry is Formula-style original project-authored educational CAD, not genuine certified F1 parts.

## Review status

**No production release is authorized.** The current combined implementation is a source-backed cinematic DEV prototype with unresolved engineering realism, browser visual, site QA and source-rights gates. Its incomplete stages are intentionally visible. This project is not represented as an F1 manufacturer's actual CAD pipeline.
