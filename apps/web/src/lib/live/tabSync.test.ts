import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getWallClockAnimationDelay, scheduleWallClockSecondTick, tabSync } from './tabSync';

describe('tabSync utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates negative animation delay based on wall-clock modulo', () => {
    vi.setSystemTime(new Date(1000 * 10 + 500)); // 10.5s
    const delay = getWallClockAnimationDelay(35);
    expect(delay).toBe('-10.500s');

    vi.setSystemTime(new Date(1000 * 35)); // 35.0s -> modulo 35s = 0
    const delay0 = getWallClockAnimationDelay(35);
    expect(delay0).toBe('-0.000s');
  });

  it('schedules callback aligned with whole second boundary', () => {
    vi.setSystemTime(new Date(1000 * 12 + 400)); // 12.4s
    const callback = vi.fn();

    const cleanup = scheduleWallClockSecondTick(callback);
    // Called once immediately
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance 600ms to reach 13.0s boundary
    vi.advanceTimersByTime(600);
    expect(callback).toHaveBeenCalledTimes(2);

    // Advance 1000ms to reach 14.0s
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3);

    cleanup();
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('supports pub/sub pattern across subscriptions', () => {
    const handler = vi.fn();
    const unsub = tabSync.subscribe('test_event', handler);

    tabSync.broadcast('test_event', { foo: 'bar' });
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });

    unsub();
    tabSync.broadcast('test_event', { foo: 'baz' });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
