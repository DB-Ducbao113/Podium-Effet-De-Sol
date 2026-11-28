import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Language } from "../../../types";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type NavFitMode = "rail-full" | "rail-trimmed" | "compact";
export type NavRailLayout = "centered" | "balanced";

export const NAV_FIT_HYSTERESIS_PX = 24;
export const NAV_MIN_REGION_GAP_PX = 24;

export interface IntrinsicNavWidths {
  readonly brandW: number;
  readonly railW: number;
  readonly nextPillW: number;
  readonly langW: number;
}

export interface ComputeFitModeInput extends IntrinsicNavWidths {
  readonly currentMode: NavFitMode;
  readonly availW: number;
  readonly forceCompact: boolean;
}

export function computeNextFitMode({
  currentMode,
  availW,
  brandW,
  railW,
  nextPillW,
  langW,
  forceCompact,
}: ComputeFitModeInput): NavFitMode {
  if (forceCompact || availW <= 0) {
    return "compact";
  }

  const railTrimmedMin = brandW + railW + langW + 2 * NAV_MIN_REGION_GAP_PX;
  const railFullMin =
    nextPillW > 0
      ? brandW + railW + nextPillW + langW + 3 * NAV_MIN_REGION_GAP_PX
      : railTrimmedMin;

  if (currentMode === "rail-full") {
    if (availW < railTrimmedMin) return "compact";
    if (nextPillW > 0 && availW < railFullMin) return "rail-trimmed";
    return "rail-full";
  }

  if (currentMode === "rail-trimmed") {
    if (availW >= railFullMin + NAV_FIT_HYSTERESIS_PX) return "rail-full";
    if (availW < railTrimmedMin) return "compact";
    return nextPillW > 0 ? "rail-trimmed" : "rail-full";
  }

  if (availW >= railFullMin + NAV_FIT_HYSTERESIS_PX) return "rail-full";
  if (nextPillW > 0 && availW >= railTrimmedMin + NAV_FIT_HYSTERESIS_PX) {
    return "rail-trimmed";
  }
  return "compact";
}

export interface ComputeRailLayoutInput extends IntrinsicNavWidths {
  readonly availW: number;
  readonly fitMode: NavFitMode;
}

export function computeRailLayout({
  availW,
  brandW,
  railW,
  nextPillW,
  langW,
  fitMode,
}: ComputeRailLayoutInput): NavRailLayout {
  if (fitMode === "compact") return "balanced";
  const rightW =
    fitMode === "rail-full" && nextPillW > 0 ? nextPillW + 8 + langW : langW;
  const centeredRailMin =
    2 * Math.max(brandW, rightW) + railW + 2 * NAV_MIN_REGION_GAP_PX + 16;
  return availW >= centeredRailMin ? "centered" : "balanced";
}

function readDocumentTextZoom(): string {
  if (typeof document === "undefined") return "normal";
  return document.documentElement.dataset.textZoom ?? "normal";
}

export interface UseNavFitModeOptions {
  readonly shellRef: RefObject<HTMLElement | null>;
  readonly mirrorBrandRef: RefObject<HTMLElement | null>;
  readonly mirrorRailRef: RefObject<HTMLElement | null>;
  readonly mirrorNextRef: RefObject<HTMLElement | null>;
  readonly mirrorLangRef: RefObject<HTMLElement | null>;
  readonly lang: Language;
  readonly nextRaceKey: string;
  readonly mobileHub: boolean;
}

export interface UseNavFitModeResult {
  readonly fitMode: NavFitMode;
  readonly railLayout: NavRailLayout;
  readonly shellWidth: number;
  readonly textZoom: string;
}

export function useNavFitMode({
  shellRef,
  mirrorBrandRef,
  mirrorRailRef,
  mirrorNextRef,
  mirrorLangRef,
  lang,
  nextRaceKey,
  mobileHub,
}: UseNavFitModeOptions): UseNavFitModeResult {
  const [textZoom, setTextZoom] = useState<string>(() =>
    readDocumentTextZoom(),
  );
  const [fitMode, setFitMode] = useState<NavFitMode>(() => {
    if (mobileHub) return "compact";
    if (typeof window !== "undefined" && window.innerWidth <= 860) {
      return "compact";
    }
    return "rail-full";
  });
  const [railLayout, setRailLayout] = useState<NavRailLayout>("centered");
  const [shellWidth, setShellWidth] = useState<number>(0);

  const widthsRef = useRef<IntrinsicNavWidths>({
    brandW: 168,
    railW: 660,
    nextPillW: 168,
    langW: 68,
  });
  const fitModeRef = useRef<NavFitMode>(fitMode);

  useEffect(() => {
    fitModeRef.current = fitMode;
  }, [fitMode]);

  useEffect(() => {
    if (
      typeof document === "undefined" ||
      typeof MutationObserver === "undefined"
    ) {
      return;
    }
    const root = document.documentElement;
    const sync = () => setTextZoom(readDocumentTextZoom());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-text-zoom"],
    });
    return () => observer.disconnect();
  }, []);

  const forceCompact = mobileHub || textZoom === "200" || textZoom === "400";

  useIsomorphicLayoutEffect(() => {
    if (forceCompact) {
      fitModeRef.current = "compact";
      setFitMode("compact");
      setRailLayout("balanced");
      return;
    }

    const shellEl = shellRef.current;
    if (!shellEl) return;

    const measureMirror = () => {
      const brandW = mirrorBrandRef.current?.offsetWidth ?? 0;
      const railW = mirrorRailRef.current?.offsetWidth ?? 0;
      const nextPillW = mirrorNextRef.current?.offsetWidth ?? 0;
      const langW = mirrorLangRef.current?.offsetWidth ?? 0;
      if (brandW > 0 && railW > 0) {
        widthsRef.current = {
          brandW,
          railW,
          nextPillW: nextPillW > 0 ? Math.max(nextPillW, 132) : 0,
          langW: Math.max(langW, 56),
        };
      }
    };

    const recompute = (measuredContentW?: number) => {
      measureMirror();
      let availW = measuredContentW ?? 0;
      if (availW <= 0) {
        const cs = getComputedStyle(shellEl);
        const padX =
          (Number.parseFloat(cs.paddingLeft) || 0) +
          (Number.parseFloat(cs.paddingRight) || 0);
        availW = Math.max(0, shellEl.clientWidth - padX);
      }
      if (availW <= 0) return;
      setShellWidth(availW);

      const nextFit = computeNextFitMode({
        currentMode: fitModeRef.current,
        availW,
        ...widthsRef.current,
        forceCompact,
      });
      fitModeRef.current = nextFit;
      setFitMode(nextFit);
      setRailLayout(
        computeRailLayout({
          availW,
          fitMode: nextFit,
          ...widthsRef.current,
        }),
      );
    };

    // Defer initial DOM measurement to the next animation frame so React's
    // initial commit never triggers a synchronous forced reflow.
    let rafId = 0;
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      rafId = window.requestAnimationFrame(() => recompute());
    } else {
      recompute();
    }

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        recompute(entry ? entry.contentRect.width : undefined);
      });
      observer.observe(shellEl);
    }

    let active = true;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!active) return;
        recompute();
      });
    }

    return () => {
      active = false;
      if (rafId && typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(rafId);
      }
      observer?.disconnect();
    };
  }, [
    forceCompact,
    lang,
    mirrorBrandRef,
    mirrorLangRef,
    mirrorNextRef,
    mirrorRailRef,
    nextRaceKey,
    shellRef,
    textZoom,
  ]);

  return {
    fitMode: forceCompact ? "compact" : fitMode,
    railLayout,
    shellWidth,
    textZoom,
  };
}
