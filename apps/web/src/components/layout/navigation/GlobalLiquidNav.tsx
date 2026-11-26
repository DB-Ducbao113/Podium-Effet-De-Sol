import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useMobileHub } from "../../../hooks/useMobileHub";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { visualZoomFactor } from "../../../hooks/useTextZoomAttribute";
import { OfficialBrandLogo } from "../../common/OfficialBrandLogo";
import { CompactMenuTrigger } from "./CompactMenuTrigger";
import { CompactNavDialog, type DialogPhase } from "./CompactNavDialog";
import { DesktopGlassRail } from "./DesktopGlassRail";
import { NavLangToggle } from "./NavLangToggle";
import {
  LIQUID_NAV_DESTINATIONS,
  NAV_MICROCOPY,
  type CanonicalNavId,
} from "./navRegistry";
import type { NavAdapter } from "./navRouting";
import type { NextRacePillState } from "./nextRaceSchedule";
import { useNavFitMode } from "./useNavFitMode";
import "./liquidGlassNav.css";

export interface GlobalLiquidNavProps {
  readonly adapter: NavAdapter;
  readonly forceNoBackdrop?: boolean;
}

export function GlobalLiquidNav({
  adapter,
  forceNoBackdrop = false,
}: GlobalLiquidNavProps) {
  const {
    activeId,
    season,
    lang,
    surfaceTone,
    isImmersiveSurface,
    getHref,
    onNavigate,
    onSelectLang,
    onPrefetchNav,
    nextRaceFixture,
  } = adapter;

  const dialogId = useId();
  const reducedMotion = useReducedMotion();
  const mobileHub = useMobileHub();
  const hiddenNextRace: NextRacePillState = {
    status: "unavailable",
    text: "",
    ariaLabel: "",
    href: null,
    isLiveWeekend: false,
  };
  void season;
  void nextRaceFixture;

  const shellRef = useRef<HTMLDivElement>(null);
  const mirrorBrandRef = useRef<HTMLSpanElement>(null);
  const mirrorRailRef = useRef<HTMLSpanElement>(null);
  const mirrorNextRef = useRef<HTMLSpanElement>(null);
  const mirrorLangRef = useRef<HTMLSpanElement>(null);

  const { fitMode, railLayout } = useNavFitMode({
    shellRef,
    mirrorBrandRef,
    mirrorRailRef,
    mirrorNextRef,
    mirrorLangRef,
    lang,
    nextRaceKey: "hidden",
    mobileHub,
  });

  const [dialogPhase, setDialogPhase] = useState<DialogPhase>("closed");
  const restoreFocusRef = useRef(true);
  const shouldRestoreFocus = useCallback(() => restoreFocusRef.current, []);
  const openRafRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearMotionTimers = useCallback(() => {
    if (openRafRef.current !== null) {
      window.cancelAnimationFrame(openRafRef.current);
      openRafRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeDialog = useCallback(
    (restoreFocus: boolean) => {
      restoreFocusRef.current = restoreFocus;
      clearMotionTimers();
      setDialogPhase((current) => {
        if (current === "closed") return "closed";
        if (reducedMotion || !restoreFocus) return "closed";
        return "closing";
      });
    },
    [clearMotionTimers, reducedMotion],
  );

  useEffect(() => {
    if (dialogPhase !== "closing") return;
    if (reducedMotion) {
      setDialogPhase("closed");
      return;
    }
    const timer = window.setTimeout(() => {
      closeTimerRef.current = null;
      setDialogPhase("closed");
    }, 230);
    closeTimerRef.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (closeTimerRef.current === timer) {
        closeTimerRef.current = null;
      }
    };
  }, [dialogPhase, reducedMotion]);

  const openDialog = useCallback(() => {
    clearMotionTimers();
    restoreFocusRef.current = true;
    if (reducedMotion) {
      setDialogPhase("open");
      return;
    }
    setDialogPhase("opening");
    openRafRef.current = window.requestAnimationFrame(() => {
      openRafRef.current = null;
      setDialogPhase("open");
    });
  }, [clearMotionTimers, reducedMotion]);

  const toggleDialog = useCallback(() => {
    if (dialogPhase === "closed" || dialogPhase === "closing") {
      openDialog();
    } else {
      closeDialog(true);
    }
  }, [closeDialog, dialogPhase, openDialog]);

  useEffect(() => {
    if (fitMode !== "compact" && dialogPhase !== "closed") {
      restoreFocusRef.current = false;
      clearMotionTimers();
      setDialogPhase("closed");
    }
  }, [clearMotionTimers, dialogPhase, fitMode]);

  useEffect(() => clearMotionTimers, [clearMotionTimers]);

  // Keep --peds-nav-offset synced in layout CSS px (compensated for VISUAL-ZOOM-01) so content headers never touch the floating bar.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const shellEl = shellRef.current;
    if (!shellEl) return;

    const updateOffset = () => {
      const rect = shellEl.getBoundingClientRect();
      const zoom = visualZoomFactor(document.documentElement);
      const offsetLayoutPx = Math.round((rect.bottom + 20) / zoom);
      document.documentElement.style.setProperty(
        "--peds-nav-offset",
        `${Math.max(72, offsetLayoutPx)}px`,
      );
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateOffset);
      observer.observe(shellEl);
    }
    return () => {
      window.removeEventListener("resize", updateOffset);
      observer?.disconnect();
      document.documentElement.style.removeProperty("--peds-nav-offset");
    };
  }, [fitMode, lang]);

  const handleLinkClick = useCallback(
    (id: CanonicalNavId, event: MouseEvent<HTMLAnchorElement>) => {
      onNavigate(id, event);
    },
    [onNavigate],
  );

  const isCompact = fitMode === "compact";
  const showDesktopRail = !isCompact;
  const isDialogOpen = dialogPhase === "opening" || dialogPhase === "open";

  return (
    <div
      className="peds-nav-root"
      data-fit-mode={fitMode}
      data-rail-layout={railLayout}
      data-surface-tone={surfaceTone}
      data-immersive={isImmersiveSurface ? "true" : "false"}
      data-motion={reducedMotion ? "reduced" : "active"}
      data-no-backdrop={forceNoBackdrop ? "true" : undefined}
    >
      <header className="peds-nav-header">
        <div
          ref={shellRef}
          className="peds-nav-shell"
          data-fit-mode={fitMode}
          data-rail-layout={railLayout}
        >
          <div className="peds-nav-brand-slot">
            <a
              href={getHref("overview")}
              className="peds-nav-brand-link group"
              aria-label={NAV_MICROCOPY.brandHomeAria[lang]}
              onClick={(event) => handleLinkClick("overview", event)}
            >
              <OfficialBrandLogo
                size="lg"
                variant="full"
                className="peds-nav-brand-logo"
              />
            </a>
          </div>

          {showDesktopRail ? (
            <div className="peds-nav-center-slot">
              <DesktopGlassRail
                activeId={activeId}
                lang={lang}
                surfaceTone={surfaceTone}
                reducedMotion={reducedMotion}
                visible={showDesktopRail}
                getHref={getHref}
                onNavigate={handleLinkClick}
                onPrefetchNav={onPrefetchNav}
              />
            </div>
          ) : null}

          <div className="peds-nav-utility-slot">
            {showDesktopRail ? (
              <NavLangToggle
                lang={lang}
                surfaceTone={surfaceTone}
                onSelectLang={onSelectLang}
              />
            ) : null}

            {isCompact ? (
              <CompactMenuTrigger
                open={isDialogOpen}
                dialogId={dialogId}
                lang={lang}
                surfaceTone={surfaceTone}
                onToggle={toggleDialog}
              />
            ) : null}
          </div>
        </div>
      </header>

      {/* Invariant intrinsic width mirror: never toggles by fitMode, preventing ResizeObserver loops */}
      <div className="peds-nav-mirror" aria-hidden="true">
        <span ref={mirrorBrandRef} className="peds-nav-mirror-item">
          <span className="peds-nav-brand-link">
            <OfficialBrandLogo
              size="lg"
              variant="full"
              className="peds-nav-brand-logo"
            />
          </span>
        </span>
        <span ref={mirrorRailRef} className="peds-nav-mirror-item">
          <span className="peds-nav-rail">
            <span className="peds-nav-list">
              {LIQUID_NAV_DESTINATIONS.map((dest) => (
                <span key={dest.id} className="peds-nav-link">
                  {dest.label[lang]}
                </span>
              ))}
            </span>
          </span>
        </span>
        <span ref={mirrorNextRef} className="peds-nav-mirror-item" />
        <span ref={mirrorLangRef} className="peds-nav-mirror-item">
          <span className="peds-nav-lang">
            <span className="peds-nav-lang-btn">EN</span>
            <span className="peds-nav-lang-btn">VI</span>
          </span>
        </span>
      </div>

      <CompactNavDialog
        phase={dialogPhase}
        dialogId={dialogId}
        activeId={activeId}
        lang={lang}
        nextRace={hiddenNextRace}
        reducedMotion={reducedMotion}
        forceNoBackdrop={forceNoBackdrop}
        shouldRestoreFocus={shouldRestoreFocus}
        getHref={getHref}
        onNavigate={handleLinkClick}
        onSelectLang={onSelectLang}
        onRequestClose={closeDialog}
      />
    </div>
  );
}
