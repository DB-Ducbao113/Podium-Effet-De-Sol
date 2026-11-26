import { createContext, useContext } from "react";
import type { StormInspectionTarget } from "./types";

export interface StormShellContextValue {
  readonly openInspection: (target: StormInspectionTarget) => void;
  readonly closeInspection: () => void;
  readonly setShowroomStageReady: (ready: boolean) => void;
}

export const StormShellContext = createContext<StormShellContextValue>({
  openInspection: () => undefined,
  closeInspection: () => undefined,
  setShowroomStageReady: () => undefined,
});

export function useStormShell(): StormShellContextValue {
  return useContext(StormShellContext);
}

/**
 * Pure URL mapper for legacy `/__design-prototype?tab=...` and retired path aliases (`AC-03.3`).
 */
export function resolveDesignPrototypeRedirectTarget(search: string): string {
  const tab = new URLSearchParams(search).get("tab");
  switch (tab) {
    case "results":
    case "calendar":
    case "standings":
      return `/season/2026?tab=${tab}`;
    case "teams":
      return "/teams";
    case "drivers":
      return "/drivers";
    case "engineering":
      return "/engineering";
    case "showroom":
      return "/showroom";
    case "about":
      return "/about";
    default:
      return "/";
  }
}
