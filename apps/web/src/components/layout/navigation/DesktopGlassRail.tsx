import { useRef, type MouseEvent } from "react";
import type { Language } from "../../../types";
import {
  LIQUID_NAV_DESTINATIONS,
  NAV_MICROCOPY,
  type CanonicalNavId,
} from "./navRegistry";
import { useSlidingGlassLens } from "./useSlidingGlassLens";

export interface DesktopGlassRailProps {
  readonly activeId: CanonicalNavId | null;
  readonly lang: Language;
  readonly surfaceTone: "dark" | "light";
  readonly reducedMotion: boolean;
  readonly visible: boolean;
  readonly getHref: (id: CanonicalNavId) => string;
  readonly onNavigate: (
    id: CanonicalNavId,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
  readonly onPrefetchNav?: (id: CanonicalNavId) => void;
}

export function DesktopGlassRail({
  activeId,
  lang,
  surfaceTone,
  reducedMotion,
  visible,
  getHref,
  onNavigate,
  onPrefetchNav,
}: DesktopGlassRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);

  useSlidingGlassLens({
    railRef,
    lensRef,
    activeId,
    lang,
    reducedMotion,
    visible,
  });

  return (
    <nav
      className="peds-nav-rail-wrap"
      aria-label={NAV_MICROCOPY.navLandmark[lang]}
    >
      <div
        ref={railRef}
        className="peds-nav-rail"
        data-surface-tone={surfaceTone}
      >
        <span ref={lensRef} className="peds-nav-lens" aria-hidden="true" />
        <ul className="peds-nav-list">
          {LIQUID_NAV_DESTINATIONS.map((dest) => {
            const isActive = activeId === dest.id;
            return (
              <li key={dest.id} className="peds-nav-list-item">
                <a
                  href={getHref(dest.id)}
                  data-nav-id={dest.id}
                  data-active={isActive ? "true" : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={`peds-nav-link ${isActive ? "is-active" : ""}`}
                  onMouseEnter={() => onPrefetchNav?.(dest.id)}
                  onFocus={() => onPrefetchNav?.(dest.id)}
                  onClick={(event) => onNavigate(dest.id, event)}
                >
                  {dest.label[lang]}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
