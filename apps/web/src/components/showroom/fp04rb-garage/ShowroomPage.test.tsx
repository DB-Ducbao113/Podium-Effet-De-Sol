import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShowroomPage } from "./ShowroomPage";
import { FP04RB_CHASSIS_DISCLAIMER, TEAMS_2026 } from "./teams2026";

const locale = vi.hoisted(() => ({ lang: "en" as "en" | "vi" }));
vi.mock("../../../store/useNavigationStore", () => ({
  useNavigationStore: (selector?: (state: { lang: "en" | "vi" }) => unknown) =>
    selector ? selector({ lang: locale.lang }) : { lang: locale.lang },
}));

describe("ShowroomPage UI & fallback contract", () => {
  beforeEach(() => {
    locale.lang = "en";
  });

  it("renders 11 teams, 7 camera presets, unsupported inspection tags, and concept disclaimer in EN/VI", () => {
    const htmlEn = renderToStaticMarkup(<ShowroomPage headingLevel="h1" />);
    expect(htmlEn).toContain('data-testid="fp04rb-garage-showroom"');
    expect(htmlEn).toContain(FP04RB_CHASSIS_DISCLAIMER.en);
    expect(htmlEn).toContain("16m × 12m × 5m");
    expect(htmlEn).toContain("unsupported");
    expect(htmlEn).toContain("Start Service");
    expect(htmlEn).toContain("Pit-Lane Overview");
    expect(htmlEn).toContain("3/4 Front Left");
    expect(htmlEn).toContain("NORRIS #1");
    for (const t of TEAMS_2026) {
      expect(htmlEn).toContain(`data-team-option="${t.id}"`);
    }

    locale.lang = "vi";
    const htmlVi = renderToStaticMarkup(<ShowroomPage headingLevel="h2" />);
    expect(htmlVi).toContain(FP04RB_CHASSIS_DISCLAIMER.vi);
    expect(htmlVi).toContain("Bắt đầu bảo dưỡng");
    expect(htmlVi).toContain("Toàn cảnh Pit-lane");
    expect(htmlVi).toContain("3/4 Trước Trái");
  });
});
