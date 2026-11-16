import { describe, expect, it } from 'vitest';
import {
  getMotionTier,
  isLowPowerDevice,
  mayRunEssentialReveal,
  readMotionEnvironment,
} from './motionContract';
import type { MotionEnvironment } from './motionContract';

const env = (over: Partial<MotionEnvironment> = {}): MotionEnvironment => ({
  reducedMotion: false,
  visible: true,
  saveData: false,
  deviceMemory: 8,
  textZoom: 'normal',
  ...over,
});

describe('shared motion contract', () => {
  it('turns everything off for reduced motion and hidden tabs', () => {
    expect(getMotionTier(env())).toBe('full');
    expect(getMotionTier(env({ reducedMotion: true }))).toBe('off');
    expect(getMotionTier(env({ visible: false }))).toBe('off');
  });

  it('degrades to short travel for data saver, low memory and 400% text zoom', () => {
    expect(getMotionTier(env({ saveData: true }))).toBe('lite');
    expect(getMotionTier(env({ deviceMemory: 4 }))).toBe('lite');
    expect(getMotionTier(env({ deviceMemory: 2 }))).toBe('lite');
    expect(getMotionTier(env({ deviceMemory: 5 }))).toBe('full');
    expect(getMotionTier(env({ textZoom: '400' }))).toBe('lite');
    expect(getMotionTier(env({ textZoom: '200' }))).toBe('full');
  });

  it('keeps preference over capacity: reduced motion wins on any device', () => {
    expect(getMotionTier(env({ reducedMotion: true, saveData: true, deviceMemory: 1 }))).toBe('off');
  });

  it('preserves the legacy reveal gate exactly, including its low-power opt-out', () => {
    for (const over of [
      {},
      { reducedMotion: true },
      { visible: false },
      { saveData: true },
      { deviceMemory: 4 },
      { deviceMemory: 2, textZoom: '400' as const },
    ]) {
      const e = env(over);
      const legacy =
        !e.reducedMotion && e.visible && !(e.saveData || (e.deviceMemory ?? 8) <= 4);
      expect(mayRunEssentialReveal(e)).toBe(legacy);
    }
    expect(isLowPowerDevice(env({ deviceMemory: 4 }))).toBe(true);
    expect(isLowPowerDevice(env({ deviceMemory: 8 }))).toBe(false);
  });

  it('answers "no motion" where there is no DOM, instead of throwing', () => {
    expect(readMotionEnvironment()).toEqual({
      reducedMotion: true,
      visible: false,
      saveData: false,
      deviceMemory: 8,
      textZoom: 'normal',
    });
    expect(getMotionTier(readMotionEnvironment())).toBe('off');
  });
});
