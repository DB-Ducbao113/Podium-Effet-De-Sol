import { describe, expect, it, vi } from 'vitest';
import { dispatchHomeScrub, subscribeHomeScrub } from './homeScrubRegistry';

describe('homeScrubRegistry', () => {
  it('dispatches to subscribers and replays the last value on late subscribe', () => {
    const early = vi.fn();
    const late = vi.fn();
    const unsubscribeEarly = subscribeHomeScrub('race-control', early);
    dispatchHomeScrub('race-control', .4);
    expect(early).toHaveBeenCalledWith(1); // settled default before first dispatch
    expect(early).toHaveBeenCalledWith(.4);
    const unsubscribeLate = subscribeHomeScrub('race-control', late);
    expect(late).toHaveBeenCalledWith(.4);
    unsubscribeEarly();
    unsubscribeLate();
    dispatchHomeScrub('race-control', .9);
    expect(early).toHaveBeenCalledTimes(2);
    expect(late).toHaveBeenCalledTimes(1);
  });
  it('keeps chapters isolated and tolerates dispatch without subscribers', () => {
    const race = vi.fn();
    const explore = vi.fn();
    const unsubscribeRace = subscribeHomeScrub('race-control', race);
    const unsubscribeExplore = subscribeHomeScrub('eds-explore', explore);
    dispatchHomeScrub('eds-explore', .25);
    expect(explore).toHaveBeenCalledWith(.25);
    expect(race).not.toHaveBeenCalledWith(.25);
    expect(() => dispatchHomeScrub('launch-control', .5)).not.toThrow();
    unsubscribeRace();
    unsubscribeExplore();
  });
  it('unsubscribes twice safely and removes the empty chapter set', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeHomeScrub('championship-overview', callback);
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
    dispatchHomeScrub('championship-overview', .75);
    expect(callback).toHaveBeenCalledTimes(1); // only the initial replay
  });
});