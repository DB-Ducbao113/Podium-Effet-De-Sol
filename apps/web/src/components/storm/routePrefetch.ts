import type { CanonicalNavId } from "../layout/navigation/navRegistry";
import { prefetchGlbArrayBuffer } from "./modelPrefetchCache";

export type StormPrefetchTarget =
  CanonicalNavId | "entity" | "engineering-article";

interface NetworkInformationLike {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
}

const ENGINEERING_GLB_URL = "/models/fp04rb-engineering-v1.glb";
const SHOWROOM_DESKTOP_GLB_URL = "/models/fp04rb-showroom-desktop.glb";
const SHOWROOM_MOBILE_GLB_URL = "/models/fp04rb-showroom-mobile.glb";

const prefetchedTargets = new Set<StormPrefetchTarget>();

export function resetStormRoutePrefetchCache(): void {
  prefetchedTargets.clear();
}

export function shouldSkipStormPrefetch(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;
  if (!conn) return false;
  if (conn.saveData === true) return true;
  if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") {
    return true;
  }
  return false;
}

function resolvePreferredShowroomGlbUrl(): string {
  if (typeof window === "undefined") return SHOWROOM_DESKTOP_GLB_URL;
  const narrow = window.innerWidth <= 768;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return narrow || coarse ? SHOWROOM_MOBILE_GLB_URL : SHOWROOM_DESKTOP_GLB_URL;
}

const ROUTE_LOADERS: Record<StormPrefetchTarget, () => Promise<unknown>> = {
  overview: () => import("./routes/StormHomeRoute"),
  results: () => import("./routes/StormSeasonRoute"),
  calendar: () => import("./routes/StormSeasonRoute"),
  standings: () => import("./routes/StormSeasonRoute"),
  teams: () => import("./routes/StormDirectoryRoute"),
  drivers: () => import("./routes/StormDirectoryRoute"),
  engineering: () =>
    Promise.all([
      import("./routes/StormEngineeringRoute"),
      import("../engineering/EngineeringDisassemblyStage"),
      prefetchGlbArrayBuffer(ENGINEERING_GLB_URL).catch(() => undefined),
    ]),
  showroom: () =>
    Promise.all([
      import("./routes/StormShowroomRoute"),
      import("./StormGarageCanvas"),
      prefetchGlbArrayBuffer(resolvePreferredShowroomGlbUrl()).catch(
        () => undefined,
      ),
    ]),
  entity: () => import("./routes/StormEntityRoute"),
  "engineering-article": () => import("./routes/StormEngineeringArticleRoute"),
  about: () => import("./routes/StormAboutRoute"),
};

/**
 * Network-aware route chunk & 3D model prefetcher (`REQ-12`, `SC-05`).
 * - Deduplicates repeated hover/focus triggers via `prefetchedTargets`.
 * - Respects `navigator.connection.saveData === true` and `2g` connections.
 * - Eliminates the lazy 3D stage + GLB waterfall for `/engineering` and `/showroom`
 *   without introducing static Three.js dependencies into non-3D routes.
 */
export function prefetchStormRoute(
  target: StormPrefetchTarget,
  loaderOverride?: () => Promise<unknown>,
): boolean {
  if (shouldSkipStormPrefetch()) return false;
  if (prefetchedTargets.has(target)) return false;
  prefetchedTargets.add(target);
  const load = loaderOverride ?? ROUTE_LOADERS[target];
  void load().catch(() => {
    prefetchedTargets.delete(target);
  });
  return true;
}
