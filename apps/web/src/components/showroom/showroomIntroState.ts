import type { Language } from "../../types";

export type ShowroomIntroPhase = "gate" | "playing" | "entered";
export type ShowroomIntroTier = "T0" | "T1" | "T2";

export const SHOWROOM_INTRO_MEDIA = {
  poster: "/__peds-showroom-intro/intro-poster.webp",
  webm: "/__peds-showroom-intro/intro-tunnel-720.webm",
  mp4: "/__peds-showroom-intro/intro-tunnel-540.mp4",
} as const;

/** Measured from the owner-supplied encodes: WebM 8.625s, MP4 8.667s. */
export const SHOWROOM_INTRO_FILM_SECONDS = 8.625;
/** The tunnel peaks into white here; dissolving on that frame hides the cut. */
export const SHOWROOM_INTRO_REVEAL_AT = 8.35;
/** Overlay lifetime after enter: the veil blooms, then the stage settles under it. */
export const SHOWROOM_INTRO_REVEAL_MS = 900;
/** Focus lands on Replay as the pill rises in, before the overlay unmounts. */
export const SHOWROOM_INTRO_FOCUS_MS = 760;
export const SHOWROOM_INTRO_GATE_EXIT_MS = 420;
/** A film that never reports progress must not trap the visitor. */
export const SHOWROOM_INTRO_STALL_MS = 15000;

export type ShowroomIntroCapability = {
  reducedMotion: boolean;
  saveData: boolean;
  videoSupported: boolean;
  effectiveType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
};

export function getShowroomIntroTier(
  input: ShowroomIntroCapability,
): ShowroomIntroTier {
  const connection = input.effectiveType ?? "";
  if (
    !input.videoSupported ||
    input.reducedMotion ||
    input.saveData ||
    /^(slow-2g|2g)$/i.test(connection) ||
    (input.deviceMemory !== undefined && input.deviceMemory <= 2) ||
    (input.hardwareConcurrency !== undefined && input.hardwareConcurrency <= 2)
  ) {
    return "T0";
  }
  if (
    /^3g$/i.test(connection) ||
    (input.deviceMemory !== undefined && input.deviceMemory <= 4) ||
    (input.hardwareConcurrency !== undefined && input.hardwareConcurrency <= 4)
  ) {
    return "T1";
  }
  return "T2";
}

export function detectShowroomIntroCapability(): ShowroomIntroCapability {
  const reducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof navigator === "undefined") {
    return { reducedMotion, saveData: false, videoSupported: false };
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  let videoSupported = false;
  if (typeof document !== "undefined") {
    const probe = document.createElement("video");
    videoSupported =
      typeof probe.canPlayType === "function" &&
      (probe.canPlayType('video/webm; codecs="vp9"') !== "" ||
        probe.canPlayType('video/mp4; codecs="avc1.42E01E"') !== "");
  }
  return {
    reducedMotion,
    saveData: nav.connection?.saveData === true,
    videoSupported,
    effectiveType: nav.connection?.effectiveType,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
  };
}

export type ShowroomIntroEvent = "open" | "skip" | "ended" | "error" | "replay";

export function nextIntroPhase(
  phase: ShowroomIntroPhase,
  event: ShowroomIntroEvent,
): ShowroomIntroPhase {
  if (event === "replay") return "gate";
  if (event === "open") return phase === "gate" ? "playing" : phase;
  return "entered";
}

export function introProgress(currentTime: number, duration: number): number {
  const total = duration > 0 ? duration : SHOWROOM_INTRO_FILM_SECONDS;
  if (!Number.isFinite(currentTime) || currentTime <= 0) return 0;
  return Math.min(1, currentTime / total);
}

export const SHOWROOM_INTRO_COPY: Record<
  Language,
  {
    eyebrow: string;
    title: string;
    titleEmphasis: string;
    open: string;
    skip: string;
    replay: string;
    filmLabel: string;
  }
> = {
  vi: {
    eyebrow: "Podium — Effet de Sol · Showroom",
    title: "Mở ",
    titleEmphasis: "kho trưng bày",
    open: "Mở Showroom",
    skip: "Bỏ qua",
    replay: "Xem lại intro",
    filmLabel: "Đang phát phim mở đầu",
  },
  en: {
    eyebrow: "Podium — Effet de Sol · Showroom",
    title: "Enter the ",
    titleEmphasis: "showroom",
    open: "Open Showroom",
    skip: "Skip",
    replay: "Replay intro",
    filmLabel: "Opening film playing",
  },
};
