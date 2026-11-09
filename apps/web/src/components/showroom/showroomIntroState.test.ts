import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SHOWROOM_INTRO_COPY,
  SHOWROOM_INTRO_FILM_SECONDS,
  SHOWROOM_INTRO_FOCUS_MS,
  SHOWROOM_INTRO_MEDIA,
  SHOWROOM_INTRO_REVEAL_AT,
  SHOWROOM_INTRO_REVEAL_MS,
  detectShowroomIntroCapability,
  getShowroomIntroTier,
  introProgress,
  nextIntroPhase,
  type ShowroomIntroCapability,
  type ShowroomIntroPhase,
} from "./showroomIntroState";

afterEach(() => vi.unstubAllGlobals());

const capable: ShowroomIntroCapability = {
  reducedMotion: false,
  saveData: false,
  videoSupported: true,
  effectiveType: "4g",
  deviceMemory: 8,
  hardwareConcurrency: 8,
};

describe("showroom intro capability tiers", () => {
  it("enters immediately (T0) for reduced motion, save-data, weak device or no video", () => {
    expect(getShowroomIntroTier({ ...capable, reducedMotion: true })).toBe(
      "T0",
    );
    expect(getShowroomIntroTier({ ...capable, saveData: true })).toBe("T0");
    expect(getShowroomIntroTier({ ...capable, videoSupported: false })).toBe(
      "T0",
    );
    expect(getShowroomIntroTier({ ...capable, effectiveType: "slow-2g" })).toBe(
      "T0",
    );
    expect(getShowroomIntroTier({ ...capable, effectiveType: "2g" })).toBe(
      "T0",
    );
    expect(getShowroomIntroTier({ ...capable, deviceMemory: 2 })).toBe("T0");
    expect(getShowroomIntroTier({ ...capable, hardwareConcurrency: 2 })).toBe(
      "T0",
    );
  });

  it("uses the small MP4 (T1) on 3g or mid-range hardware", () => {
    expect(getShowroomIntroTier({ ...capable, effectiveType: "3g" })).toBe(
      "T1",
    );
    expect(getShowroomIntroTier({ ...capable, deviceMemory: 4 })).toBe("T1");
    expect(getShowroomIntroTier({ ...capable, hardwareConcurrency: 4 })).toBe(
      "T1",
    );
  });

  it("uses the full WebM (T2) on capable devices and tolerates missing hints", () => {
    expect(getShowroomIntroTier(capable)).toBe("T2");
    expect(
      getShowroomIntroTier({
        reducedMotion: false,
        saveData: false,
        videoSupported: true,
      }),
    ).toBe("T2");
  });
});

describe("showroom intro phase machine", () => {
  it("opens the gate into the film and ignores repeated opens", () => {
    expect(nextIntroPhase("gate", "open")).toBe("playing");
    expect(nextIntroPhase("playing", "open")).toBe("playing");
    expect(nextIntroPhase("entered", "open")).toBe("entered");
  });

  it("enters the Showroom on skip, film end or playback error from any phase", () => {
    for (const phase of [
      "gate",
      "playing",
      "entered",
    ] as ShowroomIntroPhase[]) {
      expect(nextIntroPhase(phase, "skip")).toBe("entered");
      expect(nextIntroPhase(phase, "ended")).toBe("entered");
      expect(nextIntroPhase(phase, "error")).toBe("entered");
    }
  });

  it("replays back to the gate from any phase", () => {
    for (const phase of [
      "gate",
      "playing",
      "entered",
    ] as ShowroomIntroPhase[]) {
      expect(nextIntroPhase(phase, "replay")).toBe("gate");
    }
  });
});

describe("showroom intro progress", () => {
  it("clamps to 0..1 and falls back to the measured film length", () => {
    expect(introProgress(0, 8.625)).toBe(0);
    expect(introProgress(-3, 8.625)).toBe(0);
    expect(introProgress(Number.NaN, 8.625)).toBe(0);
    expect(introProgress(4.3125, 8.625)).toBeCloseTo(0.5, 5);
    expect(introProgress(20, 8.625)).toBe(1);
    expect(introProgress(SHOWROOM_INTRO_FILM_SECONDS / 2, 0)).toBeCloseTo(
      0.5,
      5,
    );
    expect(introProgress(SHOWROOM_INTRO_FILM_SECONDS, Number.NaN)).toBe(1);
  });

  it("reveals before the film ends so the white-flash cut is hidden", () => {
    expect(SHOWROOM_INTRO_REVEAL_AT).toBeGreaterThan(0);
    expect(SHOWROOM_INTRO_REVEAL_AT).toBeLessThan(SHOWROOM_INTRO_FILM_SECONDS);
  });

  it("lands focus on replay after the reveal begins but before the overlay unmounts", () => {
    expect(SHOWROOM_INTRO_FOCUS_MS).toBeGreaterThan(0);
    expect(SHOWROOM_INTRO_FOCUS_MS).toBeLessThan(SHOWROOM_INTRO_REVEAL_MS);
  });
});

describe("showroom intro capability detection", () => {
  it("reads reduced motion from matchMedia and flags unsupported video without a navigator", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("navigator", undefined);
    const capability = detectShowroomIntroCapability();
    expect(capability.reducedMotion).toBe(true);
    expect(capability.videoSupported).toBe(false);
    expect(getShowroomIntroTier(capability)).toBe("T0");
  });

  it("probes codec support and reads connection hints from the navigator", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("document", {
      createElement: () => ({
        canPlayType: (type: string) => (type.includes("mp4") ? "probably" : ""),
      }),
    });
    vi.stubGlobal("navigator", {
      connection: { saveData: true, effectiveType: "3g" },
      deviceMemory: 4,
      hardwareConcurrency: 4,
    });
    const capability = detectShowroomIntroCapability();
    expect(capability.reducedMotion).toBe(false);
    expect(capability.videoSupported).toBe(true);
    expect(capability.saveData).toBe(true);
    expect(capability.effectiveType).toBe("3g");
    expect(getShowroomIntroTier(capability)).toBe("T0");
  });
});

describe("showroom intro copy", () => {
  it("provides complete vi/en labels without retired model or ownership claims", () => {
    for (const lang of ["vi", "en"] as const) {
      const copy = SHOWROOM_INTRO_COPY[lang];
      for (const key of [
        "eyebrow",
        "title",
        "titleEmphasis",
        "open",
        "skip",
        "replay",
        "filmLabel",
      ] as const) {
        expect(copy[key].length).toBeGreaterThan(0);
      }
      const combined = Object.values(copy).join(" ");
      expect(combined).not.toContain("EDS-G01");
      expect(combined).not.toMatch(/sở hữu|ownership|own the model/i);
    }
    expect(SHOWROOM_INTRO_COPY.vi.open).toBe("Mở Showroom");
    expect(SHOWROOM_INTRO_COPY.vi.skip).toBe("Bỏ qua");
    expect(SHOWROOM_INTRO_COPY.en.open).toBe("Open Showroom");
    expect(SHOWROOM_INTRO_COPY.en.skip).toBe("Skip");
  });

  it("keeps only essential gate copy, dropping the lede and caption annotations", () => {
    for (const lang of ["vi", "en"] as const) {
      const copy = SHOWROOM_INTRO_COPY[lang];
      expect(copy).not.toHaveProperty("lede");
      expect(copy).not.toHaveProperty("hint");
      expect(copy).not.toHaveProperty("reviewNote");
      expect(Object.keys(copy).sort()).toEqual(
        [
          "eyebrow",
          "title",
          "titleEmphasis",
          "open",
          "skip",
          "replay",
          "filmLabel",
        ].sort(),
      );
    }
  });
});

describe("showroom intro review media manifest", () => {
  const manifest = JSON.parse(
    readFileSync(
      "../../docs/asset-manifests/showroom-intro-v3-review.json",
      "utf8",
    ),
  ) as {
    release: string;
    assets: { file: string; type: string; bytes: number; sha256: string }[];
  };

  it("holds the media for local DEV review and lists exactly the three extracted files", () => {
    expect(manifest.release).toBe("hold");
    expect(manifest.assets.map((asset) => asset.file).sort()).toEqual([
      "intro-poster.webp",
      "intro-tunnel-540.mp4",
      "intro-tunnel-720.webm",
    ]);
    for (const asset of manifest.assets) {
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("serves the media only from the validated DEV route, never from public", () => {
    for (const url of Object.values(SHOWROOM_INTRO_MEDIA)) {
      expect(url.startsWith("/__peds-showroom-intro/")).toBe(true);
      expect(existsSync(resolve(process.cwd(), "public", url.slice(1)))).toBe(
        false,
      );
    }
  });

  it("validates local bytes and hashes when the review assets are present", () => {
    for (const asset of manifest.assets) {
      const file = resolve(
        process.cwd(),
        "../..",
        ".local-assets/showroom-intro-v3",
        asset.file,
      );
      if (process.env.PEDS_VERIFY_LOCAL_ASSETS === "1") {
        expect(existsSync(file), asset.file).toBe(true);
      }
      if (!existsSync(file)) continue;
      const bytes = readFileSync(file);
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        asset.sha256,
      );
    }
  });
});

describe("showroom intro production isolation", () => {
  it("gates the intro behind import.meta.env.DEV in ShowroomView", () => {
    const source = readFileSync(
      "src/components/showroom/ShowroomView.tsx",
      "utf8",
    );
    expect(source).toContain(
      "import.meta.env.DEV\n  ? React.lazy(() => import('./ShowroomIntroV3'))",
    );
    expect(source).toContain("const introEnabled = import.meta.env.DEV");
    expect(source).not.toContain("import './showroomIntroV3.css'");
  });

  it("serves the review media through a serve-only Vite plugin", () => {
    const vite = readFileSync("vite.config.ts", "utf8");
    expect(vite).toContain("peds-showroom-intro-review-assets");
    expect(vite).toContain("/__peds-showroom-intro");
    const plugin = vite.slice(vite.indexOf("const showroomIntroReviewPlugin"));
    expect(plugin.slice(0, plugin.indexOf("configureServer"))).toMatch(
      /apply:\s*"serve"/,
    );
  });

  it("styles the replay control in the always-loaded route CSS, not the lazy intro chunk", () => {
    const route = readFileSync(
      "src/components/showroom/showroomRoute.css",
      "utf8",
    );
    const intro = readFileSync(
      "src/components/showroom/showroomIntroV3.css",
      "utf8",
    );
    expect(route).toContain(".sr-replay");
    expect(intro).not.toContain(".sr-replay");
  });
});

describe("showroom intro reveal sequencing", () => {
  it("gates the stage and replay reveal on data-reveal so T0 enters immediately", () => {
    const route = readFileSync(
      "src/components/showroom/showroomRoute.css",
      "utf8",
    );
    expect(route).toContain('.sr-view[data-reveal="true"] .sr-stage');
    expect(route).toContain('.sr-view[data-reveal="true"] .sr-replay');
    expect(route).not.toContain('.sr-view[data-intro="entered"] .sr-stage');
    const view = readFileSync(
      "src/components/showroom/ShowroomView.tsx",
      "utf8",
    );
    expect(view).toContain("data-reveal={revealed ? 'true' : 'false'}");
  });

  it("bridges the white-flash cut with a veil that blooms then recedes", () => {
    const intro = readFileSync(
      "src/components/showroom/showroomIntroV3.css",
      "utf8",
    );
    expect(intro).toContain(".sr-intro-veil");
    expect(intro).toContain("sr-veil-bridge");
    const surface = readFileSync(
      "src/components/showroom/ShowroomIntroV3.tsx",
      "utf8",
    );
    expect(surface).toContain('className="sr-intro-veil"');
  });

  it("keeps the overlay mounted through its exit animation instead of unmounting on enter", () => {
    const view = readFileSync(
      "src/components/showroom/ShowroomView.tsx",
      "utf8",
    );
    expect(view).toContain("!introDismissed && ShowroomIntroV3");
    expect(view).toContain("onDismissed={handleDismissed}");
    expect(view).not.toContain("introEnabled && !entered && ShowroomIntroV3");
    const intro = readFileSync(
      "src/components/showroom/ShowroomIntroV3.tsx",
      "utf8",
    );
    expect(intro).toContain("onDismissed();");
  });
});
