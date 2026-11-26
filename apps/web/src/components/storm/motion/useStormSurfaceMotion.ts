import { useEffect, type RefObject } from "react";
import {
  ensureStormGsapPlugins,
  gsap,
  ScrollTrigger,
  SplitText,
  useGSAP,
} from "./gsapPlugins";
import {
  clampBoundedOffset,
  computeCardTiltAngles,
  isFinePointerDevice,
} from "./motionConfig";

const TELEMETRY_CHARSET = "0123456789ABCDEF/·-";

const TILT_CARD_SELECTOR = [
  ".sp-pulse-card",
  ".sp-lg-spot",
  ".sp-lg-tcard",
  ".sp-lg-dcard",
  ".sp-about-source-card",
].join(", ");

const MAGNETIC_SELECTOR = ".sp-storm-btn, .sp-pulse-mini-link";

const SCROLL_BATCH_SELECTOR = [
  ".sp-lg-tile",
  ".sp-lg-tcard",
  ".sp-lg-dcard",
  ".sp-about-source-card",
  ".sp-about-grid > article",
  ".sp-entity-grid > section",
].join(", ");

export interface UseStormSurfaceMotionOptions {
  readonly containerRef: RefObject<HTMLElement | null>;
  readonly routeKey: string;
  readonly reducedMotion: boolean;
  readonly disabled?: boolean;
}

/**
 * Pure non-invasive motion orchestrator attached to StormAppShell `<main>`.
 * Enhances existing Storm DOM elements in place with ZERO added content or layout edits:
 * - FX-01: GSAP 3.15 SplitText (`lines,words`, `mask: "lines"`, `aria: "auto"`) on `.sp-lg-h1`
 *          + staggered rise on Home `.sp-pulse-card`
 * - FX-02: GSAP 3.15 ScrambleText decode on `.sp-storm-eyebrow-label` & `.sp-lg-kick`
 * - FX-04a: Delegated cached-rect GPU 3D tilt (<= 2.6 deg) via `gsap.quickTo`
 * - FX-05: Delegated cached-rect magnetic pull (<= 5 px) on `.sp-storm-btn` & `.sp-pulse-mini-link`
 * - ScrollTrigger.batch staggered reveal on editorial/directory cards
 */
export function useStormSurfaceMotion({
  containerRef,
  routeKey,
  reducedMotion,
  disabled = false,
}: UseStormSurfaceMotionOptions): void {
  // 1. Entrance & scroll choreography (SplitText, ScrambleText, Pulse Dock stagger, ScrollTrigger.batch)
  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root || reducedMotion || disabled || typeof window === "undefined") {
        return;
      }

      ensureStormGsapPlugins();

      const splits: SplitText[] = [];
      const hoverCleanups: Array<() => void> = [];

      // FX-01: SplitText masked reveal on inner-route H1s (preserving Vietnamese diacritics via lines,words)
      const headings = Array.from(
        root.querySelectorAll<HTMLElement>(".sp-lg-h1"),
      );
      for (const h1 of headings) {
        try {
          const split = SplitText.create(h1, {
            type: "lines,words",
            mask: "lines",
            aria: "auto",
            linesClass: "sm-split-line",
            wordsClass: "sm-split-word",
          });
          splits.push(split);
          const targets =
            split.words.length > 0
              ? split.words
              : split.lines.length > 0
                ? split.lines
                : [h1];
          gsap.fromTo(
            targets,
            { yPercent: 108, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.68,
              stagger: 0.032,
              ease: "expo.out",
              clearProps: "transform,opacity",
            },
          );
        } catch {
          // Graceful no-op in non-layout environments
        }
      }

      // FX-01b: Crisp staggered entrance for Home Live F1 Pulse Dock cards
      const pulseCards = Array.from(
        root.querySelectorAll<HTMLElement>(".sp-pulse-card"),
      );
      if (pulseCards.length > 0) {
        gsap.fromTo(
          pulseCards,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.62,
            delay: 0.14,
            stagger: 0.075,
            ease: "expo.out",
            clearProps: "transform,opacity",
          },
        );
      }

      // FX-02: Pit-wall telemetry ScrambleText decode on eyebrows & page kickers
      const kickers = Array.from(
        root.querySelectorAll<HTMLElement>(
          ".sp-storm-eyebrow-label, .sp-lg-kick",
        ),
      );
      for (const kicker of kickers) {
        // Only animate leaf text kickers so we never wipe nested icons/spans
        if (kicker.children.length > 0) continue;
        const originalText = kicker.textContent?.trim();
        if (!originalText) continue;
        if (!kicker.getAttribute("aria-label")) {
          kicker.setAttribute("aria-label", originalText);
        }

        const runScramble = () => {
          gsap.to(kicker, {
            duration: 0.56,
            overwrite: "auto",
            scrambleText: {
              text: originalText,
              chars: TELEMETRY_CHARSET,
              speed: 0.45,
              revealDelay: 0.06,
            },
            ease: "none",
          });
        };

        runScramble();
        kicker.addEventListener("mouseenter", runScramble, { passive: true });
        hoverCleanups.push(() => {
          kicker.removeEventListener("mouseenter", runScramble);
          kicker.textContent = originalText;
        });
      }

      // ScrollTrigger.batch staggered reveal for below-the-fold cards
      const batchNodes = Array.from(
        root.querySelectorAll<HTMLElement>(SCROLL_BATCH_SELECTOR),
      );
      const viewportH = window.innerHeight || 900;
      const belowFold = batchNodes.filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top > viewportH * 0.94;
      });

      let triggers: ScrollTrigger[] = [];
      if (belowFold.length > 0) {
        gsap.set(belowFold, { y: 18, opacity: 0 });
        triggers = ScrollTrigger.batch(belowFold, {
          start: "top 92%",
          once: true,
          onEnter: (elements) => {
            gsap.to(elements, {
              y: 0,
              opacity: 1,
              duration: 0.54,
              stagger: 0.045,
              ease: "expo.out",
              overwrite: "auto",
              clearProps: "transform,opacity",
            });
          },
        });
      }

      return () => {
        for (const clean of hoverCleanups) clean();
        for (const split of splits) split.revert();
        for (const trigger of triggers) trigger.kill();
      };
    },
    {
      scope: containerRef,
      dependencies: [routeKey, reducedMotion, disabled],
      revertOnUpdate: true,
    },
  );

  // 2. Delegated cached-rect GPU 3D tilt (FX-04a) & Magnetic CTAs (FX-05) — fine pointer only
  useEffect(() => {
    const root = containerRef.current;
    if (
      !root ||
      reducedMotion ||
      disabled ||
      typeof window === "undefined" ||
      !isFinePointerDevice()
    ) {
      return;
    }

    ensureStormGsapPlugins();

    // Cached state for active tilt card (zero per-frame getBoundingClientRect!)
    let activeCard: HTMLElement | null = null;
    let cardRect: DOMRect | null = null;
    let cardQuickX: gsap.QuickToFunc | null = null;
    let cardQuickY: gsap.QuickToFunc | null = null;

    // Cached state for active magnetic button
    let activeBtn: HTMLElement | null = null;
    let btnRect: DOMRect | null = null;
    let btnQuickX: gsap.QuickToFunc | null = null;
    let btnQuickY: gsap.QuickToFunc | null = null;

    const resetCard = () => {
      if (activeCard) {
        const el = activeCard;
        el.removeAttribute("data-sm-tilt");
        gsap.to(el, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.36,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            gsap.set(el, { clearProps: "transform,transformPerspective" });
          },
        });
      }
      activeCard = null;
      cardRect = null;
      cardQuickX = null;
      cardQuickY = null;
    };

    const resetBtn = () => {
      if (activeBtn) {
        const el = activeBtn;
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.32,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            gsap.set(el, { clearProps: "transform" });
          },
        });
      }
      activeBtn = null;
      btnRect = null;
      btnQuickX = null;
      btnQuickY = null;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rawTarget = event.target as HTMLElement | null;

      // Magnetic button tracking
      const btn = rawTarget?.closest<HTMLElement>(MAGNETIC_SELECTOR) ?? null;
      if (btn !== activeBtn) {
        resetBtn();
        if (btn) {
          activeBtn = btn;
          btnRect = btn.getBoundingClientRect();
          btnQuickX = gsap.quickTo(btn, "x", {
            duration: 0.24,
            ease: "power3.out",
          });
          btnQuickY = gsap.quickTo(btn, "y", {
            duration: 0.24,
            ease: "power3.out",
          });
        }
      }
      if (activeBtn) {
        if (!btnRect) btnRect = activeBtn.getBoundingClientRect();
        const dx = event.clientX - (btnRect.left + btnRect.width / 2);
        const dy = event.clientY - (btnRect.top + btnRect.height / 2);
        btnQuickX?.(clampBoundedOffset(dx, 5, 0.2));
        btnQuickY?.(clampBoundedOffset(dy, 5, 0.2));
      }

      // Subtle GPU 3D card tilt tracking
      const card = rawTarget?.closest<HTMLElement>(TILT_CARD_SELECTOR) ?? null;
      if (card !== activeCard) {
        resetCard();
        if (card) {
          activeCard = card;
          cardRect = card.getBoundingClientRect();
          card.setAttribute("data-sm-tilt", "true");
          gsap.set(card, { transformPerspective: 1100 });
          cardQuickX = gsap.quickTo(card, "rotateX", {
            duration: 0.34,
            ease: "power3.out",
          });
          cardQuickY = gsap.quickTo(card, "rotateY", {
            duration: 0.34,
            ease: "power3.out",
          });
        }
      }
      if (activeCard) {
        if (!cardRect) cardRect = activeCard.getBoundingClientRect();
        if (cardRect.width > 0 && cardRect.height > 0) {
          const nx = Math.max(
            0,
            Math.min(1, (event.clientX - cardRect.left) / cardRect.width),
          );
          const ny = Math.max(
            0,
            Math.min(1, (event.clientY - cardRect.top) / cardRect.height),
          );
          const { rotateX, rotateY } = computeCardTiltAngles(nx, ny, 2.6);
          cardQuickX?.(rotateX);
          cardQuickY?.(rotateY);
        }
      }
    };

    const invalidateRects = () => {
      cardRect = null;
      btnRect = null;
    };

    const clearAll = () => {
      resetCard();
      resetBtn();
    };

    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", clearAll, { passive: true });
    window.addEventListener("scroll", invalidateRects, { passive: true });
    window.addEventListener("resize", invalidateRects, { passive: true });

    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", clearAll);
      window.removeEventListener("scroll", invalidateRects);
      window.removeEventListener("resize", invalidateRects);
      clearAll();
    };
  }, [containerRef, disabled, reducedMotion, routeKey]);
}
