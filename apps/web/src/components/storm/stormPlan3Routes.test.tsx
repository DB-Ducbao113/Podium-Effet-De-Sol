import { renderToStaticMarkup } from "react-dom/server";
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getCarsBySeason } from "../../data/cars";
import { useNavigationStore } from "../../store/useNavigationStore";
import { useTimezoneStore } from "../../store/useTimezoneStore";
import { DesignPrototypeRedirect, StormAppShell } from "./StormAppShell";
import { resolveDesignPrototypeRedirectTarget } from "./stormShellContext";
import { StormNotFound } from "./StormNotFound";
import { StormAboutRoute } from "./routes/StormAboutRoute";
import {
  StormDriversRoute,
  StormTeamsRoute,
} from "./routes/StormDirectoryRoute";
import { StormEngineeringArticleRoute } from "./routes/StormEngineeringArticleRoute";
import { StormEngineeringRoute } from "./routes/StormEngineeringRoute";
import {
  StormCarDetailRoute,
  StormDriverDetailRoute,
  StormTeamDetailRoute,
} from "./routes/StormEntityRoute";
import { StormHomeRoute } from "./routes/StormHomeRoute";
import { StormRaceRoute, StormSeasonRoute } from "./routes/StormSeasonRoute";
import { StormShowroomRoute } from "./routes/StormShowroomRoute";

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

function LocationProbe() {
  const loc = useLocation();
  return (
    <output data-testid="location-probe">
      {loc.pathname}
      {loc.search}
    </output>
  );
}

function renderRoute(url: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <LocationProbe />
      <StormAppShell>
        <Routes>
          <Route path="/" element={<StormHomeRoute />} />
          {["/live", "/archive", "/timing"].map((path) => (
            <Route
              key={path}
              path={path}
              element={<Navigate to="/season/2026?tab=results" replace />}
            />
          ))}
          <Route
            path="/season"
            element={<Navigate to="/season/2026" replace />}
          />
          <Route
            path="/championship"
            element={<Navigate to="/season/2026" replace />}
          />
          <Route path="/season/:year" element={<StormSeasonRoute />} />
          <Route
            path="/season/:year/race/:round"
            element={<StormRaceRoute />}
          />
          <Route path="/showroom" element={<StormShowroomRoute />} />
          <Route
            path="/gallery"
            element={<Navigate to="/showroom" replace />}
          />
          <Route path="/teams" element={<StormTeamsRoute />} />
          <Route path="/teams/:teamId" element={<StormTeamDetailRoute />} />
          <Route path="/drivers" element={<StormDriversRoute />} />
          <Route
            path="/drivers/:driverId"
            element={<StormDriverDetailRoute />}
          />
          <Route path="/cars/:carId" element={<StormCarDetailRoute />} />
          <Route path="/about" element={<StormAboutRoute />} />
          <Route path="/engineering" element={<StormEngineeringRoute />} />
          <Route
            path="/engineering/car-anatomy"
            element={<StormEngineeringRoute />}
          />
          <Route
            path="/engineering/:slug"
            element={<StormEngineeringArticleRoute />}
          />
          <Route
            path="/__design-prototype"
            element={<DesignPrototypeRedirect />}
          />
          <Route path="*" element={<StormNotFound />} />
        </Routes>
      </StormAppShell>
    </MemoryRouter>,
  );
}

describe("Plan 3 — Canonical Multi-Route Storm Cutover (US-03)", () => {
  beforeEach(() => {
    useNavigationStore.setState({ lang: "en" });
    useTimezoneStore.setState({
      timeZone: "Asia/Ho_Chi_Minh",
      source: "ip",
      status: "ip-synced",
      clockOffsetMs: 0,
    });
  });

  it("AC-03.1..AC-03.5: renders all 12 canonical Storm routes inside StormAppShell with exact active nav capsule state", () => {
    const mclarenCar = getCarsBySeason(2026).find(
      (c) => c.teamId === "mclaren",
    );
    const checks: {
      url: string;
      expectedPattern: RegExp;
      expectedNavId: string | null;
    }[] = [
      { url: "/", expectedPattern: /DECODING/i, expectedNavId: "overview" },
      {
        url: "/season/2026?tab=results",
        expectedPattern: /OFFICIAL CLASSIFICATION · SEASON 2026/i,
        expectedNavId: "results",
      },
      {
        url: "/season/2026?tab=calendar",
        expectedPattern: /OFFICIAL CALENDAR · SEASON 2026/i,
        expectedNavId: "calendar",
      },
      {
        url: "/season/2026?tab=standings",
        expectedPattern: /STANDINGS · SEASON 2026/i,
        expectedNavId: "standings",
      },
      {
        url: "/season/2026/race/1",
        expectedPattern: /RESULTS · ROUND 1/i,
        expectedNavId: "results",
      },
      {
        url: "/teams",
        expectedPattern: /TEAMS · SEASON 2026/i,
        expectedNavId: "teams",
      },
      {
        url: "/teams/mclaren?season=2026",
        expectedPattern: /CONSTRUCTOR · SEASON 2026/i,
        expectedNavId: "teams",
      },
      {
        url: "/drivers",
        expectedPattern: /DRIVERS · THE 2026 GRID/i,
        expectedNavId: "drivers",
      },
      {
        url: "/drivers/norris?season=2026",
        expectedPattern: /Lando Norris/i,
        expectedNavId: "drivers",
      },
      ...(mclarenCar
        ? [
            {
              url: `/cars/${mclarenCar.id}`,
              expectedPattern: new RegExp(mclarenCar.name, "i"),
              expectedNavId: null,
            },
          ]
        : []),
      {
        url: "/engineering",
        expectedPattern: /Sculpted by air/i,
        expectedNavId: "engineering",
      },
      {
        url: "/engineering/car-anatomy",
        expectedPattern: /Sculpted by air/i,
        expectedNavId: "engineering",
      },
      {
        url: "/engineering/ground-effect-aerodynamics",
        expectedPattern: /Explore in FP-04 RB 3D Garage/i,
        expectedNavId: "engineering",
      },
      {
        url: "/showroom",
        expectedPattern: /2026 GRID/i,
        expectedNavId: "showroom",
      },
      {
        url: "/about",
        expectedPattern: /FP-04 RB 3D Studies/i,
        expectedNavId: "about",
      },
    ];

    for (const check of checks) {
      const html = renderRoute(check.url);
      expect(html, check.url).toMatch(check.expectedPattern);
      if (check.url === "/") {
        expect(html, check.url).not.toContain(
          'data-testid="storm-slim-footer"',
        );
      }
      if (check.expectedNavId === null) {
        expect(html, check.url).not.toContain('aria-current="page"');
      } else {
        expect(html, check.url).toContain(
          `data-nav-id="${check.expectedNavId}" data-active="true" aria-current="page"`,
        );
      }
    }
  });

  it("AC-03.3: maps legacy /__design-prototype?tab=... query tabs to canonical Storm routes", () => {
    const cases: [string, string][] = [
      ["", "/"],
      ["?tab=overview", "/"],
      ["?tab=showroom", "/showroom"],
      ["?tab=results", "/season/2026?tab=results"],
      ["?tab=calendar", "/season/2026?tab=calendar"],
      ["?tab=standings", "/season/2026?tab=standings"],
      ["?tab=teams", "/teams"],
      ["?tab=drivers", "/drivers"],
      ["?tab=engineering", "/engineering"],
      ["?tab=about", "/about"],
      ["?tab=unknown", "/"],
    ];

    for (const [search, expectedDest] of cases) {
      expect(resolveDesignPrototypeRedirectTarget(search), search).toBe(
        expectedDest,
      );
    }
  });

  it("AC-03.2 & AC-03.4: renders Storm 404 with 0 active nav items on unknown routes, seasons, or entity IDs (negative controls)", () => {
    for (const badUrl of [
      "/unrecognized-storm-route",
      "/season/2099",
      "/season/2026/race/999",
      "/teams/nonexistent-f1-team",
      "/drivers/nonexistent-driver",
      "/cars/nonexistent-chassis",
    ]) {
      const html = renderRoute(badUrl);
      expect(html, badUrl).toContain('data-testid="storm-not-found"');
      expect(html, badUrl).not.toContain('aria-current="page"');
    }
  });
});
