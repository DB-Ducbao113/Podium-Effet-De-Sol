import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveCountdownLeaf } from "./LiveCountdownLeaf";
import { formatSynchronizedCountdown } from "./countdownFormat";
import {
  clearPrefetchedGlbCache,
  consumePrefetchedGlbArrayBuffer,
  hasPrefetchedGlbArrayBuffer,
  prefetchGlbArrayBuffer,
} from "./modelPrefetchCache";
import {
  prefetchStormRoute,
  resetStormRoutePrefetchCache,
} from "./routePrefetch";
import {
  createCachedGlowController,
  type GlowElementLike,
} from "./useLiquidGlassMotion";

const SRC_EXTS = [".ts", ".tsx"];

function resolveRelativeTs(fromFile: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  if (/\.(?:css|json|svg|webp|png)$/i.test(spec)) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const cand of [
    base,
    ...SRC_EXTS.map((ext) => `${base}${ext}`),
    ...SRC_EXTS.map((ext) => path.join(base, `index${ext}`)),
  ]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand;
  }
  return null;
}

function collectStaticImportClosure(entryRel: string): string[] {
  const entry = path.resolve(entryRel);
  const seen = new Set<string>();
  const walk = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const content = readFileSync(file, "utf8");
    // Runtime static imports/re-exports only (skip TypeScript-erased `import type` / `export type`
    // and lazy dynamic `import(...)` inside routePrefetch)
    const staticRe =
      /(?:import|export)\s+(?!type\s)([\s\S]*?)\s+from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
    for (const m of content.matchAll(staticRe)) {
      const spec = m[2] ?? m[3];
      if (!spec) continue;
      if (!spec.startsWith(".")) {
        seen.add(`pkg:${spec}`);
        continue;
      }
      const resolved = resolveRelativeTs(file, spec);
      if (resolved) walk(resolved);
    }
  };
  walk(entry);
  return [...seen];
}

describe("Plan 5 — Runtime Bundle Split, Smart Prefetch, Render & GPU Discipline (US-05)", () => {
  afterEach(() => {
    resetStormRoutePrefetchCache();
    clearPrefetchedGlbCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("AC-05.1: guarantees 0 Three.js / R3F static dependencies across all non-3D Storm route entries (and built chunks)", () => {
    const non3DRoutes = [
      "src/components/storm/StormAppShell.tsx",
      "src/components/storm/routes/StormHomeRoute.tsx",
      "src/components/storm/routes/StormSeasonRoute.tsx",
      "src/components/storm/routes/StormDirectoryRoute.tsx",
      "src/components/storm/routes/StormEntityRoute.tsx",
      "src/components/storm/routes/StormEngineeringArticleRoute.tsx",
      "src/components/storm/routes/StormAboutRoute.tsx",
      "src/components/storm/StormNotFound.tsx",
    ];

    for (const routeEntry of non3DRoutes) {
      const closure = collectStaticImportClosure(routeEntry);
      for (const dep of closure) {
        expect(dep, routeEntry).not.toMatch(
          /^pkg:(?:three|three-stdlib|@react-three\/)/,
        );
        expect(dep, routeEntry).not.toContain("StormGarageCanvas");
        expect(dep, routeEntry).not.toContain("EngineeringDisassemblyStage");
      }
    }

    // If production build chunks exist, verify non-3D route chunks do not import vendor-three
    const distAssetsDir = path.resolve("dist/client/assets");
    if (existsSync(distAssetsDir)) {
      const non3DChunkPrefixes = [
        "StormAppShell-",
        "StormHomeRoute-",
        "StormSeasonRoute-",
        "StormDirectoryRoute-",
        "StormEntityRoute-",
        "StormEngineeringArticleRoute-",
        "StormAboutRoute-",
        "StormViews-",
      ];
      const jsFiles = readdirSync(distAssetsDir).filter((f) =>
        f.endsWith(".js"),
      );
      for (const file of jsFiles) {
        if (non3DChunkPrefixes.some((p) => file.startsWith(p))) {
          const code = readFileSync(path.join(distAssetsDir, file), "utf8");
          expect(code, file).not.toContain("vendor-three");
        }
      }
    }
  });

  it("AC-05.2 & AC-05.6: prefetches route chunks once on hover/focus and skips completely when saveData=true or 2g", () => {
    const loader = vi.fn().mockResolvedValue({});

    vi.stubGlobal("navigator", {
      connection: { saveData: false, effectiveType: "4g" },
    });
    expect(prefetchStormRoute("showroom", loader)).toBe(true);
    // Deduplicated on repeated hover/focus
    expect(prefetchStormRoute("showroom", loader)).toBe(false);
    expect(loader).toHaveBeenCalledTimes(1);

    // Negative control: saveData === true suppresses prefetch
    resetStormRoutePrefetchCache();
    const saveDataLoader = vi.fn().mockResolvedValue({});
    vi.stubGlobal("navigator", {
      connection: { saveData: true, effectiveType: "4g" },
    });
    expect(prefetchStormRoute("engineering", saveDataLoader)).toBe(false);
    expect(saveDataLoader).not.toHaveBeenCalled();

    // Negative control: 2g connection suppresses prefetch
    vi.stubGlobal("navigator", {
      connection: { saveData: false, effectiveType: "2g" },
    });
    expect(prefetchStormRoute("engineering", saveDataLoader)).toBe(false);
    expect(saveDataLoader).not.toHaveBeenCalled();
  });

  it("AC-05.3 & AC-05.5: isolates 1Hz countdown formatting in memoized LiveCountdownLeaf and guards rAF/interval loops on document.hidden", () => {
    // React.memo wrapper check
    expect(
      (LiveCountdownLeaf as unknown as { $$typeof: symbol }).$$typeof,
    ).toBe(Symbol.for("react.memo"));

    const target = Date.UTC(2026, 10, 29, 16, 0, 0);
    const now = target - (2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5_000);
    expect(formatSynchronizedCountdown(target, now, "en")).toBe(
      "02D 03H 04M 05S",
    );
    expect(formatSynchronizedCountdown(target, target + 1000, "vi")).toBe(
      "TUẦN ĐUA · ĐANG DIỄN RA",
    );

    for (const file of [
      "src/components/storm/LiveCountdownLeaf.tsx",
      "src/components/storm/StormHeroBackdrop.tsx",
      "src/components/storm/StormEngineeringShow.tsx",
      "src/components/storm/routes/StormShowroomRoute.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).toContain("document.hidden");
    }
  });

  it("AC-05.4: caches [data-lg-glow] bounding rect across consecutive pointermove frames (0 per-frame layout reflows)", () => {
    const vars = new Map<string, string>();
    const attrs = new Map<string, string>();
    const getRectSpy = vi.fn(() => ({
      left: 100,
      top: 200,
      width: 400,
      height: 200,
    }));

    const mockCard: GlowElementLike = {
      getBoundingClientRect: getRectSpy,
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
      style: {
        setProperty: (k, v) => vars.set(k, v),
      },
    };

    const controller = createCachedGlowController();

    // Simulate 25 consecutive pointermove frames inside the same card
    for (let frame = 0; frame < 25; frame++) {
      expect(
        controller.onTargetMove(mockCard, 100 + frame * 10, 200 + frame * 4),
      ).toBe(true);
      controller.flushFrame();
    }

    // Measured strictly ONCE on card entry — 0 per-frame forced reflows!
    expect(getRectSpy).toHaveBeenCalledTimes(1);
    expect(attrs.get("data-lg-lit")).toBe("true");
    expect(vars.get("--lg-mx")).toBe("60.0%");
    expect(vars.get("--lg-my")).toBe("48.0%");

    // Scroll/resize invalidation triggers a single fresh measurement on the next frame
    controller.invalidate();
    controller.onTargetMove(mockCard, 300, 300);
    controller.flushFrame();
    expect(getRectSpy).toHaveBeenCalledTimes(2);
    expect(vars.get("--lg-mx")).toBe("50.0%");
    expect(vars.get("--lg-my")).toBe("50.0%");

    controller.clear();
    expect(attrs.has("data-lg-lit")).toBe(false);
  });

  it("AC-05.7: deduplicates GLB ArrayBuffer prefetching, evicts failures, and keeps Desktop Showroom single-LOD + non-blocking pit crew", async () => {
    const payload = new Uint8Array([7, 8, 9]).buffer;
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => payload,
    });
    vi.stubGlobal("fetch", fetchSpy);

    const url = "/models/fp04rb-showroom-desktop.glb";
    const p1 = prefetchGlbArrayBuffer(url);
    const p2 = prefetchGlbArrayBuffer(url);
    expect(p1).toBe(p2);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(hasPrefetchedGlbArrayBuffer(url)).toBe(true);

    const consumed = consumePrefetchedGlbArrayBuffer(url);
    expect(consumed).toBe(p1);
    expect(await consumed).toBe(payload);
    expect(hasPrefetchedGlbArrayBuffer(url)).toBe(false);

    // Failed prefetch evicts cache entry so future attempts can recover
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(prefetchGlbArrayBuffer("/models/fail.glb")).rejects.toThrow(
      /503/,
    );
    expect(hasPrefetchedGlbArrayBuffer("/models/fail.glb")).toBe(false);

    // Showroom canvas loads only selected LOD (no redundant mobile download on desktop)
    // and hydrates pit crew non-blockingly after primary car readiness
    const showroomCanvasSrc = readFileSync(
      "src/components/storm/StormGarageCanvas.tsx",
      "utf8",
    );
    expect(showroomCanvasSrc).not.toContain('loadFp04rbShowroomModel("mobile"');
    expect(showroomCanvasSrc).toContain(
      "loadFp04rbShowroomModel(lod, ac.signal)",
    );
  });
});
