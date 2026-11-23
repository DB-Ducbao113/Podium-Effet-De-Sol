import { describe, expect, it } from 'vitest';
import {
  CHASSIS_MAX_LIFT_METERS,
  MAINTENANCE_DURATIONS_MS,
  advanceMaintenance,
  computeMaintenanceTransforms,
  createInitialMaintenanceState,
  faultMaintenance,
  pauseMaintenance,
  resetMaintenance,
  resumeMaintenance,
  selectMaintenanceCorner,
  startMaintenance,
} from './ServiceSequence';

function advanceBySteps(
  initial: ReturnType<typeof createInitialMaintenanceState>,
  totalMs: number,
) {
  let s = initial;
  let rem = totalMs;
  while (rem > 0) {
    const chunk = Math.min(200, rem);
    s = advanceMaintenance(s, chunk);
    rem -= chunk;
  }
  return s;
}

describe('ServiceSequence maintenance state machine', () => {
  it('completes 3 full cycles cleanly using manifest-backed wheel removal', () => {
    let state = createInitialMaintenanceState(true);
    expect(state.step).toBe('IDLE');
    expect(state.wheelRemovalCapable).toBe(true);

    for (let cycle = 1; cycle <= 3; cycle++) {
      state = startMaintenance(state, cycle === 2 ? 'RL' : 'FL');
      expect(state.step).toBe('APPROACH_JACKS');

      const seenSteps = [state.step];
      for (let tick = 0; tick < 80 && state.step !== 'IDLE'; tick++) {
        state = advanceMaintenance(state, 160);
        if (seenSteps[seenSteps.length - 1] !== state.step) {
          seenSteps.push(state.step);
        }
      }

      expect(state.step).toBe('IDLE');
      expect(state.status).toBe('idle');
      expect(state.cycleCount).toBe(cycle);
      expect(seenSteps).toContain('LIFT_CAR');
      expect(seenSteps).toContain('LOOSEN_WHEEL_NUT');
      expect(seenSteps).toContain('INSPECTION_DETACHED');
      expect(seenSteps).toContain('REMOUNT_TORQUE');
      expect(seenSteps).toContain('LOWER_CAR');

      const restTransforms = computeMaintenanceTransforms(state);
      expect(restTransforms.chassisLiftMeters).toBe(0);
      expect(restTransforms.wheelOutwardOffsetMeters).toBe(0);
    }
  });

  it('falls back honestly to INSPECTION_MOUNTED when wheel removal capability is disabled', () => {
    let state = createInitialMaintenanceState(false);
    state = startMaintenance(state, 'FR');
    const stepOrder: string[] = [];
    for (let i = 0; i < 60 && state.step !== 'IDLE'; i++) {
      state = advanceMaintenance(state, 180);
      if (!stepOrder.includes(state.step)) stepOrder.push(state.step);
      expect(computeMaintenanceTransforms(state).wheelOutwardOffsetMeters).toBe(0);
    }
    expect(stepOrder).toContain('INSPECTION_MOUNTED');
    expect(stepOrder).not.toContain('INSPECTION_DETACHED');
  });

  it('supports Pause, Resume, mid-step Reset, Corner switch reset, and Fault rollback', () => {
    let state = startMaintenance(createInitialMaintenanceState(true), 'FR');
    state = advanceBySteps(
      state,
      MAINTENANCE_DURATIONS_MS.APPROACH_JACKS + MAINTENANCE_DURATIONS_MS.LIFT_CAR + 40,
    );
    expect(state.step).toBe('LOOSEN_WHEEL_NUT');

    // Pause stops advancement
    state = pauseMaintenance(state);
    expect(state.status).toBe('paused');
    const frozenElapsed = state.stepElapsedMs;
    state = advanceMaintenance(state, 200);
    expect(state.stepElapsedMs).toBe(frozenElapsed);

    // Resume continues
    state = resumeMaintenance(state);
    expect(state.status).toBe('running');
    state = advanceBySteps(state, MAINTENANCE_DURATIONS_MS.LOOSEN_WHEEL_NUT);
    expect(state.step).toBe('INSPECTION_DETACHED');

    const detached = computeMaintenanceTransforms(state);
    expect(detached.chassisLiftMeters).toBe(CHASSIS_MAX_LIFT_METERS);
    expect(detached.wheelOutwardOffsetMeters).toBeCloseTo(0.42, 3);

    // Selecting another corner mid-cycle resets safely to IDLE on the new corner
    state = selectMaintenanceCorner(state, 'RR');
    expect(state.step).toBe('IDLE');
    expect(state.corner).toBe('RR');

    // Fault triggers safe idle rollback
    state = startMaintenance(state, 'RR');
    state = advanceMaintenance(state, 500);
    state = faultMaintenance(state, 'WebGL context lost');
    expect(state.status).toBe('fault');
    expect(state.step).toBe('IDLE');
    expect(computeMaintenanceTransforms(state).chassisLiftMeters).toBe(0);

    // Explicit reset clears fault
    state = resetMaintenance(state);
    expect(state.status).toBe('idle');
    expect(state.faultReason).toBeNull();
  });
});
