# P1.2 — Center-lock and outer-wheel cinematic extraction

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Feature branch:** `feat/engineering-inside-machine-v2` · PR #4 (Draft)  
**Release status:** HOLD · DEV only · never deploy or merge without owner review.

## Objective / smallest possible physical motion gate

P1.1 introduced a seven-component wheel pilot. P1.2 concentrates on the **first two** source parts only:

1. `FRONT_LEFT_WHEEL.CENTER_LOCK_NUT` (`PEDS_CENTER_LOCK_NUT`)
2. `FRONT_LEFT_WHEEL.WHEEL_OUTER` (`PEDS_WHEEL_OUTER`)

The other five source parts must remain at their original positions while P1.2 is active. A separate **ALL 7 PARTS** control remains available for full-scene regression.

## Verified issue: original animated separation hides the nut

An inspection of the genuine R4.5 GLBs (HIGH/BALANCED/PERFORMANCE) found the following **world-space axial AABB bounds** in GLB Y-up / -Z-outward coordinates:

| Source geometry | World -Z outboard face | World +Z inboard face |
|---|---:|---:|
| Center-lock nut | -1.0433 m | -0.9744 m |
| Outer wheel assembly | -1.0314 m | -0.5475 m |

The owner-authored source offsets are **0.34 m** for the nut and **0.66 m** for the outer wheel, both toward glTF -Z. On full extraction, the wheel extends farther than the nut:

`gap = (wheel outboard face - wheel displacement) - (nut inboard face - nut displacement)`

| Geometry profile | Original full-extraction gap | P1.2 presentation gap |
|---|---:|---:|
| HIGH | **-0.3770 m** (nut obscured by wheel) | **+0.1230 m** |
| BALANCED | **-0.3770 m** (nut obscured by wheel) | **+0.1230 m** |
| PERFORMANCE | **-0.3770 m** (nut obscured by wheel) | **+0.1230 m** |

**Correction:** the P1.2 *presentation* offset for the nut is **0.84 m**, while wheel remains **0.66 m**. The 0.123 m positive axial separation clears the wheel's outer bounding face. **The original GLB and manifest are unchanged.**

This is a bounding-box visual-clearance test, not proof of complete triangle-mesh collision avoidance or real F1 mechanical attachment. Shaft–hub fitment remains unproven.

### Reproducible source audit

```sh
python tools/inside-the-machine/p1/audit_center_lock_clearance.py \
  --source /path/to/inside-the-machine.zip \
  --out /tmp/p1-2-clearance.json
```

The audit uses only Python standard library, checks all three owner-exported GLBs, computes glTF world transforms from the actual node hierarchy, and rejects presentation clearance below **0.08 m**.

## Exact cinematic beat contract

The page retains one deterministic progress scalar `[0,1]`, allowing arbitrary reverse scrubbing.

| Stage | Normalized timeline | Intent |
|---|---|---|
| Unlock | 0.255–0.312 | Nut turns on its real -Z wheel axis, before any extraction |
| Nut out | 0.318–0.400 | Nut moves away from wheel; outer wheel stays fixed |
| Wheel out | 0.412–0.495 | Wheel moves along the real axle; nut already clear |
| Remainder (full mode only) | 0.455–0.540 | Hub, disc, caliper, links and interface unfold in staggered layers |
| Technical hold | 0.540–0.860 | Wheel is separated; reversible Blueprint/Macro treatments |
| Mount/interface return | 0.860–0.885 | Return of internal mount |
| Hub/brake/link returns | 0.872–0.940 | Internal components return toward original local transforms |
| Wheel seats | 0.920–0.952 | Outer wheel returns while nut remains extracted |
| Nut seats | 0.955–0.978 | Nut returns after the wheel is seated |
| Relock | 0.978–1.000 | Nut completes visual re-lock turn; original transform restored |

The 2-turn nut rotation is a *stylized cinematic cue* around source geometry, **not a claim of a verified real-world torque or pit-stop procedure**.

### P1.2 UI

DEV-only `/engineering/p1-front-left`:

- Default control: **P1.2 / LOCK + WHEEL**; only nut and outer wheel animate.
- Alternate **ALL 7 PARTS** enables full-corner regression.
- **LOCK OUT** jumps to 40%; **FULL EXPLODE** to 54%.
- Selecting one of the other five parts automatically switches to full mode.
- Blueprint overlays are only allocated for active wheel parts, **not for every chassis mesh**, eliminating invisible duplicate draw calls.
- Guided cinematic camera and free OrbitControls are mutually exclusive; no camera competition.

## QA contract — numeric gate only

- [x] Three actual R4.5 source GLB variants audited offline.
- [x] Original negative clearance detected.
- [x] New presentation gap >0.08 m on all profiles.
- [x] Stage ordering encoded in pure TypeScript and unit tests.
- [x] 0% and 100% restore immutable original local positions and rotation.
- [x] Pilot view includes P1.2 two-component focus.
- [x] Scope-limited technical overlays avoid all-car transparent second pass.
- [ ] Real browser screenshot proof of center-lock/outer-wheel with correctly lit cinematic materials.
- [ ] Direct continuous WebGL playback forward and reverse, 375/768/1440/1920 px.
- [ ] Full triangle-mesh interpenetration QA at intermediate frames.
- [ ] GPU timing/frame-budget measurements and context loss/recovery on lower-spec hardware.
- [ ] Cinematic visual scores >=4/5 in every visual dimension.
- [ ] Owner approval.

**Decision:** P1.2 code and axial-geometry contract ready for automated CI; visual acceptance still HOLD. Do not mark the entire wheel or all 65 parts complete.
