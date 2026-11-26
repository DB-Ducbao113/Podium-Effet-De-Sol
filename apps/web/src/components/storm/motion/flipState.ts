import { Flip } from "gsap/Flip";
import { ensureStormGsapPlugins, gsap } from "./gsapPlugins";

/**
 * Captures pre-change element bounds right before updating filter/sort React state
 * so GSAP Flip can smoothly animate cards into their new layout positions.
 */
export function captureFlipGridState(
  container: HTMLElement | null,
  reducedMotion: boolean,
): Flip.FlipState | null {
  if (!container || reducedMotion || typeof window === "undefined") {
    return null;
  }
  ensureStormGsapPlugins();
  gsap.registerPlugin(Flip);
  const items = container.querySelectorAll<HTMLElement>("[data-flip-id]");
  if (items.length === 0) return null;
  return Flip.getState(items);
}
