import type { HomeChapter } from './homeJourneyMath';

export type HomeScrubCallback = (progress: number) => void;

const subscribers = new Map<HomeChapter, Set<HomeScrubCallback>>();
const lastProgress = new Map<HomeChapter, number>();

/**
 * Chapter effects subscribe here so the single HomeJourneyMotion rAF stays the
 * only scroll loop. New subscribers replay the last dispatched value (settled
 * by default) because sibling effect order is not guaranteed.
 */
export function subscribeHomeScrub(id: HomeChapter, callback: HomeScrubCallback): () => void {
  let set = subscribers.get(id);
  if (!set) {
    set = new Set();
    subscribers.set(id, set);
  }
  set.add(callback);
  callback(lastProgress.get(id) ?? 1);
  return () => {
    set.delete(callback);
    if (set.size === 0) subscribers.delete(id);
  };
}

export function dispatchHomeScrub(id: HomeChapter, progress: number) {
  lastProgress.set(id, progress);
  subscribers.get(id)?.forEach((callback) => callback(progress));
}