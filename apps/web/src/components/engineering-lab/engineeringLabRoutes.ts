import { isDocumentReload } from "../common/documentReload";
import {
  getEngineeringArticle,
  type EngineeringArticle,
} from "../../data/engineeringArticles";
import { SANDBOX_INTRO_SEEN_KEY } from "./startGantryTiming";

export type LabModeId =
  | "active-aero"
  | "ground-effect"
  | "hybrid-powertrain"
  | "vehicle-dynamics";

export const ENG_LAB_BASE_PATH = "/__engineering-lab";

export const VALID_LAB_MODES: readonly LabModeId[] = [
  "active-aero",
  "ground-effect",
  "hybrid-powertrain",
  "vehicle-dynamics",
] as const;

export const SHORT_SLUG_ALIASES: Readonly<Record<string, string>> = {
  "ground-effect": "ground-effect-aerodynamics",
  "active-aerodynamics": "active-aerodynamics-wing-mechanics",
  "hybrid-powertrain": "hybrid-powertrains-energy-management",
  "vehicle-dynamics": "vehicle-dynamics-suspension",
};

export const ARTICLE_TO_LAB_MODE: Readonly<Record<string, LabModeId>> = {
  "ground-effect": "ground-effect",
  "ground-effect-aerodynamics": "ground-effect",
  "active-aerodynamics": "active-aero",
  "active-aerodynamics-wing-mechanics": "active-aero",
  "hybrid-powertrain": "hybrid-powertrain",
  "hybrid-powertrains-energy-management": "hybrid-powertrain",
  "vehicle-dynamics": "vehicle-dynamics",
  "vehicle-dynamics-suspension": "vehicle-dynamics",
};

// Module-scoped SPA session guard: resets automatically on hard browser refresh (F5),
// while preventing the intro from re-triggering on internal SPA route remounts.
// Marked ONLY inside committed useEffect (never inside render/useState) so React
// StrictMode and Suspense double-renders remain 100% pure and deterministic.
let sandboxIntroConsumedInSpaSession = false;

export function markSandboxIntroConsumed(): void {
  sandboxIntroConsumedInSpaSession = true;
}

export function resetSandboxIntroSessionForTests(): void {
  sandboxIntroConsumedInSpaSession = false;
}

export function resolveSandboxEngineeringArticle(
  slug?: string,
): EngineeringArticle | undefined {
  if (!slug) return undefined;
  const canonicalSlug = SHORT_SLUG_ALIASES[slug] ?? slug;
  return getEngineeringArticle(canonicalSlug);
}

export function isEngineeringLabSandboxPath(pathname: string): boolean {
  return (
    pathname === ENG_LAB_BASE_PATH ||
    pathname.startsWith(`${ENG_LAB_BASE_PATH}/`)
  );
}

export function buildEngineeringLabHref(options?: {
  readonly lab?: LabModeId;
  readonly intro?: "replay" | "skip";
  readonly hash?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.lab) params.set("lab", options.lab);
  if (options?.intro) params.set("intro", options.intro);
  const search = params.toString() ? `?${params.toString()}` : "";
  const hash = options?.hash
    ? options.hash.startsWith("#")
      ? options.hash
      : `#${options.hash}`
    : "";
  return `${ENG_LAB_BASE_PATH}${search}${hash}`;
}

export function buildEngineeringLabArticleHref(slug: string): string {
  return `${ENG_LAB_BASE_PATH}/${encodeURIComponent(slug)}`;
}

export function shouldAutoPlaySandboxIntro(
  searchParams: URLSearchParams,
  hash: string,
  perf?: Pick<Performance, "getEntriesByType">,
): boolean {
  const introParam = searchParams.get("intro")?.toLowerCase();
  if (introParam === "skip" || introParam === "false" || introParam === "0") {
    return false;
  }
  if (introParam === "replay") {
    return true;
  }
  if (searchParams.has("lab") || hash === "#interactive-lab") {
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }

  // Never replay on internal SPA link remounts once consumed in this loaded document
  if (sandboxIntroConsumedInSpaSession) {
    return false;
  }

  // Always play when the user explicitly refreshes the browser tab (F5 / Ctrl+R)
  if (isDocumentReload(perf)) {
    return true;
  }

  // Play once on initial tab entry
  try {
    return window.sessionStorage?.getItem(SANDBOX_INTRO_SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

export interface EngineeringLabSeoOptions {
  readonly lang: "vi" | "en";
  readonly title: string;
  readonly description: string;
}

export function applyEngineeringLabSeoHead(
  doc: Document,
  { lang, title, description }: EngineeringLabSeoOptions,
): void {
  doc.documentElement.lang = lang;
  doc.title = title;

  const upsertMeta = (name: string, content: string) => {
    let el = doc.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!el) {
      el = doc.createElement("meta");
      el.setAttribute("name", name);
      doc.head.appendChild(el);
    }
    el.content = content;
  };

  upsertMeta("robots", "noindex, nofollow");
  upsertMeta("description", description);
  doc.head.querySelector('link[rel="canonical"]')?.remove();
  doc.head.querySelector('meta[property="og:url"]')?.remove();
  doc.getElementById("route-structured-data")?.remove();
}
