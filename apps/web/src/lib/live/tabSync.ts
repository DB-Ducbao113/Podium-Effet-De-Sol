/**
 * Tab synchronization utility for PODIUM — Effet de Sol
 * Synchronizes animations, timers, and live sessions across multiple browser tabs
 */

type SyncHandler = (payload: any) => void;

class TabSyncManager {
  private channel: BroadcastChannel | null = null;
  private handlers = new Map<string, Set<SyncHandler>>();

  constructor() {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('f1_tab_sync');
        this.channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type) {
            this.notify(type, payload);
          }
        };
      } catch {
        // Fallback or ignore in restricted context
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'f1_tab_sync_msg' && e.newValue) {
          try {
            const { type, payload } = JSON.parse(e.newValue);
            if (type) this.notify(type, payload);
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  public broadcast(type: string, payload?: any) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload, timestamp: Date.now() });
      } catch {
        // Ignore channel errors
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          'f1_tab_sync_msg',
          JSON.stringify({ type, payload, timestamp: Date.now() }),
        );
      } catch {
        // Ignore storage errors
      }
    }
    // Also notify current tab listeners
    this.notify(type, payload);
  }

  public subscribe(type: string, handler: SyncHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  private notify(type: string, payload: any) {
    const list = this.handlers.get(type);
    if (list) {
      list.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error('[TabSync] Handler error', err);
        }
      });
    }
  }
}

export const tabSync = new TabSyncManager();

/**
 * Calculates negative animation delay (e.g. "-12.450s") based on global wall-clock time
 * so multiple tabs run animations at the exact same frame.
 */
export function getWallClockAnimationDelay(durationSec: number): string {
  const durationMs = durationSec * 1000;
  const elapsedMs = Date.now() % durationMs;
  return `-${(elapsedMs / 1000).toFixed(3)}s`;
}

/**
 * Schedules a callback to execute strictly aligned with whole wall-clock seconds (:00.000)
 * Returns cleanup function.
 */
export function scheduleWallClockSecondTick(callback: () => void): () => void {
  let timeoutId: any = null;
  let active = true;

  const tick = () => {
    if (!active) return;
    callback();
    const now = Date.now();
    const delayToNextSecond = Math.max(10, 1000 - (now % 1000));
    timeoutId = setTimeout(tick, delayToNextSecond);
  };

  // Immediate first call
  callback();

  const initialDelay = Math.max(10, 1000 - (Date.now() % 1000));
  timeoutId = setTimeout(tick, initialDelay);

  return () => {
    active = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
}
