# Inside the Machine V2 — Correct Repository Integration Ledger

**Target repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Base branch:** `migration/clean-architecture`  
**Feature branch:** `feat/engineering-inside-machine-v2`  
**Scope:** Engineering tab only, DEV runtime, no production enablement

## Repository correction

The earlier work was mistakenly created in `DB-Ducbao113/F1-Overview`, where there was no Inside-the-Machine V1. Draft PR #13 in that repository was **closed without merge**. The previous branch is abandoned and must not be deployed.

This repository has the actual REV4.2 implementation with six guided chapters, 75 transform targets, wheel-first reassembly, local Meshopt assets, quality lock, WebGL recovery, inspection, chapter jumps, source attribution, and evidence hooks. Overwriting it with the simpler prototype from the wrong repository would remove working functionality.

## Small-step migration mapping

| Previously attempted in wrong repository | Correct target state |
|---|---|
| `/engineering` route | Already exists in `apps/web/src/App.tsx` (DEV-only) |
| Basic 10-assembly / 65-part motion | Superseded by REV4.2 native 75-transform choreography |
| 0–100% timeline | Already exists, plus scroll chapters / beat rail / stage scrubbing |
| Isolate/Assemble/Reset | Already exists, including component/assembly isolation |
| Quality selection | Already exists, with locked profile and explicit restart |
| Fallback | Already exists, with locally verified WebP / GLB identity |
| Modern precision skin | V2 stylesheet added, scoped to Engineering only |
| Technical HUD | V2 live-state HUD added, no fabricated telemetry |
| Model B / R4.5 assets | **Not copied**. Actual V1 uses verified 2.25–2.76 MB REV4.2 Meshopt assets; license/manifest audit required before replacement |

## Completed in correct repository

1. Dedicated `feat/engineering-inside-machine-v2` branch created from `migration/clean-architecture`.
2. Isolated V2 visual language: graphite, sharp high-contrast borders, ignition orange, cyan for truthful data, reduced decorative glow.
3. Engineering-only live HUD: profile, story/inspection state, beat and progress.
4. Accessible responsive adjustments and reduced-motion accommodations.
5. No changes to Championship, Homepage, Showroom, API/jobs, primary navigation or global styles.

## Next micro-gates

- G1: Static ESLint, typecheck, unit tests, production exclusion and asset security checks.
- G2: DEV browser snapshots at 375/768/1440/1920, inspect 3D visibility and label contrast.
- G3: Measured material/lighting redesign on selected Model B profiles, review before bulk changes.
- G4: Verify 75-transform round-trip and wheel-first ordering from 0→100→0 at every quality profile.
- G5: Verify low-end GPU FPS, memory, first interactive frame, context restoration, keyboard and accessibility.
- G6: Owner visual acceptance; only then consider promotion beyond DEV.

**Release decision: HOLD.** No merge, no production deployment. Local source GLBs were not included in GitHub, in accordance with the existing asset boundary.
