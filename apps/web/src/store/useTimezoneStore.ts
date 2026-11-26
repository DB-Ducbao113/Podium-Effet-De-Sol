import { create } from "zustand";
import type { TimezoneDetectResponse } from "@peds/contracts";
import {
  clearLegacyTimezonePreference,
  computeClockOffsetMs,
  detectBrowserTimeZone,
  validIanaTimeZone,
} from "../utils/championshipTimezone";

export type TimezoneDetectionSource = "ip" | "device" | "utc-fallback";
export type TimezoneDetectionStatus =
  "device-initialized" | "syncing" | "ip-synced" | "fallback-active";

export interface TimezoneState {
  readonly timeZone: string;
  readonly source: TimezoneDetectionSource;
  readonly status: TimezoneDetectionStatus;
  readonly clockOffsetMs: number;
  readonly bootstrapAutoTimezone: (fetchImpl?: typeof fetch) => Promise<void>;
}

const AUTO_TIMEZONE_TIMEOUT_MS = 3_000;

function createInitialTimezoneState(): Pick<
  TimezoneState,
  "timeZone" | "source" | "status" | "clockOffsetMs"
> {
  clearLegacyTimezonePreference();
  const initial = detectBrowserTimeZone();
  return {
    timeZone: initial.timeZone,
    source: initial.source,
    status: "device-initialized",
    clockOffsetMs: 0,
  };
}

export const useTimezoneStore = create<TimezoneState>((set, get) => ({
  ...createInitialTimezoneState(),
  bootstrapAutoTimezone: async (fetchImpl) => {
    if (get().status !== "device-initialized") return;
    const fetcher = fetchImpl ?? (typeof fetch === "function" ? fetch : null);
    if (!fetcher) {
      set({ status: "fallback-active", clockOffsetMs: 0 });
      return;
    }

    set({ status: "syncing" });
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId =
      controller !== null
        ? globalThis.setTimeout(
            () => controller.abort(),
            AUTO_TIMEZONE_TIMEOUT_MS,
          )
        : null;

    const requestStartedAtMs = Date.now();
    try {
      const response = await fetcher("/api/timezone", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller?.signal,
      });
      const responseReceivedAtMs = Date.now();
      if (!response.ok) {
        set({ status: "fallback-active", clockOffsetMs: 0 });
        return;
      }

      const data = (await response.json()) as Partial<TimezoneDetectResponse>;
      const hasValidServerEpoch =
        typeof data?.serverEpochMs === "number" &&
        Number.isFinite(data.serverEpochMs) &&
        data.serverEpochMs > 0;
      const clockOffsetMs = hasValidServerEpoch
        ? computeClockOffsetMs(
            data.serverEpochMs as number,
            requestStartedAtMs,
            responseReceivedAtMs,
          )
        : 0;

      if (data?.source === "ip" && validIanaTimeZone(data?.timeZone)) {
        set({
          timeZone: data.timeZone,
          source: "ip",
          status: "ip-synced",
          clockOffsetMs,
        });
        return;
      }

      set({
        status: "fallback-active",
        clockOffsetMs,
      });
    } catch {
      set({ status: "fallback-active", clockOffsetMs: 0 });
    } finally {
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    }
  },
}));

export function getSyncedNow(clockOffsetMs?: number): number {
  const offset = clockOffsetMs ?? useTimezoneStore.getState().clockOffsetMs;
  return Date.now() + offset;
}
