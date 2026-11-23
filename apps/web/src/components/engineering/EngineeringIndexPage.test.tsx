import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENGINEERING_ARTICLES } from "../../data/engineeringArticles";
import { EngineeringPartActions } from "./EngineeringPartActions";
import { EngineeringAnatomyPage } from "./EngineeringAnatomyPage";
import { EngineeringIndexPage } from "./EngineeringIndexPage";
import {
  ENGINEERING_CHAPTERS,
  ENGINEERING_FP04RB_GLB_URL,
  ENGINEERING_PARTS,
  ENGINEERING_STORY_BEATS,
  F1_COCKPIT_MACRO_PROGRESS,
  evaluateEngineeringTimeline,
  resolveDeepLinkProgress,
  stepEngineeringProgress,
} from "./engineeringDisassemblyData";
import {
  ENGINEERING_STORY_CHAPTERS,
  getEngineeringStoryShot,
} from "./engineeringStoryTimeline";

const locale = vi.hoisted(() => ({
  lang: "vi" as "en" | "vi",
  reducedMotion: false,
}));

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#x27;");

vi.mock("../../store/useNavigationStore", () => ({
  useNavigationStore: (selector?: (state: { lang: "en" | "vi" }) => unknown) =>
    selector ? selector({ lang: locale.lang }) : { lang: locale.lang },
}));
vi.mock("../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => locale.reducedMotion,
}));

describe("Engineering 3D Disassembly & Minimalist Production Page", () => {
  beforeEach(() => {
    locale.lang = "vi";
    locale.reducedMotion = false;
  });

  it("evaluates all 47 assemblies deterministically from 0% origin through F1 cockpit to 100% lock", () => {
    expect(ENGINEERING_FP04RB_GLB_URL).toBe(
      "/models/fp04rb-engineering-v1.glb",
    );
    expect(ENGINEERING_PARTS).toHaveLength(47);
    expect(new Set(ENGINEERING_PARTS.map((p) => p.id)).size).toBe(47);
    expect(ENGINEERING_CHAPTERS).toHaveLength(8);

    const start = evaluateEngineeringTimeline(0);
    expect(start.chapter.id).toBe("origin");
    expect(start.explodeRatio).toBe(0);
    for (const part of ENGINEERING_PARTS) {
      expect(start.parts[part.id]).toEqual({
        tx: 0,
        ty: 0,
        tz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        phase: 0,
      });
    }

    // At 27% F1 Cockpit Macro: Halo lifts clear (>0.8m) while OLED wheel stays centered for sharp driver-eye view
    const cockpit = evaluateEngineeringTimeline(F1_COCKPIT_MACRO_PROGRESS);
    expect(cockpit.chapter.id).toBe("cockpit");
    expect(cockpit.parts.COCKPIT_HALO.ty).toBeGreaterThan(0.8);
    expect(cockpit.parts.STEERING_WHEEL_LCD.phase).toBe(0);
    expect(cockpit.camera.position[2]).toBeCloseTo(0.14, 2);

    // At 80% Matrix: all 46 movable assemblies float around fixed MONOCOQUE_CHASSIS
    const peak = evaluateEngineeringTimeline(0.8);
    expect(peak.chapter.id).toBe("matrix");
    expect(peak.explodeRatio).toBeGreaterThan(0.9);
    expect(peak.parts.MONOCOQUE_CHASSIS.phase).toBe(0);

    // At 100% Lock: zero-drift reassembly
    const lock = evaluateEngineeringTimeline(1);
    expect(lock.chapter.id).toBe("reassembly");
    expect(lock.explodeRatio).toBe(0);
    for (const part of ENGINEERING_PARTS) {
      expect(lock.parts[part.id].phase).toBe(0);
    }
  });

  it("runs one bilingual story spotlight through non-overlapping chapter boundaries", () => {
    expect(ENGINEERING_STORY_BEATS.length).toBeGreaterThan(8);
    for (const beat of ENGINEERING_STORY_BEATS) {
      expect(ENGINEERING_PARTS.some((part) => part.id === beat.partId)).toBe(
        true,
      );
      expect(beat.caption.vi.length).toBeGreaterThan(0);
      expect(beat.caption.en.length).toBeGreaterThan(0);
    }

    const chaptersAtBoundaries = [
      [0, "origin"],
      [0.06, "aero"],
      [0.19, "cockpit"],
      [0.35, "corners"],
      [0.49, "bodywork"],
      [0.6, "core"],
      [0.73, "matrix"],
      [0.86, "reassembly"],
      [1, "reassembly"],
    ] as const;
    for (const [progress, chapterId] of chaptersAtBoundaries) {
      expect(evaluateEngineeringTimeline(progress).chapter.id).toBe(chapterId);
    }
    expect(evaluateEngineeringTimeline(0.0599).chapter.id).toBe("origin");
    expect(evaluateEngineeringTimeline(0.1899).chapter.id).toBe("aero");
    expect(evaluateEngineeringTimeline(0.8599).chapter.id).toBe("matrix");

    expect(evaluateEngineeringTimeline(0.145).storyBeat.id).toBe(
      "aero-rear-drs",
    );
    expect(evaluateEngineeringTimeline(0.27).storyBeat.id).toBe(
      "cockpit-controls",
    );
    expect(evaluateEngineeringTimeline(0.8).storyBeat.id).toBe(
      "matrix-overview",
    );
    expect(evaluateEngineeringTimeline(0.86).storyBeat.id).toBe(
      "reassembly-core",
    );
  });

  it("finishes each system's staged separation inside its chapter and keeps the full matrix assembled in place", () => {
    const checkpoints = [
      [0.19, "REAR_WING_MAINPLANE"],
      [0.35, "COCKPIT_SEAT_CARBON"],
      [0.49, "RR_BRAKE_SUSPENSION"],
      [0.6, "COOLING_RADIATOR_RIGHT"],
      [0.73, "REAR_EXHAUST_RAIN_LED"],
    ] as const;
    for (const [progress, partId] of checkpoints) {
      expect(
        evaluateEngineeringTimeline(progress).parts[partId].phase,
      ).toBeGreaterThan(0.95);
    }

    const matrix = evaluateEngineeringTimeline(0.8);
    expect(matrix.explodeRatio).toBeGreaterThan(0.99);
    expect(matrix.parts.MONOCOQUE_CHASSIS.phase).toBe(0);
    expect(evaluateEngineeringTimeline(1).explodeRatio).toBe(0);
  });

  it("maps every listed component to one unique mesh node in the FP-04 RB GLB", () => {
    const glb = readFileSync("public/models/fp04rb-engineering-v1.glb");
    expect(glb.toString("ascii", 0, 4)).toBe("glTF");
    const jsonLength = glb.readUInt32LE(12);
    const document = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength)) as {
      nodes: Array<{ mesh?: number; name?: string }>;
    };
    const meshNames = document.nodes
      .filter((node) => node.mesh !== undefined)
      .map((node) => node.name)
      .filter((name): name is string => Boolean(name));

    expect(meshNames).toHaveLength(47);
    expect(new Set(meshNames).size).toBe(47);
    expect(new Set(meshNames)).toEqual(
      new Set(ENGINEERING_PARTS.map((part) => part.node)),
    );

    const groupCounts = ENGINEERING_PARTS.reduce<Record<string, number>>(
      (counts, part) => {
        counts[part.track] = (counts[part.track] ?? 0) + 1;
        return counts;
      },
      {},
    );
    expect(groupCounts).toEqual({ aero: 8, body: 14, corners: 20, core: 5 });
  });

  it("maps legacy anatomy and new chapter query parameters accurately", () => {
    expect(resolveDeepLinkProgress(null)).toBeNull();
    expect(resolveDeepLinkProgress("unknown")).toBeNull();
    expect(resolveDeepLinkProgress("cockpit")).toBe(F1_COCKPIT_MACRO_PROGRESS);
    expect(resolveDeepLinkProgress("halo")).toBe(F1_COCKPIT_MACRO_PROGRESS);
    expect(resolveDeepLinkProgress("front-wing")).toBeCloseTo(0.12, 2);
    expect(resolveDeepLinkProgress("rear-wing")).toBeCloseTo(0.16, 2);
    expect(resolveDeepLinkProgress("suspension")).toBeCloseTo(0.45, 2);
    expect(resolveDeepLinkProgress("sidepods")).toBeCloseTo(0.55, 2);
    expect(resolveDeepLinkProgress("floor")).toBeCloseTo(0.65, 2);
    expect(resolveDeepLinkProgress("diffuser")).toBeCloseTo(0.68, 2);
    expect(stepEngineeringProgress(0, 0.5, 16, true)).toBe(0.5);
    expect(stepEngineeringProgress(0, 0.5, 16, false)).toBeGreaterThan(0);
  });

  it("renders minimalist HUD controls, non-commercial attribution, and all 4 bilingual articles in VI and EN", () => {
    const htmlVi = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering"]}>
        <EngineeringIndexPage />
      </MemoryRouter>,
    );
    expect(htmlVi).toContain("Giải phẫu xe đua hiệu ứng mặt đất");
    expect(htmlVi).toContain("Buồng Lái F1");
    expect(htmlVi).toContain(
      "Cuộn trang để bóc tách 47 cụm khí động, buồng lái, mâm phanh và lõi hybrid",
    );
    expect(htmlVi).toContain("Luồng Khí CFD");
    expect(htmlVi).toContain("Xuyên Vỏ");
    expect(htmlVi).toContain("Đặt lại góc nhìn");
    expect(htmlVi).toContain("Peter Kiss · FP-04 RB");
    expect(htmlVi).toContain('data-testid="engineering-loading-percent"');
    expect(htmlVi).toContain("0%");
    expect(htmlVi).toContain('data-testid="engineering-timeline-scrubber"');
    expect(htmlVi).toContain('data-testid="engineering-scrubber-readout"');
    expect(htmlVi).toContain(`Linh kiện ${ENGINEERING_PARTS.length}`);
    expect(htmlVi).toContain("Danh sách linh kiện");
    expect(htmlVi).toContain('aria-label="Linh kiện sau"');
    expect(htmlVi).toContain('aria-label="Linh kiện trước"');
    const actionsVi = renderToStaticMarkup(
      <EngineeringPartActions
        lang="vi"
        isolated={false}
        disabled={false}
        onIsolate={() => undefined}
        onReassemble={() => undefined}
      />,
    );
    const actionsEn = renderToStaticMarkup(
      <EngineeringPartActions
        lang="en"
        isolated={false}
        disabled={false}
        onIsolate={() => undefined}
        onReassemble={() => undefined}
      />,
    );
    const reassembleEn = renderToStaticMarkup(
      <EngineeringPartActions
        lang="en"
        isolated
        disabled={false}
        onIsolate={() => undefined}
        onReassemble={() => undefined}
      />,
    );
    const fallbackAction = renderToStaticMarkup(
      <EngineeringPartActions
        lang="vi"
        isolated={false}
        disabled
        onIsolate={() => undefined}
        onReassemble={() => undefined}
      />,
    );
    expect(actionsVi).toContain("Tách riêng");
    expect(actionsEn).toContain("Isolate");
    expect(reassembleEn).toContain("Reassemble");
    expect(fallbackAction).toContain("disabled");
    expect(htmlVi.match(/class="peds-eng-part-option"/g)).toHaveLength(47);
    for (const article of ENGINEERING_ARTICLES) {
      expect(htmlVi).toContain(`/engineering/${article.slug}`);
      expect(htmlVi).toContain(article.title.vi);
    }

    locale.lang = "en";
    const htmlEn = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering"]}>
        <EngineeringIndexPage />
      </MemoryRouter>,
    );
    expect(htmlEn).toContain("Ground-effect architecture, inside out");
    expect(htmlEn).toContain("F1 Cockpit");
    expect(htmlEn).toContain(
      "Scroll to separate all 47 aerodynamic, cockpit, wheel-corner and hybrid assemblies",
    );
    expect(htmlEn).toContain("CFD Flow");
    expect(htmlEn).toContain("X-Ray");
    expect(htmlEn).toContain("Reset View");
    expect(htmlEn).toContain(`${ENGINEERING_PARTS.length} parts`);
    expect(htmlEn).toContain("Component list");
    expect(htmlEn).not.toContain("Isolate");
    for (const article of ENGINEERING_ARTICLES) {
      expect(htmlEn).toContain(article.title.en);
    }
  });

  it("keeps all eight chapters and every component readable with reduced motion", () => {
    locale.reducedMotion = true;
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering"]}>
        <EngineeringIndexPage />
      </MemoryRouter>,
    );

    expect(html).toContain('data-testid="engineering-readable-story"');
    expect(
      html.match(/class="peds-eng-readable-story__chapter"/g),
    ).toHaveLength(8);
    for (const chapter of ENGINEERING_STORY_CHAPTERS) {
      expect(html).toContain(escapeHtml(chapter.title.vi));
    }
    for (const part of ENGINEERING_PARTS) {
      expect(html).toContain(escapeHtml(part.label.vi));
      expect(html).toContain(escapeHtml(part.summary.vi));
    }
  });

  it("offers a bilingual Orbit control in the full exploded chapter only", () => {
    locale.lang = "en";
    const matrixHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering?chapter=matrix"]}>
        <EngineeringIndexPage />
      </MemoryRouter>,
    );
    expect(matrixHtml).toContain('aria-label="Explore Orbit"');
    expect(matrixHtml).toContain('aria-pressed="false"');

    const aeroHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering?chapter=aero"]}>
        <EngineeringIndexPage />
      </MemoryRouter>,
    );
    expect(aeroHtml).not.toContain('aria-label="Explore Orbit"');

    locale.lang = "vi";
    const matrixHtmlVi = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering?chapter=matrix"]}>
        <EngineeringIndexPage />
      </MemoryRouter>,
    );
    expect(matrixHtmlVi).toContain('aria-label="Khám phá Orbit"');
  });

  it("synchronizes /engineering/car-anatomy?chapter=halo to the cockpit macro and guards WebGL behind ErrorBoundary", () => {
    locale.lang = "en";
    const htmlCockpit = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering/car-anatomy?chapter=halo"]}>
        <EngineeringAnatomyPage />
      </MemoryRouter>,
    );
    const lcdShot = getEngineeringStoryShot("STEERING_WHEEL_LCD");
    expect(lcdShot).not.toBeNull();
    expect(htmlCockpit).toContain(lcdShot!.title.en.replaceAll("&", "&amp;"));
    expect(htmlCockpit).toContain(
      `${String(lcdShot!.index).padStart(2, "0")} / 47`,
    );
    expect(htmlCockpit).toContain("peds-eng-pill--cockpit-active");
    expect(htmlCockpit).toContain('data-testid="engineering-cockpit-panel"');
    expect(htmlCockpit).toContain(
      'data-testid="engineering-cockpit-telemetry"',
    );
    expect(htmlCockpit).toContain('data-testid="cockpit-zone-diff"');
    expect(htmlCockpit).toContain('data-testid="cockpit-zone-bbal"');
    expect(htmlCockpit).toContain('data-testid="cockpit-zone-strat"');
    expect(htmlCockpit).toContain('data-testid="cockpit-zone-drs"');
    expect(htmlCockpit).toContain('data-testid="cockpit-zone-radio"');
    expect(htmlCockpit).toContain('data-testid="cockpit-zone-pit"');

    const indexSource = readFileSync(
      "src/components/engineering/EngineeringIndexPage.tsx",
      "utf8",
    );
    expect(indexSource).toContain("<ErrorBoundary");
    expect(indexSource).toContain(
      "/images/eds/engineering/ground-effect-flow.svg",
    );
  });

  it("wraps EngineeringIndexPage and EngineeringAnatomyPage in React.memo to isolate parent scroll re-renders without breaking locale/deep-link updates", () => {
    const memoSymbol = Symbol.for("react.memo");
    expect(
      (EngineeringIndexPage as unknown as { $$typeof?: symbol }).$$typeof,
    ).toBe(memoSymbol);
    expect(
      (EngineeringAnatomyPage as unknown as { $$typeof?: symbol }).$$typeof,
    ).toBe(memoSymbol);

    const fwShot = getEngineeringStoryShot("FRONT_WING_ASSEMBLY");
    expect(fwShot).not.toBeNull();

    locale.lang = "en";
    const enHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering?chapter=front-wing"]}>
        <EngineeringIndexPage />
      </MemoryRouter>,
    );
    expect(enHtml).toContain(escapeHtml(fwShot!.title.en));

    locale.lang = "vi";
    const viHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/engineering?chapter=front-wing"]}>
        <EngineeringIndexPage />
      </MemoryRouter>,
    );
    expect(viHtml).toContain(escapeHtml(fwShot!.title.vi));
    expect(viHtml).toContain('data-testid="engineering-3d-annotation"');
    expect(viHtml).toContain('data-testid="engineering-hud-toggle"');
    expect(viHtml.match(/data-editorial-reveal="visible"/g)).toHaveLength(5);
  });
});
