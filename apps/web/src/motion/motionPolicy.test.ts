import { describe, expect, it } from 'vitest';
import { readHomeMotionPolicy } from './motionPolicy';
import type { MotionEnvironment } from '../utils/motionContract';
import type { ViewportMetrics } from './viewportMetrics';

const env = (over: Partial<MotionEnvironment> = {}): MotionEnvironment => ({
  reducedMotion: false,
  visible: true,
  saveData: false,
  deviceMemory: 8,
  textZoom: 'normal',
  ...over,
});

const viewport = (over: Partial<ViewportMetrics> = {}): ViewportMetrics => ({
  width: 1440,
  height: 900,
  zoom: 0.75,
  compact: false,
  ...over,
});

describe('Home motion policy', () => {
  it('shortens travel on the narrow band without disabling the choreography', () => {
    expect(readHomeMotionPolicy(env(), viewport({ compact: true }))).toMatchObject({
      tier: 'full',
      lite: true,
    });
  });

  it('shortens travel on a low-power or data-saver device', () => {
    expect(readHomeMotionPolicy(env({ saveData: true }), viewport())).toMatchObject({
      tier: 'lite',
      lite: true,
    });
    expect(readHomeMotionPolicy(env({ deviceMemory: 4 }), viewport())).toMatchObject({
      tier: 'lite',
      lite: true,
    });
  });

  it('never animates when the preference or the tab says stop, even on mobile', () => {
    expect(readHomeMotionPolicy(env({ reducedMotion: true }), viewport({ compact: true })).tier).toBe('off');
    expect(readHomeMotionPolicy(env({ visible: false }), viewport({ compact: true })).tier).toBe('off');
  });

  it('runs the full choreography on a wide desktop with headroom', () => {
    expect(readHomeMotionPolicy(env(), viewport())).toEqual({
      tier: 'full',
      lite: false,
      viewport: viewport(),
    });
  });

  it('defaults to the DOM readers, which report no motion without a DOM', () => {
    expect(readHomeMotionPolicy().tier).toBe('off');
  });
});
