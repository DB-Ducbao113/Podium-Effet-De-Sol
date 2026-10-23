import { describe, expect, it } from 'vitest';
import {
  AdaptiveQualityController,
  type ControllerConfig,
  type PerformanceSample,
} from './adaptiveController';

const config: ControllerConfig = {
  warmupMs: 100,
  degradeMs: 500,
  upgradeMs: 2_000,
  cooldownMs: 1_000,
  minValidFrames: 10,
  maxTargetFps: 60,
  degradeFpsRatio: 0.9,
  degradeP95Ratio: 1.5,
  upgradeFpsRatio: 0.98,
  upgradeP95Ratio: 1.08,
};

const sample = (
  nowMs: number,
  averageFps: number,
  frameTimeP95Ms: number,
  continuous = true,
): PerformanceSample => ({
  nowMs,
  averageFps,
  frameTimeP95Ms,
  refreshRateHz: 60,
  validFrameCount: 120,
  continuous,
});

describe('AdaptiveQualityController', () => {
  it('degrades one level after sustained bad evidence', () => {
    const controller = new AdaptiveQualityController(0, 'HIGH', config);
    expect(controller.ingest(sample(100, 40, 33))).toBeNull();
    expect(controller.ingest(sample(600, 40, 33))?.to).toBe('BALANCED');
    expect(controller.getState().profile).toBe('BALANCED');
  });

  it('honors cooldown and prevents profile flapping', () => {
    const controller = new AdaptiveQualityController(0, 'HIGH', config);
    controller.ingest(sample(100, 40, 33));
    controller.ingest(sample(600, 40, 33));
    for (let now = 700; now < 1_600; now += 100) controller.ingest(sample(now, 60, 16.7));
    expect(controller.getState().profile).toBe('BALANCED');
    expect(controller.getState().transitionCount).toBe(1);
  });

  it('requires a longer stable interval to upgrade', () => {
    const controller = new AdaptiveQualityController(0, 'BALANCED', config);
    controller.ingest(sample(100, 60, 16.7));
    expect(controller.ingest(sample(2_099, 60, 16.7))).toBeNull();
    expect(controller.ingest(sample(2_100, 60, 16.7))?.to).toBe('HIGH');
  });

  it('keeps a manual profile locked until AUTO is restored', () => {
    const controller = new AdaptiveQualityController(0, 'HIGH', config);
    controller.setMode('PERFORMANCE', 10);
    for (let now = 100; now < 5_000; now += 100) controller.ingest(sample(now, 60, 16.7));
    expect(controller.getState().mode).toBe('PERFORMANCE');
    expect(controller.getState().profile).toBe('PERFORMANCE');
    controller.resetAuto(5_000, 'HIGH');
    expect(controller.getState().mode).toBe('AUTO');
    expect(controller.getState().profile).toBe('HIGH');
  });

  it('ignores paused and non-continuous evidence', () => {
    const controller = new AdaptiveQualityController(0, 'HIGH', config);
    controller.setPaused(true, 100);
    controller.ingest(sample(2_000, 20, 50));
    controller.setPaused(false, 2_000);
    controller.ingest(sample(2_050, 20, 50));
    controller.ingest(sample(2_100, 20, 50, false));
    expect(controller.getState().profile).toBe('HIGH');
  });
});
