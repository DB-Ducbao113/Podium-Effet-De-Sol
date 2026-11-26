import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AutoTimezoneBadge } from "./AutoTimezoneBadge";

describe("AutoTimezoneBadge", () => {
  it("renders strictly non-interactive read-only timezone telemetry in VI and EN for global offsets", () => {
    const refDate = new Date("2026-01-15T12:00:00Z");

    const viHtml = renderToStaticMarkup(
      <AutoTimezoneBadge
        lang="vi"
        timeZone="Asia/Kolkata"
        referenceDate={refDate}
        variant="home"
      />,
    );
    expect(viHtml).toContain("Múi giờ tự động");
    expect(viHtml).toContain("Asia/Kolkata (UTC+05:30)");
    expect(viHtml).not.toContain("<select");
    expect(viHtml).not.toContain("<button");
    expect(viHtml).not.toContain("<details");

    const enHtml = renderToStaticMarkup(
      <AutoTimezoneBadge
        lang="en"
        timeZone="America/Los_Angeles"
        referenceDate={refDate}
        variant="calendar"
      />,
    );
    expect(enHtml).toContain("Auto time zone");
    expect(enHtml).toContain("America/Los_Angeles (UTC-08:00)");
    expect(enHtml).not.toContain("<select");
    expect(enHtml).not.toContain("<button");
  });

  it("safely falls back when given an invalid timezone string", () => {
    const html = renderToStaticMarkup(
      <AutoTimezoneBadge
        lang="en"
        timeZone="Mars/Olympus"
        referenceDate={new Date("2026-01-15T12:00:00Z")}
        variant="results"
      />,
    );
    expect(html).not.toContain("Mars/Olympus");
    expect(html).toMatch(/UTC[+-]\d{2}:\d{2}/);
  });
});
