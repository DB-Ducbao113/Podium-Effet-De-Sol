# P2.34L/54 — Full candidate cage-translation sampled path solver

Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Engineering software milestone; no owner-source B-Rep execution or CV mechanical qualification. G2 HOLD.**

## Change from P2.34K

P2.34K linked only the independent best translation from each J pose. This could miss a sampled path through second-best local candidates. P2.34L modifies P2.34J to preserve the **complete set of J candidates passing its exploratory native screen** as `screenPassingCandidates`, with the full grid count and source pin; existing P2.34J output's best and baseline entries are retained.

The P2.34L dynamic-programming solver searches paths across all passing candidates at each phase, subject to sample-to-sample phase increment, shaft/cup increment ratio and shared cage translation bounds. It can return a path from a non-best initial candidate. No arbitrary fallback geometry or synthetic CAD is substituted. J reports generated before this change are rejected (they lack complete candidates). Original source identity remains SHA-256 `9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e`.

**Important:** The J candidate classifier is exploratory, not stress/torque certification. P2.34L still assumes the half-bend cage orientation inherited from J, and does not solve cage rotation, true cage pocket kinematics, inter-sample collision, or conjugate inner/outer race profile. A connected path is necessary screening evidence, not a constant-velocity mechanism acceptance. If no path is found on the finite grid, that does not prove all continuous mechanisms impossible.

## QA and execution

- `tools/cad-first/p2_34j_common_cage_rigid_search.py` now exports all screen-passing native candidates.
- `tools/cad-first/p2_34l_multi_candidate_path.py` contains the new candidate graph/dynamic program with fail-closed report schema, SHA and part-count validation.
- `tools/cad-first/test_p2_34l_multi_candidate_path.py` tests candidate bridging, disconnection, corruption, phase wrap and evidence overwrite. Local synthetic tests do not use STEP source.

```bash
cd tools/cad-first
python -m unittest -v test_p2_34l_multi_candidate_path.py
python p2_34l_multi_candidate_path.py --j-report pose0.json pose1.json pose2.json --out new-P234L-audit.json
```

**Input requirements:** 3+ independent regenerated P2.34J reports at the same bend, ordered by increasing shaft phase. Each source-authenticated pose must include its full screened candidate list. The solver records SHA-256 of all input JSON files; no overwrite.

The authentic owner P2.34E 84-solid STEP, source index and audit were unavailable in the current session. No real J candidate report was generated here. Mechanical G2 HOLD; no STEP redesign, Model B car integration, merge, deploy or GitHub Actions.

**Next P2.34M:** add cage orientation sampling, verify pockets and source B-Rep feasibility, test the whole pose range with multiple bends, and only then author changed-track STEP candidates with their own non-destructive provenance.
