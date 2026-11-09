import { afterEach, describe, expect, it, vi } from "vitest";
import { createPaintAtlas } from "./paintAtlas";
import { MERCEDES_MEXICO_BODY, STANDARD_2026_PAINT } from "./standard2026Paint";
import { supportsReviewBranding } from "./liveryRuntime";
import type { PrecisionTeam } from "./paintAtlas";

afterEach(() => vi.unstubAllGlobals());

it("keeps every 2026 team paint mask inside its three atlas panels", () => {
  const teams: PrecisionTeam[] = [
    "mclaren",
    "ferrari",
    "mercedes",
    "redbull",
    "racingbulls",
    "astonmartin",
    "alpine",
    "williams",
    "haas",
    "audi",
    "cadillac",
  ];
  const points: Array<[number, number]> = [];
  const context = {
    fillStyle: "",
    fillRect() {},
    beginPath() {},
    moveTo(x: number, y: number) {
      points.push([x, y]);
    },
    lineTo(x: number, y: number) {
      points.push([x, y]);
    },
    closePath() {},
    fill() {},
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
  for (const team of teams) {
    points.length = 0;
    const atlas = createPaintAtlas(team);
    expect(points.length, team).toBeGreaterThan(0);
    expect(
      points.every(([x, y]) => x >= 0 && x <= 1536 && y >= 0 && y <= 512),
      team,
    ).toBe(true);
    atlas.dispose();
  }
});

describe("Cadillac paint variants", () => {
  it("keeps the split launch base separate from the bilateral Belgium revision", () => {
    const fills: Array<{ color: string; x: number; width: number }> = [];
    const context = {
      fillStyle: "",
      fillRect(x: number, _y: number, width: number) {
        fills.push({ color: this.fillStyle, x, width });
      },
      beginPath() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      fill() {},
    };
    vi.stubGlobal("document", {
      createElement: () => ({ width: 0, height: 0, getContext: () => context }),
    });

    const launch = createPaintAtlas("cadillac");
    expect(fills[0]).toEqual({
      color: STANDARD_2026_PAINT.cadillac.dark,
      x: 0,
      width: 1536,
    });
    expect(fills[1]).toEqual({
      color: STANDARD_2026_PAINT.cadillac.primary,
      x: 0,
      width: 512,
    });
    launch.dispose();

    fills.length = 0;
    const current = createPaintAtlas("cadillac", "season-current-2026-11-06");
    expect(fills[0]).toEqual({
      color: STANDARD_2026_PAINT.cadillac.primary,
      x: 0,
      width: 1536,
    });
    expect(fills).toHaveLength(1);
    current.dispose();
  });
});

describe("Mercedes W17 paint evidence", () => {
  it("uses black graphite instead of a bright silver mask for Mexico", () => {
    const colors: string[] = [];
    const context = {
      fillStyle: "",
      fillRect() {
        colors.push(this.fillStyle);
      },
      beginPath() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      fill() {
        colors.push(this.fillStyle);
      },
    };
    vi.stubGlobal("document", {
      createElement: () => ({ width: 0, height: 0, getContext: () => context }),
    });
    createPaintAtlas("mercedes").dispose();
    expect(colors).toContain(STANDARD_2026_PAINT.mercedes.primary);
    colors.length = 0;
    createPaintAtlas("mercedes", "season-current-2026-11-06").dispose();
    expect(colors).toContain(MERCEDES_MEXICO_BODY);
    expect(colors).not.toContain(STANDARD_2026_PAINT.mercedes.primary);
    expect(colors).toContain(STANDARD_2026_PAINT.mercedes.accent);
  });

  it("allows provisional current logo previews for ten teams while keeping Cadillac paint-only", () => {
    expect(
      supportsReviewBranding("mercedes", "season-current-2026-11-06"),
    ).toBe(true);
    expect(
      supportsReviewBranding("cadillac", "season-current-2026-11-06"),
    ).toBe(false);
    for (const team of ["mclaren", "ferrari", "redbull", "racingbulls", "astonmartin", "alpine", "williams", "haas", "audi"]) {
      expect(supportsReviewBranding(team, "season-current-2026-11-06")).toBe(true);
    }
  });
  it("keeps the PETRONAS line on both side projections and the AMG rhombi on both top shoulders", () => {
    const fills: Array<{
      color: string;
      column: number;
      points: Array<[number, number]>;
    }> = [];
    const context = {
      fillStyle: "",
      points: [] as Array<[number, number]>,
      fillRect() {},
      beginPath() {
        this.points = [];
      },
      moveTo(x: number, y: number) {
        this.points.push([x, y]);
      },
      lineTo(x: number, y: number) {
        this.points.push([x, y]);
      },
      closePath() {},
      fill() {
        fills.push({
          color: this.fillStyle,
          column: Math.floor(this.points[0][0] / 512),
          points: [...this.points],
        });
      },
    };
    vi.stubGlobal("document", {
      createElement: () => ({ width: 0, height: 0, getContext: () => context }),
    });

    const texture = createPaintAtlas("mercedes", "season-current-2026-11-06");
    const green = fills.filter(
      (fill) => fill.color === STANDARD_2026_PAINT.mercedes.accent,
    );
    expect(green.filter((fill) => fill.column === 0)).toHaveLength(1);
    expect(green.filter((fill) => fill.column === 1)).toHaveLength(1);
    expect(green.filter((fill) => fill.column === 2)).toHaveLength(4);
    const rhombi = fills.filter(
      (fill) =>
        fill.column === 2 &&
        fill.color === STANDARD_2026_PAINT.mercedes.dark &&
        fill.points.length === 4 &&
        fill.points[0][0] > 1200 &&
        fill.points[0][0] < 1400,
    );
    expect(rhombi).toHaveLength(6);
    texture.dispose();
  });
  it("draws the engine-cover star field on both sides and the top", () => {
    const starColumns: number[] = [];
    let firstX = 0;
    const context = {
      fillStyle: "",
      fillRect() {},
      beginPath() {},
      moveTo(x: number) {
        firstX = x;
      },
      lineTo() {},
      closePath() {},
      fill() {
        if (this.fillStyle === STANDARD_2026_PAINT.mercedes.ink) {
          starColumns.push(Math.floor(firstX / 512));
        }
      },
    };
    vi.stubGlobal("document", {
      createElement: () => ({ width: 0, height: 0, getContext: () => context }),
    });

    const texture = createPaintAtlas("mercedes");
    expect(starColumns.filter((column) => column === 0)).toHaveLength(12);
    expect(starColumns.filter((column) => column === 1)).toHaveLength(12);
    expect(starColumns.filter((column) => column === 2)).toHaveLength(20);
    texture.dispose();
  });
});

describe("Williams FW48 wing paint evidence", () => {
  it("draws the white rear-wing field inside the top-view atlas", () => {
    const fills: Array<{ color: string; points: Array<[number, number]> }> = [];
    const context = {
      fillStyle: "",
      points: [] as Array<[number, number]>,
      fillRect() {},
      beginPath() {
        this.points = [];
      },
      moveTo(x: number, y: number) {
        this.points.push([x, y]);
      },
      lineTo(x: number, y: number) {
        this.points.push([x, y]);
      },
      closePath() {},
      fill() {
        fills.push({ color: this.fillStyle, points: [...this.points] });
      },
    };
    vi.stubGlobal("document", {
      createElement: () => ({ width: 0, height: 0, getContext: () => context }),
    });

    const texture = createPaintAtlas("williams");
    expect(
      fills.some(
        ({ color, points }) =>
          color === STANDARD_2026_PAINT.williams.secondary &&
          points.length === 4 &&
          points[0][0] > 1450 &&
          points.every(([x]) => x > 1400),
      ),
    ).toBe(true);
    texture.dispose();
  });
});
