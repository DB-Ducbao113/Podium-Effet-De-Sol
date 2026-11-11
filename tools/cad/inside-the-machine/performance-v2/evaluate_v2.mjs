#!/usr/bin/env node
/** Offline deterministic acceptance calculation for one full traversal / reassembly trial.
 *  No browser-side collection is performed by this script.
 *  Usage: node evaluate_v2.mjs path/to/recorded-trial.json
 *  Input rAF samples must be measured, not synthesized. No benchmark data is bundled.
 */
import fs from 'node:fs';

const q = (values, p) => {
  const a = [...values].sort((x, y) => x - y);
  const at = (a.length - 1) * p;
  const low = Math.floor(at), high = Math.ceil(at);
  return a[low] + (a[high] - a[low]) * (at - low);
};
const isValidSamples = v => Array.isArray(v) && v.length > 0 && v.every(x => Number.isFinite(x) && x > 0);
const round = n => Number(n.toFixed(4));
export function evaluate(trial) {
  const errors = [];
  const scenarios = ['first_scroll', 'full_traversal', 'reassembly'];
  if (!scenarios.includes(trial.scenario)) errors.push('Scenario missing/unsupported');
  for (const key of ['idleIntervalsMs', 'activeIntervalsMs']) {
    if (!isValidSamples(trial[key])) errors.push(`${key} missing/invalid`);
  }
  if (errors.length) return { status:'INCOMPLETE', errors };
  const idle = trial.idleIntervalsMs, active = trial.activeIntervalsMs;
  const P = q(idle, .5);
  if (idle.reduce((s, x) => s+x, 0) < 10000) errors.push('Idle calibration under 10 seconds');
  if (active.reduce((s, x) => s+x, 0) < 15000) errors.push('Active run under 15 seconds');
  if (!Number.isInteger(trial.scenePoseUpdates) || trial.scenePoseUpdates < 30) errors.push('Insufficient real scene pose updates');
  if (!Number.isInteger(trial.activeRenderFrames) || trial.activeRenderFrames < 30) errors.push('Insufficient real active render frames');
  if (trial.canvasBlank !== false) errors.push('Blank Canvas check missing/failed');
  if (!Number.isFinite(trial.refreshClockResolutionMs) || trial.refreshClockResolutionMs <= 0) errors.push('Clock resolution missing/invalid');
  if (['full_traversal', 'reassembly'].includes(trial.scenario) && (!Array.isArray(trial.chaptersVisited) || [0,1,2,3,4,5].some(v => !trial.chaptersVisited.includes(v)))) errors.push('Missing six-chapter coverage');
  if (trial.scenario === 'reassembly' && (trial.maxTransformDelta !== 0 || trial.transformCount !== 75)) errors.push('Reassembly transform parity missing/nonzero');
  if (!Array.isArray(trial.activeLongTaskDurationsMs)) errors.push('Missing active Long Task samples/observer result');
  if (!Number.isFinite(trial.firstInputToUpdatedFrameMs)) errors.push('Missing first input-to-updated-frame timing');
  if (trial.tabVisible !== true || trial.hardwareAccelerated !== true) errors.push('Tab visibility or real GPU acceleration unverified');
  const metadata = trial.metadata;
  if (!metadata || !metadata.browserVersion || !metadata.renderer || !metadata.os || !metadata.viewport || !Number.isFinite(metadata.dpr) || !metadata.tier || !metadata.powerState) errors.push('Mandatory run metadata missing');
  if (errors.length) return { status:'INCOMPLETE', errors, periodMs:round(P) };

  const idleP95 = q(idle,.95), p95 = q(active,.95), p99 = q(active,.99);
  const missed = active.filter(x => x > 1.5*P).length / active.length;
  const maxInterval = Math.max(...active);
  const longTasks = trial.activeLongTaskDurationsMs.filter(x => x >= 50).length;
  const threshold = Math.max(0.5, 0.05*P);
  const checks = {
    cadenceDelta: p95 - idleP95 <= threshold + 1e-8,
    missedRefresh: missed <= .02,
    p99Tail: p99 <= 2*P + .5,
    worstFrame: maxInterval <= 3*P + .2,
    noActiveLongTasks: longTasks === 0,
    firstInputResponse: trial.firstInputToUpdatedFrameMs <= 2*P + .5,
  };
  return {
    status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
    legacyP95Gate: p95 <= 16.7 ? 'PASS' : 'FAIL',
    scenario: trial.scenario,
    metrics: { periodMs: round(P), idleP95Ms:round(idleP95), activeP95Ms:round(p95), activeP99Ms:round(p99), worstIntervalMs:round(maxInterval), missedRefreshPct:round(missed*100), activeLongTaskCount:longTasks, firstInputToUpdatedFrameMs:round(trial.firstInputToUpdatedFrameMs) },
    checks,
    gpuTimingStatus: trial.gpuTiming?.supported === true
      ? (trial.gpuTiming.nonDisjoint === true && trial.gpuTiming.sampleCount > 0 ? 'MEASURED' : 'INCOMPLETE')
      : 'NOT MEASURED',
    note: 'One trial only. V2 qualification requires all mandatory valid trials/scenarios plus owner review. GPU timing and physical-device release gates are separate.'
  };
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\', '/'))) {
  const file = process.argv[2];
  if (!file) { process.stderr.write('Usage: node evaluate_v2.mjs trial.json\n'); process.exit(2); }
  const out = evaluate(JSON.parse(fs.readFileSync(file, 'utf8')));
  process.stdout.write(JSON.stringify(out,null,2)+'\n');
  if (out.status !== 'PASS') process.exitCode = 1;
}
