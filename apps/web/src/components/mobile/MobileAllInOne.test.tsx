import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { MobileAllInOne } from "./MobileAllInOne";

describe("mobile journey entry", () => {
  for (const tab of ["results", "calendar"]) {
    it(`opens ${tab} without Home and Showroom placeholders`, () => {
      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={[`/season/2026?tab=${tab}`]}>
          <MobileAllInOne season={2026} />
        </MemoryRouter>,
      );
      expect(html).toContain('id="giai-dau"');
      expect(html).not.toContain('id="home"');
      expect(html).not.toContain('id="showroom"');
      expect(html).not.toContain("Open homepage");
      expect(html).toContain("Loading journey");
    });
  }

  it("keeps the Home section on the Home route", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/"]}>
        <MobileAllInOne season={2026} />
      </MemoryRouter>,
    );
    expect(html).toContain('id="home"');
    expect(html).toContain('id="giai-dau"');
  });
});
