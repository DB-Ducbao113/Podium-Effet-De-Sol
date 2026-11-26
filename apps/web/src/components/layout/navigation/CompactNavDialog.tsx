import { useRef, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Language } from "../../../types";
import { OfficialBrandLogo } from "../../common/OfficialBrandLogo";
import { NavLangToggle } from "./NavLangToggle";
import {
  LIQUID_NAV_DESTINATIONS,
  NAV_MICROCOPY,
  type CanonicalNavId,
} from "./navRegistry";
import type { NextRacePillState } from "./nextRaceSchedule";
import { useDialogFocusInert } from "./useDialogFocusInert";

export type DialogPhase = "closed" | "opening" | "open" | "closing";

export interface CompactNavDialogProps {
  readonly phase: DialogPhase;
  readonly dialogId: string;
  readonly activeId: CanonicalNavId | null;
  readonly lang: Language;
  readonly nextRace: NextRacePillState;
  readonly reducedMotion: boolean;
  readonly forceNoBackdrop?: boolean;
  readonly shouldRestoreFocus: () => boolean;
  readonly getHref: (id: CanonicalNavId) => string;
  readonly onNavigate: (
    id: CanonicalNavId,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
  readonly onSelectLang: (lang: Language) => void;
  readonly onRequestClose: (restoreFocus: boolean) => void;
}

export function CompactNavDialog({
  phase,
  dialogId,
  activeId,
  lang,
  nextRace,
  reducedMotion,
  forceNoBackdrop = false,
  shouldRestoreFocus,
  getHref,
  onNavigate,
  onSelectLang,
  onRequestClose,
}: CompactNavDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const isMounted = phase !== "closed";

  useDialogFocusInert({
    open: isMounted,
    dialogRef,
    initialFocusRef: closeBtnRef,
    shouldRestoreFocus,
    onRequestClose,
  });

  if (!isMounted || typeof document === "undefined") {
    return null;
  }

  void nextRace;

  const content = (
    <div
      className="peds-nav-portal"
      data-phase={phase}
      data-motion={reducedMotion ? "reduced" : "active"}
      data-no-backdrop={forceNoBackdrop ? "true" : undefined}
      data-peds-nav-portal="true"
    >
      <div
        className="peds-nav-dialog-scrim"
        data-phase={phase}
        onClick={() => onRequestClose(true)}
      >
        <div
          ref={dialogRef}
          id={dialogId}
          className="peds-nav-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-heading`}
          data-peds-nav-dialog="true"
          data-phase={phase}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="peds-nav-dialog-head">
            <div className="peds-nav-dialog-brand">
              <OfficialBrandLogo
                size="sm"
                variant="full"
                className="peds-nav-dialog-logo"
              />
              <h2 id={`${dialogId}-heading`} className="peds-nav-dialog-title">
                {NAV_MICROCOPY.drawerHeading[lang]}
              </h2>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              className="peds-nav-dialog-close"
              onClick={() => onRequestClose(true)}
            >
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>{NAV_MICROCOPY.closeTrigger[lang]}</span>
            </button>
          </div>

          <nav
            className="peds-nav-drawer-nav"
            aria-label={NAV_MICROCOPY.navLandmark[lang]}
          >
            <ul className="peds-nav-drawer-list">
              {LIQUID_NAV_DESTINATIONS.map((dest, index) => {
                const Icon = dest.icon;
                const isActive = activeId === dest.id;
                const desc = dest.compactDesc?.[lang];
                return (
                  <li
                    key={dest.id}
                    className="peds-nav-drawer-item"
                    style={
                      {
                        "--peds-nav-row-index": index,
                      } as CSSProperties
                    }
                  >
                    <a
                      href={getHref(dest.id)}
                      data-nav-id={dest.id}
                      data-active={isActive ? "true" : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={`peds-nav-drawer-link ${
                        isActive ? "is-active" : ""
                      }`}
                      onClick={(event) => {
                        onNavigate(dest.id, event);
                        onRequestClose(false);
                      }}
                    >
                      <span className="peds-nav-drawer-icon" aria-hidden="true">
                        <Icon size={20} strokeWidth={1.65} />
                      </span>
                      <span className="peds-nav-drawer-copy">
                        <span className="peds-nav-drawer-label">
                          {dest.label[lang]}
                        </span>
                        {desc ? (
                          <span className="peds-nav-drawer-desc">{desc}</span>
                        ) : null}
                      </span>
                      {isActive ? (
                        <span
                          className="peds-nav-drawer-active-dot"
                          aria-hidden="true"
                        />
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="peds-nav-drawer-footer">
            <NavLangToggle
              lang={lang}
              surfaceTone="dark"
              variant="drawer"
              onSelectLang={onSelectLang}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
