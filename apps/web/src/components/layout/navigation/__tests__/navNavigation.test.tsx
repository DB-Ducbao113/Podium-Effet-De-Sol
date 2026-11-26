import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CALENDAR_2026 } from "../../../../data/championship";
import { DesktopGlassRail } from "../DesktopGlassRail";
import { GlobalLiquidNav } from "../GlobalLiquidNav";
import { LIQUID_NAV_DESTINATIONS, NAV_MICROCOPY } from "../navRegistry";
import {
  buildNavHref,
  resolveActiveNavId,
  resolveEffectiveSeason,
  type NavAdapter,
} from "../navRouting";
import { deriveNextRacePillState } from "../nextRaceSchedule";
import {
  computeNextFitMode,
  computeRailLayout,
  NAV_FIT_HYSTERESIS_PX,
} from "../useNavFitMode";

describe("Liquid Glass Navigation Registry & Routing", () => {
  it("defines exact 9 flat sentence-case destinations in canonical order including About", () => {
    expect(LIQUID_NAV_DESTINATIONS.map((d) => d.id)).toEqual([
      "overview",
      "results",
      "calendar",
      "standings",
      "drivers",
      "teams",
      "engineering",
      "showroom",
      "about",
    ]);
    expect(LIQUID_NAV_DESTINATIONS.map((d) => d.label.en)).toEqual([
      "Overview",
      "Results",
      "Calendar",
      "Standings",
      "Drivers",
      "Teams",
      "Engineering",
      "Showroom",
      "About",
    ]);
    expect(LIQUID_NAV_DESTINATIONS.map((d) => d.label.vi)).toEqual([
      "Tổng quan",
      "Kết quả",
      "Lịch đua",
      "Xếp hạng",
      "Tay đua",
      "Đội đua",
      "Kỹ thuật",
      "Showroom",
      "Giới thiệu",
    ]);
  });

  it("resolves active section deterministically across all routes, detail pages, MobileHub, and 404", () => {
    expect(resolveActiveNavId({ pathname: "/" })).toBe("overview");
    expect(
      resolveActiveNavId({ pathname: "/season/2026", search: "?tab=results" }),
    ).toBe("results");
    expect(resolveActiveNavId({ pathname: "/season/2025/race/12" })).toBe(
      "results",
    );
    expect(
      resolveActiveNavId({ pathname: "/season/2024", search: "?tab=calendar" }),
    ).toBe("calendar");
    expect(
      resolveActiveNavId({
        pathname: "/season/2026",
        search: "?tab=standings",
      }),
    ).toBe("standings");
    expect(resolveActiveNavId({ pathname: "/season/2025" })).toBe("standings");
    expect(resolveActiveNavId({ pathname: "/drivers" })).toBe("drivers");
    expect(resolveActiveNavId({ pathname: "/drivers/verstappen" })).toBe(
      "drivers",
    );
    expect(resolveActiveNavId({ pathname: "/teams" })).toBe("teams");
    expect(resolveActiveNavId({ pathname: "/teams/mclaren" })).toBe("teams");
    expect(resolveActiveNavId({ pathname: "/engineering" })).toBe(
      "engineering",
    );
    expect(resolveActiveNavId({ pathname: "/engineering/car-anatomy" })).toBe(
      "engineering",
    );
    expect(resolveActiveNavId({ pathname: "/showroom" })).toBe("showroom");
    expect(resolveActiveNavId({ pathname: "/gallery" })).toBe("showroom");

    expect(resolveActiveNavId({ pathname: "/about" })).toBe("about");

    // 404, invalid seasons, /cars/:id mark 0 active destinations
    expect(resolveActiveNavId({ pathname: "/season/2020" })).toBeNull();
    expect(resolveActiveNavId({ pathname: "/cars/model-b" })).toBeNull();
    expect(resolveActiveNavId({ pathname: "/unknown-route" })).toBeNull();
    expect(
      resolveActiveNavId({ pathname: "/season/2026", search: "?tab=overview" }),
    ).toBeNull();

    // MobileHub <= 860px hash resolution
    expect(
      resolveActiveNavId({
        pathname: "/",
        hash: "#giai-dau",
        mobileHub: true,
      }),
    ).toBe("standings");
    expect(
      resolveActiveNavId({
        pathname: "/season/2025",
        hash: "#showroom",
        mobileHub: true,
      }),
    ).toBe("showroom");
    expect(
      resolveActiveNavId({
        pathname: "/season/2025",
        hash: "#home",
        mobileHub: true,
      }),
    ).toBe("overview");
  });

  it("preserves valid seasons (2024-2026) and isolates section-specific query params", () => {
    expect(resolveEffectiveSeason("/season/2024", 2026)).toBe(2024);
    expect(resolveEffectiveSeason("/drivers", 2025)).toBe(2025);
    expect(resolveEffectiveSeason("/", undefined)).toBe(2026);

    // Same-section click preserves round & session
    expect(
      buildNavHref({
        targetId: "results",
        currentPathname: "/season/2025",
        currentSearch: "?tab=results&round=5&session=race",
        activeId: "results",
        storeSeason: 2025,
      }),
    ).toBe("/season/2025?tab=results&round=5&session=race");

    // Cross-section click keeps season 2025 but strips round & session
    expect(
      buildNavHref({
        targetId: "calendar",
        currentPathname: "/season/2025",
        currentSearch: "?tab=results&round=5&session=race",
        activeId: "results",
        storeSeason: 2025,
      }),
    ).toBe("/season/2025?tab=calendar");

    // MobileHub strips hotspot param
    expect(
      buildNavHref({
        targetId: "showroom",
        currentPathname: "/",
        currentSearch: "?hotspot=floor&season=2025",
        activeId: "overview",
        storeSeason: 2025,
        mobileHub: true,
      }),
    ).toBe("/?season=2025#showroom");
  });
});

describe("Next-Race Pill 5-State Schedule Evaluator", () => {
  const qatarGp = CALENDAR_2026.find((gp) => gp.round === 22)!;

  it("resolves all 5 states honestly without hardcoded dummy GP names", () => {
    const loading = deriveNextRacePillState({
      calendar: CALENDAR_2026,
      lang: "en",
      loading: true,
    });
    expect(loading.status).toBe("loading");
    expect(loading.href).toBeNull();
    expect(loading.text).toBe(NAV_MICROCOPY.loadingState.en);

    const unavailable = deriveNextRacePillState({
      calendar: [],
      lang: "vi",
      unavailable: true,
    });
    expect(unavailable.status).toBe("unavailable");
    expect(unavailable.href).toBeNull();
    expect(unavailable.text).toBe(NAV_MICROCOPY.unavailableState.vi);

    // Scheduled before Qatar GP (2026-11-24) formatted in automatic IANA timezone
    const scheduledNow = Date.UTC(2026, 10, 24, 12, 0);
    const completedBeforeQatar = new Set(
      CALENDAR_2026.filter((gp) => gp.round < 22).map((gp) => gp.round),
    );
    const scheduled = deriveNextRacePillState({
      calendar: CALENDAR_2026,
      completedRounds: completedBeforeQatar,
      now: scheduledNow,
      tzPreference: "Asia/Qatar",
      lang: "en",
    });
    expect(scheduled.status).toBe("scheduled");
    expect(scheduled.isLiveWeekend).toBe(false);
    expect(scheduled.text).toContain("Qatar GP");
    expect(scheduled.text).toContain("29 Nov");
    expect(scheduled.href).toBe("/season/2026?tab=calendar");

    // Verify IANA Asia/Tokyo (UTC+9) formatting crosses date boundary cleanly
    const suzukaGp = CALENDAR_2026.find((gp) => gp.round === 3)!;
    const beforeSuzukaLateUtc = Date.UTC(2026, 2, 28, 20, 0);
    const completedBeforeSuzuka = new Set(
      CALENDAR_2026.filter((gp) => gp.round < 3).map((gp) => gp.round),
    );
    const suzukaTokyo = deriveNextRacePillState({
      calendar: CALENDAR_2026,
      completedRounds: completedBeforeSuzuka,
      now: beforeSuzukaLateUtc,
      tzPreference: "Asia/Tokyo",
      lang: "en",
    });
    expect(suzukaGp.venueUtcOffset).toBe(9);
    expect(suzukaTokyo.text).toContain("Japanese GP");
    expect(suzukaTokyo.text).toContain("29 Mar");

    // Active weekend during Qatar FP2/Qualifying (2026-11-28)
    const weekendNow = Date.UTC(2026, 10, 28, 14, 0);
    const current = deriveNextRacePillState({
      calendar: CALENDAR_2026,
      completedRounds: completedBeforeQatar,
      now: weekendNow,
      tzPreference: "UTC",
      lang: "en",
    });
    expect(current.status).toBe("current");
    expect(current.isLiveWeekend).toBe(true);
    expect(current.text).toContain("Qatar GP");

    // Season finished (after Abu Dhabi GP)
    const seasonDoneNow = Date.UTC(2026, 11, 20, 12, 0);
    const allCompleted = new Set(CALENDAR_2026.map((gp) => gp.round));
    const none = deriveNextRacePillState({
      calendar: CALENDAR_2026,
      completedRounds: allCompleted,
      now: seasonDoneNow,
      lang: "vi",
    });
    expect(none.status).toBe("none");
    expect(none.text).toBe(NAV_MICROCOPY.noneState.vi);
    expect(none.href).toBe("/season/2026?tab=calendar");
    expect(qatarGp.name).toBe("Qatar Grand Prix");
  });
});

describe("Fit-Measurement State Machine & Hysteresis", () => {
  const widths = { brandW: 168, railW: 660, nextPillW: 170, langW: 68 };
  // NAV_MIN_REGION_GAP_PX = 24 -> railFullMin = 168 + 660 + 170 + 68 + 72 = 1138
  // railTrimmedMin = 168 + 660 + 68 + 48 = 944

  it("steps down rail-full -> rail-trimmed -> compact and applies 24px upward hysteresis", () => {
    expect(
      computeNextFitMode({
        currentMode: "rail-full",
        availW: 1200,
        ...widths,
        forceCompact: false,
      }),
    ).toBe("rail-full");

    // Hides Next-Race Pill first while keeping VI/EN + 8-item rail
    expect(
      computeNextFitMode({
        currentMode: "rail-full",
        availW: 1050,
        ...widths,
        forceCompact: false,
      }),
    ).toBe("rail-trimmed");

    // Deadband holds rail-trimmed at railFullMin + 10 (< +24 hysteresis)
    expect(
      computeNextFitMode({
        currentMode: "rail-trimmed",
        availW: 1138 + 10,
        ...widths,
        forceCompact: false,
      }),
    ).toBe("rail-trimmed");

    // Crosses railFullMin + 24 -> promotes back to rail-full
    expect(
      computeNextFitMode({
        currentMode: "rail-trimmed",
        availW: 1138 + NAV_FIT_HYSTERESIS_PX,
        ...widths,
        forceCompact: false,
      }),
    ).toBe("rail-full");

    // Narrower than railTrimmedMin -> compact
    expect(
      computeNextFitMode({
        currentMode: "rail-trimmed",
        availW: 880,
        ...widths,
        forceCompact: false,
      }),
    ).toBe("compact");

    // Force compact under 200%/400% text zoom or MobileHub
    expect(
      computeNextFitMode({
        currentMode: "rail-full",
        availW: 1600,
        ...widths,
        forceCompact: true,
      }),
    ).toBe("compact");

    expect(
      computeRailLayout({
        availW: 1320,
        fitMode: "rail-full",
        ...widths,
      }),
    ).toBe("centered");

    expect(
      computeRailLayout({
        availW: 1150,
        fitMode: "rail-full",
        ...widths,
      }),
    ).toBe("balanced");
  });
});

describe("GlobalLiquidNav Semantic HTML & Brand Contracts", () => {
  const makeAdapter = (overrides: Partial<NavAdapter> = {}): NavAdapter => ({
    mode: "prototype",
    activeId: "overview",
    season: 2026,
    lang: "en",
    surfaceTone: "dark",
    isImmersiveSurface: true,
    getHref: (id) => (id === "overview" ? "/" : `/${id}`),
    onNavigate: () => {},
    onSelectLang: () => {},
    nextRaceFixture: "scheduled",
    ...overrides,
  });

  it("renders large OfficialBrandLogo, top-right EN/VI pill without next-race pill, single <nav>, <=1 aria-current=page, and zero desktop chevrons/icons", () => {
    const html = renderToStaticMarkup(
      <GlobalLiquidNav adapter={makeAdapter({ activeId: "results" })} />,
    );
    expect(html).toContain("/logo/logo.png");
    expect(html).toContain("/logo/logo-optimized.webp");
    expect(html).toContain("peds-nav-brand-logo");
    expect(html).toContain("EN");
    expect(html).toContain("VI");
    expect(html).not.toContain("peds-nav-next");
    expect((html.match(/<nav\b/g) ?? []).length).toBe(1);
    expect((html.match(/aria-current="page"/g) ?? []).length).toBe(1);
    expect(html).toContain("Overview");
    expect(html).toContain("Calendar");
    expect(html).toContain("Showroom");
    expect(html).not.toContain("h1-nav__chevron");

    // 404 / About state (activeId = null) renders 0 active capsules
    const noneHtml = renderToStaticMarkup(
      <GlobalLiquidNav adapter={makeAdapter({ activeId: null })} />,
    );
    expect((noneHtml.match(/aria-current="page"/g) ?? []).length).toBe(0);

    // DesktopGlassRail does not render <svg> icons
    const railHtml = renderToStaticMarkup(
      <DesktopGlassRail
        activeId="overview"
        lang="vi"
        surfaceTone="dark"
        reducedMotion={false}
        visible={true}
        getHref={() => "/"}
        onNavigate={() => {}}
      />,
    );
    expect(railHtml).not.toContain("<svg");
    expect(railHtml).toContain("Tổng quan");
    expect(railHtml).toContain("Lịch đua");
  });
});
