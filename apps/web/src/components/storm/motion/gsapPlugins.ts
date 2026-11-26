import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

/**
 * Registers the lean GSAP 3.15 plugin set actively used by Storm surfaces
 * idempotently in browser contexts (safe in SSR / Vitest Node).
 */
export function ensureStormGsapPlugins(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin);
  registered = true;
}

export { gsap, useGSAP, ScrambleTextPlugin, ScrollTrigger, SplitText };
