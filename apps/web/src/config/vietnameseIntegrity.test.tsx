import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CinematicStartGantryIntro } from "../components/engineering-lab/CinematicStartGantryIntro";
import { EngineeringLabSandboxRoutes } from "../components/engineering-lab/EngineeringLabSandboxRoutes";
import { EngineeringLabSchematic2D } from "../components/engineering-lab/EngineeringLabSchematic2D";
import { StormAppShell } from "../components/storm/StormAppShell";
import { StormAboutRoute } from "../components/storm/routes/StormAboutRoute";
import {
  StormDriversRoute,
  StormTeamsRoute,
} from "../components/storm/routes/StormDirectoryRoute";
import { StormEngineeringArticleRoute } from "../components/storm/routes/StormEngineeringArticleRoute";
import { StormEngineeringRoute } from "../components/storm/routes/StormEngineeringRoute";
import { StormHomeRoute } from "../components/storm/routes/StormHomeRoute";
import { StormSeasonRoute } from "../components/storm/routes/StormSeasonRoute";
import { useNavigationStore } from "../store/useNavigationStore";

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

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx|css)$/.test(entry.name) ? [full] : [];
  });

// Detects UTF-8 bytes mis-decoded as Windows-1252 / ISO-8859-1 (mojibake)
const MOJIBAKE_PATTERN =
  /(?:Ã[\u0080-\u00bf€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]|Ä[\u0080-\u00bf€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ ]|áº|á»|Æ[\u00a0\u00a1\u00af\u00b0]|Â·|Â°|â€”|â€“|â€™|â€œ|â€\u009d|â”€|âˆˆ|\uFFFD)/;

function setSsrLanguage(lang: "vi" | "en") {
  useNavigationStore.setState({ lang });
  Object.assign(useNavigationStore.getInitialState(), { lang });
}

function renderCanonicalVi(url: string): string {
  setSsrLanguage("vi");
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <StormAppShell>
        <Routes>
          <Route path="/" element={<StormHomeRoute />} />
          <Route path="/season/:year" element={<StormSeasonRoute />} />
          <Route path="/drivers" element={<StormDriversRoute />} />
          <Route path="/teams" element={<StormTeamsRoute />} />
          <Route path="/engineering" element={<StormEngineeringRoute />} />
          <Route
            path="/engineering/car-anatomy"
            element={<StormEngineeringRoute />}
          />
          <Route
            path="/engineering/:slug"
            element={<StormEngineeringArticleRoute />}
          />
          <Route path="/about" element={<StormAboutRoute />} />
        </Routes>
      </StormAppShell>
    </MemoryRouter>,
  );
}

describe("Vietnamese (VI) Language Switching & UTF-8 Integrity Contract", () => {
  beforeEach(() => {
    setSsrLanguage("vi");
  });

  afterAll(() => {
    setSsrLanguage("en");
  });

  it("contains zero UTF-8 CP1252/Latin-1 mojibake characters across all src/**/*.{ts,tsx,css} files and renders /engineering in pure Vietnamese", () => {
    const offenders: string[] = [];
    for (const file of walk("src")) {
      if (/\.(test|spec)\.(ts|tsx)$/.test(file)) continue;
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (MOJIBAKE_PATTERN.test(line)) {
          offenders.push(
            `${file.replace(/\\/g, "/")}:${idx + 1}: ${line.trim().slice(0, 90)}`,
          );
        }
      });
    }
    expect(offenders).toEqual([]);

    const engViHtml = renderCanonicalVi("/engineering");
    expect(engViHtml).toContain("Điêu khắc từ gió, sẵn sàng hé mở");
    expect(engViHtml).toContain("MỞ MÀN · NGUYÊN BẢN TĨNH LẶNG");
  });

  it("never mutates React-owned .sp-lg-h1 or .sp-lg-kick/.sp-storm-eyebrow-label text nodes in useStormSurfaceMotion", () => {
    const motionSrc = readFileSync(
      "src/components/storm/motion/useStormSurfaceMotion.ts",
      "utf8",
    );
    // SplitText and ScrambleText must operate exclusively on temporary aria-hidden overlay clones
    // (`data-sm-fx-clone`), never on React's live host element (`SplitText.create(h1` or `kicker.textContent =`).
    expect(motionSrc).toContain("data-sm-fx-clone");
    expect(motionSrc).not.toMatch(/SplitText\.create\(\s*h1\b/);
    expect(motionSrc).not.toMatch(/\bkicker\.textContent\s*=/);
    expect(motionSrc).not.toMatch(/gsap\.to\(\s*kicker\b/);
  });

  it("localizes 2D Engineering Schematics, Intro lang attribute & division badge, and Sandbox VI display font rules", () => {
    const luxCss = readFileSync(
      "src/components/engineering-lab/engineeringLabLuxury.css",
      "utf8",
    );
    expect(luxCss).toMatch(
      /\.peds-eng-lux-root\[lang="vi"\]\s*\{[^}]*--eng-lux-display:\s*"Chakra Petch",\s*"Be Vietnam Pro"/s,
    );

    const schematicHtml = renderToStaticMarkup(
      <div>
        <EngineeringLabSchematic2D
          mode="ground-effect"
          lang="vi"
          reducedMotion={true}
        />
        <EngineeringLabSchematic2D
          mode="active-aero"
          lang="vi"
          reducedMotion={true}
        />
        <EngineeringLabSchematic2D
          mode="hybrid-powertrain"
          lang="vi"
          reducedMotion={true}
        />
        <EngineeringLabSchematic2D
          mode="vehicle-dynamics"
          lang="vi"
          reducedMotion={true}
        />
      </div>,
    );

    expect(schematicHtml).toMatch(/KHOẢNG SÁNG GẦM|CHỈ SỐ HÚT/i);
    expect(schematicHtml).not.toContain("ATTACHED DIFFUSER PLUME");
    expect(schematicHtml).toMatch(/GÓC CÁNH|LỰC ÉP/i);
    expect(schematicHtml).not.toContain("DF: ");

    const introHtml = renderToStaticMarkup(
      <CinematicStartGantryIntro
        lang="vi"
        reducedMotion={false}
        initialElapsedMs={4350}
        onComplete={() => {}}
      />,
    );
    expect(introHtml).toContain('lang="vi"');

    setSsrLanguage("vi");
    const sandboxViHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/__engineering-lab?intro=skip"]}>
        <Routes>
          <Route
            path="/__engineering-lab/*"
            element={<EngineeringLabSandboxRoutes />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(sandboxViHtml).toContain('lang="vi"');
    expect(sandboxViHtml).toContain("CHẾ TÁC VƯỢT");
    expect(sandboxViHtml).toContain("Góc cánh gió");
    expect(sandboxViHtml).not.toContain("Wing angle / Góc cánh");
    expect(sandboxViHtml).not.toContain("Góc cánh / Wing angle");
  });

  it("never uses Georgia in Vietnamese editorial stacks, pre-warms VI webfonts, and syncs html[lang] synchronously", () => {
    const indexCss = readFileSync("src/index.css", "utf8");
    const stormCss = readFileSync("src/components/storm/stormShell.css", "utf8");
    const mainSrc = readFileSync("src/main.tsx", "utf8");
    const navStoreSrc = readFileSync("src/store/useNavigationStore.ts", "utf8");

    // Windows Georgia lacks U+1EA0-U+1EF9 precomposed Vietnamese glyphs and splits stacked
    // diacritics (e.g. Ế -> Ê ´, Ắ -> Ă ´). VI editorial fallback must use Palatino Linotype / Times New Roman.
    const htmlViBlock = indexCss.match(/html\[lang='vi'\]\s*\{[^}]*\}/s)?.[0] ?? "";
    expect(htmlViBlock).toContain("'Cormorant Garamond Variable'");
    expect(htmlViBlock).toContain("'Palatino Linotype'");
    expect(htmlViBlock).not.toContain("Georgia");

    const spRootViBlock = stormCss.match(/\.sp-root\[lang="vi"\]\s*\{[^}]*\}/s)?.[0] ?? "";
    expect(spRootViBlock).toContain('"Cormorant Garamond Variable"');
    expect(spRootViBlock).toContain('"Palatino Linotype"');
    expect(spRootViBlock).not.toContain("Georgia");
    expect(stormCss).not.toMatch(/var\(--peds-font-editorial\)\s*,\s*Georgia/i);

    // Pre-warm VI italic/normal subsets so EN -> VI click never hits fallback or breaks on offline/restarted dev server.
    expect(mainSrc).toContain("document.fonts.load");
    expect(mainSrc).toContain("Cormorant Garamond Variable");

    // Sync document.documentElement.lang synchronously on setLang/toggleLang/rehydration.
    expect(navStoreSrc).toContain("document.documentElement.lang");
  });
});
