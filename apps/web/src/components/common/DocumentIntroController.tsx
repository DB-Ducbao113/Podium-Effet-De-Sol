import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useNavigationStore } from "../../store/useNavigationStore";
import { CinematicStartGantryIntro } from "../engineering-lab/CinematicStartGantryIntro";
import {
  initialIntroDecision,
  INTRO_COMPLETE_EVENT,
} from "./documentIntroState";

const HOMEPAGE_REVEAL_SETTLE_MS = 950;

export function DocumentIntroController() {
  const location = useLocation();
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(initialIntroDecision);
  const wasShowing = useRef(showIntro);

  useEffect(() => {
    if (location.pathname !== "/") {
      setShowIntro(false);
      delete document.documentElement.dataset.introState;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!showIntro && wasShowing.current) {
      wasShowing.current = false;
      window.dispatchEvent(new Event(INTRO_COMPLETE_EVENT));
      // Keep the coordinated Storm homepage entrance active briefly while
      // hero lines & Pulse Dock finish settling, then clear all intro hooks.
      if (document.documentElement.dataset.introState === "revealing") {
        const settleTimer = window.setTimeout(() => {
          if (document.documentElement.dataset.introState === "revealing") {
            delete document.documentElement.dataset.introState;
          }
        }, HOMEPAGE_REVEAL_SETTLE_MS);
        return () => window.clearTimeout(settleTimer);
      }
    }
  }, [showIntro]);

  if (!showIntro || location.pathname !== "/") return null;
  return (
    <CinematicStartGantryIntro
      lang={lang}
      reducedMotion={reducedMotion}
      divisionLabel={
        lang === "vi"
          ? "TRẢI NGHIỆM ĐUA XE KỸ THUẬT SỐ"
          : "MOTORSPORT DIGITAL EXPERIENCE"
      }
      syncDocumentIntroHooks
      onComplete={() => setShowIntro(false)}
    />
  );
}
