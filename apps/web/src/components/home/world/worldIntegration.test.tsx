import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { V9VisualLab } from "./V9VisualLab";
import { HomeWorldHost } from "./HomeWorldHost";
import { HomeEngineeringReveal } from "../engineering/HomeEngineeringReveal";

const app = readFileSync("src/App.tsx", "utf8");
const home = readFileSync("src/components/home/HomeView.tsx", "utf8");
const css = readFileSync("src/components/home/world/homeWorld.css", "utf8");

describe("V9-01 developer-only world integration", () => {
  it("makes a real selectable lab available only in development", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <V9VisualLab />
      </MemoryRouter>,
    );
    expect(app).toContain("const V9VisualLab = import.meta.env.DEV");
    expect(app).toContain('path="/__home-v9-lab"');
    expect(markup).toContain("V9-01 / VISUAL LABORATORY");
    expect(markup).toContain("01 / PRESSURE");
    expect(markup).toContain("02 / VELOCITY");
    expect(markup).toContain("03 / CARBON");
    expect(markup).toContain('aria-pressed="true"');
  });

  it("keeps a single host outside HomeView and extends the environment behind Footer", () => {
    expect(app).toContain("data-home-v9={v9Preview");
    expect(app).toContain("{v9Preview && <HomeWorldHost />}");
    expect(app).toContain("<HomeView worldPreview={v9Preview} />");
    expect(app).toContain("<Footer />");
    expect(app.indexOf("<HomeWorldHost />")).toBeLessThan(
      app.indexOf("<Footer />"),
    );
    expect(home).toContain("{!worldPreview && <HomeCinematicBackground />}");
    expect(home).not.toContain("<HomeJourneyMotion />");
    expect(css).toContain("> .peds-footer");
    expect(css).toContain(".home-v9-canvas");
  });

  it("adds a real interactive engineering chapter with stable routes", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <HomeEngineeringReveal />
      </MemoryRouter>,
    );
    expect(home).toContain("{worldPreview && <HomeEngineeringReveal />}");
    expect(markup).toContain('id="eds-engineering"');
    expect(markup).toContain("FRONT WING");
    expect(markup).toContain("UNDERFLOOR");
    expect(markup).toContain("DIFFUSER");
    expect(markup).toContain('href="/engineering/car-anatomy"');
    expect(markup).toContain('aria-pressed="true"');
  });

  it("does not mount a WebGL canvas for SSR or static quality", () => {
    const markup = renderToStaticMarkup(<HomeWorldHost />);
    expect(markup).toContain('data-world-quality="static"');
    expect(markup).not.toContain("<canvas");
  });
});
