import fs from "node:fs";
import path from "node:path";
import React, { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "../../store/useNavigationStore";
import { CinematicStartGantryIntro } from "./CinematicStartGantryIntro";
import { EngineeringLabInteractiveSection } from "./EngineeringLabInteractiveSection";
import {
  applyEngineeringLabSeoHead,
  buildEngineeringLabArticleHref,
  buildEngineeringLabHref,
  isEngineeringLabSandboxPath,
  markSandboxIntroConsumed,
  resetSandboxIntroSessionForTests,
  shouldAutoPlaySandboxIntro,
} from "./engineeringLabRoutes";
import { EngineeringLabSandboxRoutes } from "./EngineeringLabSandboxRoutes";
import {
  INITIAL_LAB_SIMULATOR_STATE,
  evaluateLabTelemetry,
} from "./labSimulatorEngine";

const originalConsoleError = console.error;
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((msg, ...rest) => {
    if (
      typeof msg === "string" &&
      msg.includes("useLayoutEffect does nothing on the server")
    ) {
      return;
    }
    originalConsoleError(msg, ...rest);
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

function renderSandboxRoute(url: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <EngineeringLabSandboxRoutes />
    </MemoryRouter>,
  );
}

function setTestLanguage(lang: "vi" | "en") {
  useNavigationStore.setState({ lang });
  (useNavigationStore.getInitialState() as { lang: "vi" | "en" }).lang = lang;
}

describe("Engineering Lab Sandbox — Route, UI States & Single-Language Suite", () => {
  beforeEach(() => {
    setTestLanguage("vi");
  });

  it("REQ-01: strictly isolates /__engineering-lab* paths from canonical /engineering* routes", () => {
    expect(isEngineeringLabSandboxPath("/__engineering-lab")).toBe(true);
    expect(
      isEngineeringLabSandboxPath("/__engineering-lab/ground-effect-aerodynamics"),
    ).toBe(true);
    expect(isEngineeringLabSandboxPath("/engineering")).toBe(false);
    expect(isEngineeringLabSandboxPath("/engineering/car-anatomy")).toBe(false);
    expect(
      buildEngineeringLabHref({
        lab: "hybrid-powertrain",
        hash: "interactive-lab",
      }),
    ).toBe("/__engineering-lab?lab=hybrid-powertrain#interactive-lab");
    expect(buildEngineeringLabArticleHref("ground-effect-aerodynamics")).toBe(
      "/__engineering-lab/ground-effect-aerodynamics",
    );
  });

  it("REQ-04, REQ-05 & REQ-23: renders Cinematic 5-Red-Lights Start Gantry, English IT'S LIGHTS OUT AND AWAY WE GO! callout in VI & EN, and OfficialBrandLogo + PODIUM. EFFET DE SOL brand reveal", () => {
    const html = renderToStaticMarkup(
      <CinematicStartGantryIntro
        lang="vi"
        reducedMotion={false}
        onComplete={() => undefined}
      />,
    );
    expect(html).toContain('data-testid="cinematic-start-gantry-intro"');
    expect(html).toContain("PODIUM EDS · GIÀN ĐÈN ĐIỀU HÀNH XUẤT PHÁT");
    const enGantryHtml = renderToStaticMarkup(
      <CinematicStartGantryIntro
        lang="en"
        reducedMotion={false}
        onComplete={() => undefined}
      />,
    );
    expect(enGantryHtml).toContain("PODIUM EDS · RACE CONTROL GANTRY");
    for (let col = 1; col <= 5; col += 1) {
      expect(html).toContain(`data-testid="gantry-main-lamp-${col}"`);
      expect(html).toContain(`data-testid="gantry-aux-lamp-${col}"`);
    }
    expect(html).toContain('data-testid="gantry-skip-btn"');
    expect(html).toContain("ESC");

    // Beat A at lightsOutMs: v4 Storm Midnight Launch Surge + English F1 commentary (VI & EN)
    const lightsOutHtml = renderToStaticMarkup(
      <CinematicStartGantryIntro
        lang="vi"
        reducedMotion={false}
        initialElapsedMs={3400}
        onComplete={() => undefined}
      />,
    );
    expect(lightsOutHtml).toContain('data-phase="lights-out"');
    expect(lightsOutHtml).toContain('data-scene-theme="storm-lights-out"');
    expect(lightsOutHtml).toContain("IT&#x27;S");
    expect(lightsOutHtml).toContain("LIGHTS OUT.");
    expect(lightsOutHtml).toContain("AND AWAY WE GO!");

    // Beat B at brandLaunchMs: v4 Canonical Full /logo/logo.png + 5-Car Side-Profile Mini F1 Pack ("cái vèo")
    const sandboxBrandHtml = renderToStaticMarkup(
      <CinematicStartGantryIntro
        lang="vi"
        reducedMotion={false}
        initialElapsedMs={4300}
        divisionLabel="ENGINEERING DIVISION"
        onComplete={() => undefined}
      />,
    );
    expect(sandboxBrandHtml).toContain('data-phase="brand-launch"');
    expect(sandboxBrandHtml).toContain('data-scene-theme="storm-pack-launch"');
    expect(sandboxBrandHtml).toContain('data-testid="gantry-brand-reveal"');
    expect(sandboxBrandHtml).toContain('data-testid="gantry-f1-mini-pack"');
    expect(sandboxBrandHtml).not.toContain("peds-gantry-intro__bridge");
    expect(sandboxBrandHtml).toContain("/logo/logo.png");
    expect(
      [...sandboxBrandHtml.matchAll(/data-f1-mini-car="true"/g)].length,
    ).toBe(5);
    expect(
      [...sandboxBrandHtml.matchAll(/data-f1-rain-light="true"/g)].length,
    ).toBe(5);
    expect(sandboxBrandHtml).toContain("ENGINEERING DIVISION");

    const homeBrandHtml = renderToStaticMarkup(
      <CinematicStartGantryIntro
        lang="en"
        reducedMotion={false}
        initialElapsedMs={4300}
        divisionLabel="MOTORSPORT DIGITAL EXPERIENCE"
        onComplete={() => undefined}
      />,
    );
    expect(homeBrandHtml).toContain("MOTORSPORT DIGITAL EXPERIENCE");

    // SC-02 & CR-11: engineeringLabLuxury.css must not duplicate .peds-gantry-intro rules
    const luxuryCss = fs.readFileSync(
      path.resolve(__dirname, "engineeringLabLuxury.css"),
      "utf8",
    );
    expect(luxuryCss).not.toContain(".peds-gantry-intro");
  });

  it("REQ-06..REQ-15: renders all 8 ordered sections, Hero lockup, 4 Discipline Chapters, 18° default Lab, and CONCEPT DEMO disclaimer", () => {
    setTestLanguage("en");
    const html = renderSandboxRoute("/?intro=skip");
    for (const landmark of [
      "01-navigation",
      "02-cinematic-hero",
      "03-engineering-philosophy",
      "04-four-disciplines",
      "05-interactive-lab",
      "06-technical-insights",
      "07-explore-showroom",
      "08-footer",
    ]) {
      expect(html).toContain(`data-section="${landmark}"`);
    }
    expect(html).toContain("PODIUM EDS / ENGINEERING DIVISION");
    expect(html).toContain("ENGINEERED");
    expect(html).toContain("BEYOND LIMITS.");
    expect(html).toContain("01 / 04 — TECHNICAL SERIES");
    expect(html).toContain("18°");
    expect(html).toContain("CONCEPT DEMO");
    expect(html).toContain("CFD");
    expect(html).toContain("/engineering/car-anatomy");
    expect(html).toContain("/showroom");
    // Q15 / REQ-05: Header omits extra "Replay Intro" button; intro repeats only on refresh
    expect(html).not.toContain('data-testid="eng-lab-replay-intro"');
    expect(html).not.toContain("Replay Intro");

    // Vietnamese Hero & Philosophy headlines localize cleanly (CR-07)
    setTestLanguage("vi");
    const viMainHtml = renderSandboxRoute("/?intro=skip");
    expect(viMainHtml).toContain("CHẾ TÁC VƯỢT");
    expect(viMainHtml).toContain("KHOA HỌC TỐC ĐỘ.");

    // Pre-selects Hybrid Powertrain mode via ?lab=hybrid-powertrain without auto-playing intro (CR-06)
    setTestLanguage("en");
    const hybridHtml = renderSandboxRoute("/?lab=hybrid-powertrain#interactive-lab");
    expect(hybridHtml).not.toContain('data-testid="cinematic-start-gantry-intro"');
    expect(hybridHtml).toContain("ENERGY STORE");
    expect(hybridHtml).toContain("MGU-K");

    expect(
      shouldAutoPlaySandboxIntro(
        new URLSearchParams("lab=ground-effect"),
        "",
      ),
    ).toBe(false);
    expect(
      shouldAutoPlaySandboxIntro(new URLSearchParams(""), "#interactive-lab"),
    ).toBe(false);
    expect(
      shouldAutoPlaySandboxIntro(
        new URLSearchParams("intro=replay&lab=ground-effect"),
        "#interactive-lab",
      ),
    ).toBe(true);
    expect(
      shouldAutoPlaySandboxIntro(new URLSearchParams("intro=skip"), ""),
    ).toBe(false);

    // Q15 / REQ-05: Refresh-only replay rule (first tab entry = true, SPA remount = false, F5 reload = true)
    resetSandboxIntroSessionForTests();
    let storedSeen: string | null = null;
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
      sessionStorage: {
        getItem: () => storedSeen,
        setItem: (_k: string, v: string) => {
          storedSeen = v;
        },
      },
    });
    const navTiming = {
      getEntriesByType: () => [{ entryType: "navigation", type: "navigate" }],
    } as unknown as Pick<Performance, "getEntriesByType">;
    const reloadTiming = {
      getEntriesByType: () => [{ entryType: "navigation", type: "reload" }],
    } as unknown as Pick<Performance, "getEntriesByType">;

    // 1) Initial tab open -> pure across StrictMode/Suspense double-renders, plays once
    expect(
      shouldAutoPlaySandboxIntro(new URLSearchParams(""), "", navTiming),
    ).toBe(true);
    expect(
      shouldAutoPlaySandboxIntro(new URLSearchParams(""), "", navTiming),
    ).toBe(true);
    markSandboxIntroConsumed();
    storedSeen = "1";
    // 2) Internal SPA link navigation back to /__engineering-lab -> does NOT replay
    expect(
      shouldAutoPlaySandboxIntro(new URLSearchParams(""), "", navTiming),
    ).toBe(false);
    // 3) Hard browser refresh (F5 / document reload resets module session) -> DOES replay
    resetSandboxIntroSessionForTests();
    expect(
      shouldAutoPlaySandboxIntro(new URLSearchParams(""), "", reloadTiming),
    ).toBe(true);
    markSandboxIntroConsumed();
    // 4) Subsequent SPA navigation after that F5 refresh -> does NOT replay again
    expect(
      shouldAutoPlaySandboxIntro(new URLSearchParams(""), "", reloadTiming),
    ).toBe(false);
    vi.unstubAllGlobals();

    // Unique <linearGradient> IDs across Section 04 + Section 05 schematics (CR-05)
    const groundLabHtml = renderSandboxRoute("/?intro=skip&lab=ground-effect");
    const gradientIds = [
      ...groundLabHtml.matchAll(/<linearGradient id="([^"]+)"/g),
    ].map((m) => m[1]);
    expect(gradientIds.length).toBeGreaterThanOrEqual(2);
    expect(new Set(gradientIds).size).toBe(gradientIds.length);
  });

  it("REQ-02 & CR-09: applyEngineeringLabSeoHead enforces noindex, nofollow and strips stale canonical/JSON-LD tags", () => {
    const metaStore = new Map<string, { content: string; setAttribute: (k: string, v: string) => void }>();
    let canonicalRemoved = false;
    let ogUrlRemoved = false;
    let jsonLdRemoved = false;

    const fakeDoc = {
      documentElement: { lang: "en" },
      title: "",
      createElement: () => {
        const meta = {
          name: "",
          content: "",
          setAttribute(k: string, v: string) {
            if (k === "name") meta.name = v;
          },
        };
        return meta;
      },
      head: {
        querySelector(sel: string) {
          if (sel === 'link[rel="canonical"]') {
            return { remove: () => { canonicalRemoved = true; } };
          }
          if (sel === 'meta[property="og:url"]') {
            return { remove: () => { ogUrlRemoved = true; } };
          }
          const m = /^meta\[name="([^"]+)"\]$/.exec(sel);
          return m ? metaStore.get(m[1]) ?? null : null;
        },
        appendChild(el: { name: string; content: string; setAttribute: (k: string, v: string) => void }) {
          metaStore.set(el.name, el);
        },
      },
      getElementById(id: string) {
        if (id === "route-structured-data") {
          return { remove: () => { jsonLdRemoved = true; } };
        }
        return null;
      },
    } as unknown as Document;

    applyEngineeringLabSeoHead(fakeDoc, {
      lang: "vi",
      title: "Sandbox Title",
      description: "Sandbox Description",
    });

    expect(fakeDoc.documentElement.lang).toBe("vi");
    expect(fakeDoc.title).toBe("Sandbox Title");
    expect(metaStore.get("robots")?.content).toBe("noindex, nofollow");
    expect(metaStore.get("description")?.content).toBe("Sandbox Description");
    expect(canonicalRemoved).toBe(true);
    expect(ogUrlRemoved).toBe(true);
    expect(jsonLdRemoved).toBe(true);
  });

  it("REQ-17 & TC-03-05: renders Loading, Empty part filter, and 2D WebGL Error Fallback states cleanly", () => {
    const ref = createRef<HTMLDivElement>();
    const emptyAndFallbackState = {
      ...INITIAL_LAB_SIMULATOR_STATE,
      partFilterQuery: "zzzz-no-match",
    };
    const fallbackHtml = renderToStaticMarkup(
      <MemoryRouter>
        <EngineeringLabInteractiveSection
          lang="en"
          reducedMotion={false}
          state={emptyAndFallbackState}
          telemetry={evaluateLabTelemetry(emptyAndFallbackState)}
          modelReady={false}
          loadProgress={42}
          fallbackCode="ERR_WEBGL_UNAVAILABLE"
          onRetry3D={() => undefined}
          onDispatch={() => undefined}
          labViewportRef={ref}
        />
      </MemoryRouter>,
    );
    expect(fallbackHtml).toContain('data-testid="eng-lab-2d-fallback"');
    expect(fallbackHtml).toContain('data-testid="eng-lab-parts-empty"');
    expect(fallbackHtml).toContain("Clear filter");

    const loadingHtml = renderToStaticMarkup(
      <MemoryRouter>
        <EngineeringLabInteractiveSection
          lang="en"
          reducedMotion={false}
          state={INITIAL_LAB_SIMULATOR_STATE}
          telemetry={evaluateLabTelemetry(INITIAL_LAB_SIMULATOR_STATE)}
          modelReady={false}
          loadProgress={64}
          fallbackCode={null}
          onRetry3D={() => undefined}
          onDispatch={() => undefined}
          labViewportRef={ref}
        />
      </MemoryRouter>,
    );
    expect(loadingHtml).toContain('data-testid="eng-lab-3d-loading"');
    expect(loadingHtml).toContain("64%");
  });

  it("REQ-18..REQ-20: renders single-language articles without stacked bilingual prose, includes Reading Progress & Lab bridge, and handles 404 slugs", () => {
    setTestLanguage("vi");
    const viHtml = renderSandboxRoute("/ground-effect-aerodynamics");
    expect(viHtml).toContain('data-testid="eng-lab-reading-progress"');
    expect(viHtml).toContain("Hiệu ứng mặt đất: tạo lực ép từ sàn xe");
    expect(viHtml).toContain("Từ dòng chảy đến trường áp suất");
    expect(viHtml).not.toContain("From airflow to a pressure field");
    expect(viHtml).toContain(
      "/__engineering-lab?lab=ground-effect#interactive-lab",
    );
    expect(viHtml).toContain("/engineering/car-anatomy");

    setTestLanguage("en");
    const enHtml = renderSandboxRoute("/ground-effect-aerodynamics");
    expect(enHtml).toContain("Ground Effect: Creating Downforce Under the Car");
    expect(enHtml).toContain("From airflow to a pressure field");
    expect(enHtml).not.toContain("Từ dòng chảy đến trường áp suất");

    // Supports all 4 contracted short slugs AND all 4 canonical slugs (CR-04)
    for (const validSlug of [
      "ground-effect",
      "active-aerodynamics",
      "hybrid-powertrain",
      "vehicle-dynamics",
      "ground-effect-aerodynamics",
      "active-aerodynamics-wing-mechanics",
      "hybrid-powertrains-energy-management",
      "vehicle-dynamics-suspension",
    ]) {
      const slugHtml = renderSandboxRoute(`/${validSlug}`);
      expect(slugHtml).toContain('data-testid="eng-lab-article-view"');
      expect(slugHtml).toContain('data-testid="eng-lab-article-inline-lang"');
    }

    // Negative control: invalid slug -> styled 404
    const notFoundHtml = renderSandboxRoute("/non-existent-engineering-slug");
    expect(notFoundHtml).toContain('data-testid="eng-lab-article-404"');
    expect(notFoundHtml).toContain("ERR_ARTICLE_NOT_FOUND");
  });
});
