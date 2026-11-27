import { useEffect, type RefObject } from "react";
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
 * Dynamically imports GSAP only when the active route & device actually use it:
 * - Mobile Home (`/`) relies on GPU CSS choreography and downloads 0 KB of GSAP.
 * - Inner routes & desktop fine-pointer devices enhance in-place with SplitText,
 *   ScrambleText, ScrollTrigger.batch, cached-rect GPU 3D tilt, and magnetic CTAs.
 */
export function useStormSurfaceMotion({
  containerRef,
  routeKey,
  reducedMotion,
  disabled = false,
}: UseStormSurfaceMotionOptions): void {
  // 1. Entrance & scroll choreography (SplitText, ScrambleText, Pulse Dock stagger, ScrollTrigger.batch)
  useEffect(() => {
    const root = containerRef.current;
    if (!root || reducedMotion || disabled || typeof window === "undefined") {
      return;
    }

    const isHomeRoute =
      routeKey.startsWith("/|") || routeKey.startsWith("/?");
    if (isHomeRoute && !isFinePointerDevice()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void import("./gsapPlugins").then(
      ({ ensureStormGsapPlugins, gsap, ScrollTrigger, SplitText }) => {
        if (cancelled || !containerRef.current) return;
        ensureStormGsapPlugins();

        const cloneDisposers: Array<() => void> = [];
        const hoverCleanups: Array<() => void> = [];
        let triggers: Array<{ kill: () => void }> = [];

        const mountFxClone = (
          host: HTMLElement,
          extraClass?: string,
        ): { clone: HTMLSpanElement; dispose: () => void } => {
          host
            .querySelectorAll('[data-sm-fx-clone="true"]')
            .forEach((n) => n.remove());
          const clone = document.createElement("span");
          clone.setAttribute("aria-hidden", "true");
          clone.setAttribute("data-sm-fx-clone", "true");
          clone.className = extraClass
            ? `sm-fx-clone ${extraClass}`
            : "sm-fx-clone";
          clone.innerHTML = host.innerHTML;
          host.setAttribute("data-sm-fx-active", "true");
          host.appendChild(clone);

          let disposed = false;
          const dispose = () => {
            if (disposed) return;
            disposed = true;
            gsap.killTweensOf(clone);
            clone.remove();
            if (!host.querySelector('[data-sm-fx-clone="true"]')) {
              host.removeAttribute("data-sm-fx-active");
            }
          };
          cloneDisposers.push(dispose);
          return { clone, dispose };
        };

        const ctx = gsap.context(() => {
          // FX-01: SplitText masked reveal on inner-route H1s via non-destructive overlay clone
          // so React's real Text / <em> DOM nodes are never detached on VI <-> EN toggles.
          const headings = Array.from(
            root.querySelectorAll<HTMLElement>(".sp-lg-h1"),
          );
          for (const hostHeading of headings) {
            if (!hostHeading.textContent?.trim()) continue;
            let disposeHeadingClone: (() => void) | null = null;
            let headingSplit: { revert: () => void } | null = null;
            try {
              const mounted = mountFxClone(hostHeading);
              disposeHeadingClone = mounted.dispose;
              const split = SplitText.create(mounted.clone, {
                type: "lines,words",
                mask: "lines",
                aria: "none",
                linesClass: "sm-split-line",
                wordsClass: "sm-split-word",
              });
              headingSplit = split;
              const targets =
                split.words.length > 0
                  ? split.words
                  : split.lines.length > 0
                    ? split.lines
                    : [mounted.clone];
              gsap.fromTo(
                targets,
                { yPercent: 108, opacity: 0 },
                {
                  yPercent: 0,
                  opacity: 1,
                  duration: 0.68,
                  stagger: 0.032,
                  ease: "expo.out",
                  onComplete: () => {
                    headingSplit?.revert();
                    mounted.dispose();
                  },
                },
              );
            } catch {
              headingSplit?.revert();
              disposeHeadingClone?.();
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
          // Operates strictly on a temporary overlay clone so React's live text node stays 100% intact.
          const kickers = Array.from(
            root.querySelectorAll<HTMLElement>(
              ".sp-storm-eyebrow-label, .sp-lg-kick",
            ),
          );
          for (const hostKicker of kickers) {
            const hasElementChildren = Array.from(hostKicker.children).some(
              (child) => child.getAttribute("data-sm-fx-clone") !== "true",
            );
            if (hasElementChildren) continue;
            if (!hostKicker.textContent?.trim()) continue;

            let activeDispose: (() => void) | null = null;
            const runScramble = () => {
              activeDispose?.();
              const liveText = hostKicker.textContent?.trim();
              if (!liveText) return;
              const mounted = mountFxClone(
                hostKicker,
                "sm-fx-clone--scramble",
              );
              activeDispose = mounted.dispose;
              gsap.to(mounted.clone, {
                duration: 0.56,
                overwrite: "auto",
                scrambleText: {
                  text: liveText,
                  chars: TELEMETRY_CHARSET,
                  speed: 0.45,
                  revealDelay: 0.06,
                },
                ease: "none",
                onComplete: () => {
                  mounted.dispose();
                  if (activeDispose === mounted.dispose) {
                    activeDispose = null;
                  }
                },
              });
            };

            runScramble();
            hostKicker.addEventListener("mouseenter", runScramble, {
              passive: true,
            });
            hoverCleanups.push(() => {
              hostKicker.removeEventListener("mouseenter", runScramble);
              activeDispose?.();
              activeDispose = null;
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
        }, root);

        cleanup = () => {
          for (const clean of hoverCleanups) clean();
          for (const dispose of cloneDisposers) dispose();
          for (const trigger of triggers) trigger.kill();
          ctx.revert();
        };
      },
    );

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [containerRef, routeKey, reducedMotion, disabled]);

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

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void import("./gsapPlugins").then(({ ensureStormGsapPlugins, gsap }) => {
      if (cancelled || !containerRef.current) return;
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
        const card =
          rawTarget?.closest<HTMLElement>(TILT_CARD_SELECTOR) ?? null;
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

      cleanup = () => {
        root.removeEventListener("pointermove", onPointerMove);
        root.removeEventListener("pointerleave", clearAll);
        window.removeEventListener("scroll", invalidateRects);
        window.removeEventListener("resize", invalidateRects);
        clearAll();
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [containerRef, disabled, reducedMotion, routeKey]);
}
