import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

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
import {
  getCalendarBySeason,
  getRaceResults,
  getStandings,
} from "../../data/championship";

const mockTzState = vi.hoisted(() => ({
  timeZone: "Asia/Tokyo",
  source: "ip" as const,
  status: "ready" as const,
  clockOffsetMs: 3_600_000,
  serverTimeUtc: "2026-11-25T16:30:00.000Z",
  initTimezone: vi.fn(),
}));

vi.mock("../../store/useTimezoneStore", () => ({
  useTimezoneStore: Object.assign(
    (selector: (s: typeof mockTzState) => unknown) => selector(mockTzState),
    { getState: () => mockTzState },
  ),
}));

import { MemoryRouter } from "react-router-dom";
import { StormAboutView } from "./StormAboutView";
import { StormDossierDrawer } from "./StormDossierDrawer";
import { StormOverview } from "./StormOverview";
import { StormSlimFooter } from "./StormSlimFooter";
import { StormShowroomView } from "./StormShowroomView";
import { StormCalendarView, StormResultsView } from "./StormViews";
import { getPrdTeamManifest } from "../showroom/fp04rb-garage/liveryPrdManifest2026";
import { createInitialMaintenanceState } from "../showroom/fp04rb-garage/ServiceSequence";

describe("Plan 2 — Live F1 Pulse, Auto Timezone & Interactive Dossiers (US-02)", () => {
  const calendar2026 = getCalendarBySeason(2026);
  const results2026 = getRaceResults(2026);
  const standings2026 = getStandings(2026);
  const upcomingQatar =
    calendar2026.find((r) => r.round === 23) ??
    calendar2026[calendar2026.length - 1];

  it("AC-02.1 & AC-02.5: StormOverview renders Live F1 Pulse Dock with UTC countdown, AutoTimezoneBadge, P1 leader, and 3D portals (and handles season-complete boundary)", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <StormOverview
          lang="vi"
          season={2026}
          reducedMotion={true}
          nextRace={upcomingQatar}
          latestResult={results2026[results2026.length - 1]}
          standings={standings2026}
          onNavigate={(path) => void path}
          onInspect={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('data-testid="live-f1-pulse-dock"');
    expect(html).toContain('data-timezone-readonly="true"');
    expect(html).toContain("Asia/Tokyo (UTC+09:00)");
    expect(html).not.toContain("<select");
    expect(html).toContain('href="/showroom"');
    expect(html).toContain('href="/engineering"');
    expect(html).not.toContain("/showroom →");
    expect(html).not.toContain("/engineering →");

    // Season-complete boundary (nextRace = undefined)
    const doneHtml = renderToStaticMarkup(
      <MemoryRouter>
        <StormOverview
          lang="en"
          season={2026}
          reducedMotion={true}
          nextRace={undefined}
          latestResult={results2026[results2026.length - 1]}
          standings={standings2026}
          onNavigate={(path) => void path}
          onInspect={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(doneHtml).toContain("SEASON COMPLETE");
    expect(doneHtml).not.toContain("NaN");
  });

  it("AC-02.2 & AC-02.6: StormCalendarView formats sessions using useTimezoneStore (Asia/Tokyo UTC+09:00) + AutoTimezoneBadge with zero manual <select>", () => {
    const html = renderToStaticMarkup(
      <StormCalendarView
        lang="en"
        season={2026}
        calendar={calendar2026}
        results={results2026}
        standingsDrivers={standings2026.drivers}
        nextRace={upcomingQatar}
        selectedRound={upcomingQatar.round}
        reducedMotion={true}
        onSelectSeason={() => undefined}
        onSelectRound={() => undefined}
      />,
    );

    expect(html).toContain('data-timezone-readonly="true"');
    expect(html).toContain("Asia/Tokyo (UTC+09:00)");
    expect(html).toContain("UTC+09:00");
    expect(html).not.toContain("<select");
  });

  it("AC-02.3: StormResultsView renders classification rows as interactive buttons wired to Driver Dossier inspection", () => {
    const calendar2025 = getCalendarBySeason(2025);
    const results2025 = getRaceResults(2025);
    const html = renderToStaticMarkup(
      <StormResultsView
        lang="en"
        season={2025}
        calendar={calendar2025}
        results={results2025}
        selectedRound={1}
        reducedMotion={true}
        onSelectSeason={() => undefined}
        onSelectRound={() => undefined}
        onInspect={() => undefined}
      />,
    );

    expect(html).toMatch(/<button[^>]*class="[^"]*sp-lg-rrow[^"]*"/);
    expect(html).toContain('data-driver-inspect="true"');
  });

  it("AC-02.4 & AC-01.3: Showroom shows 2026 grid context badge, StormSlimFooter links to /about, and StormAboutView cites FP-04 RB (never Model B)", () => {
    const showroomHtml = renderToStaticMarkup(
      <MemoryRouter>
        <StormShowroomView
          lang="en"
          webglReady={false}
          showroomLoadState="idle"
          garageTeamId="mclaren"
          garageVariantId={getPrdTeamManifest("mclaren").defaultVariantId}
          garageBayFocus="bay-1"
          garageMode="overview"
          garagePreset="pit-lane-overview"
          garageSelectedPartId="front-wing"
          garageHoveredPartId={null}
          garageStatsSample={null}
          garageMaintenanceState={createInitialMaintenanceState(true)}
          onSelectGarageTeam={() => undefined}
          onSelectCadillacVariant={() => undefined}
          onSelectGarageBay={() => undefined}
          onSelectGarageMode={() => undefined}
          onSelectGaragePreset={() => undefined}
          onHoverGaragePart={() => undefined}
          onSelectGaragePart={() => undefined}
          onSelectGarageCorner={() => undefined}
          onStartGarageMaintenance={() => undefined}
          onPauseGarageMaintenance={() => undefined}
          onResetGarageMaintenance={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(showroomHtml).toContain("2026 GRID");

    const footerHtml = renderToStaticMarkup(
      <MemoryRouter>
        <StormSlimFooter lang="vi" />
      </MemoryRouter>,
    );
    expect(footerHtml).toContain('href="/about"');
    expect(footerHtml).toContain("FP-04 RB");

    const aboutHtml = renderToStaticMarkup(
      <MemoryRouter>
        <StormAboutView lang="vi" />
      </MemoryRouter>,
    );
    expect(aboutHtml).toContain("FP-04 RB");
    expect(aboutHtml).toContain("Jolpica F1 API");
    expect(aboutHtml).toContain("OpenF1 API");
    expect(aboutHtml).toContain("Cloudflare");
    expect(aboutHtml).toContain("PETERKISSDESIGN");
    expect(aboutHtml).toContain("SIL Open Font License 1.1");
    expect(aboutHtml).not.toContain("Model B");
  });

  it("FAILURE-REPORT-01 regression: StormDossierDrawer resolves badge URLs cleanly for unhyphenated team IDs (redbull, racingbulls, astonmartin)", () => {
    for (const target of [
      {
        kind: "driver" as const,
        driverId: "verstappen",
        season: 2026 as const,
      },
      { kind: "driver" as const, driverId: "lawson", season: 2026 as const },
      { kind: "driver" as const, driverId: "alonso", season: 2026 as const },
      {
        kind: "team" as const,
        teamId: "redbull" as const,
        season: 2026 as const,
      },
      {
        kind: "team" as const,
        teamId: "racingbulls" as const,
        season: 2026 as const,
      },
      {
        kind: "team" as const,
        teamId: "astonmartin" as const,
        season: 2026 as const,
      },
    ]) {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <StormDossierDrawer
            inspecting={target}
            defaultSeason={2026}
            lang="en"
            onClose={() => undefined}
          />
        </MemoryRouter>,
      );
      expect(html).toContain('data-testid="storm-dossier-drawer"');
      expect(html).toContain('class="sp-drawer-team-logo"');
    }
  });
});
