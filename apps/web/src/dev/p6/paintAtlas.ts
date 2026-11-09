import { MERCEDES_MEXICO_BODY, STANDARD_2026_PAINT } from "./standard2026Paint";
import * as THREE from "three";

export type PrecisionTeam =
  | "ferrari"
  | "mclaren"
  | "cadillac"
  | "mercedes"
  | "redbull"
  | "racingbulls"
  | "astonmartin"
  | "alpine"
  | "williams"
  | "haas"
  | "audi";

// Three orthographic paint masks share one texture: physical left, physical right,
// and upward-facing surfaces. Coordinates are Model B world units, not GLB UVs.
// This keeps boundaries continuous across the single shared paint primitive.
const panel = 512;
const front = -2.525;
const length = 5.05;
const z = (value: number) => ((value - front) / length) * panel;
const sideY = (value: number) => (1 - value / 1.1) * panel;
const topX = (value: number) => (1 - (value + 1.1) / 2.2) * panel;

function fill(
  ctx: CanvasRenderingContext2D,
  column: number,
  color: string,
  points: [number, number][],
  top = false,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([depth, vertical], index) => {
    const x = column * panel + z(depth);
    const y = top ? topX(vertical) : sideY(vertical);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function threePointedStar(
  ctx: CanvasRenderingContext2D,
  column: number,
  depth: number,
  across: number,
  color: string,
  top = false,
) {
  const centerX = column * panel + z(depth);
  const centerY = top ? topX(across) : sideY(across);
  const radiusX = 5;
  const radiusY = top ? 10 : 13;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let point = 0; point < 6; point++) {
    const angle = -Math.PI / 2 + (point * Math.PI) / 3;
    const scale = point % 2 === 0 ? 1 : 0.2;
    const x = centerX + Math.cos(angle) * radiusX * scale;
    const y = centerY + Math.sin(angle) * radiusY * scale;
    if (point === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

export function createPaintAtlas(
  team: PrecisionTeam,
  variant:
    "season-default-2026" | "season-current-2026-11-06" = "season-default-2026",
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = panel * 3;
  canvas.height = panel;
  const ctx = canvas.getContext("2d")!;
  const sides = [0, 1];
  const paint = STANDARD_2026_PAINT[team];
  if (team === "ferrari") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // Keep the white on the upper engine cover. The lower sidepod has
      // disconnected contours in Model B, which tear a projected diagonal.
      fill(ctx, column, paint.secondary, [
        [0.14, 0.85],
        [0.33, 0.79],
        [1.48, 0.75],
        [1.72, 0.84],
        [1.72, 1.1],
        [0.14, 1.1],
      ]);
      fill(ctx, column, paint.dark, [
        [-2.525, 0],
        [-1.94, 0],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ]);
      fill(ctx, column, paint.dark, [
        [1.95, 0],
        [2.525, 0],
        [2.525, 1.1],
        [1.95, 1.1],
      ]);
      // 2026 SF-26 launch uses dark rear wing surfaces, not a blue body band.
      fill(ctx, column, paint.dark, [
        [1.98, 0.75],
        [2.525, 0.75],
        [2.525, 1.1],
        [1.98, 1.1],
      ]);
    }
    // SF-26: white surrounds the cockpit; the rear engine-cover shoulders
    // return to rosso. The source top view does not show a white rear pod.
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-0.82, -0.19],
        [-0.32, -0.38],
        [0.42, -0.41],
        [0.86, -0.23],
        [0.86, 0.23],
        [0.42, 0.41],
        [-0.32, 0.38],
        [-0.82, 0.19],
      ],
      true,
    );
    // The white cockpit shoulder tapers into the red cover on both sides.
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-0.28, -0.53],
        [0.43, -0.49],
        [0.82, -0.31],
        [0.71, -0.25],
        [0.3, -0.39],
        [-0.28, -0.43],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-0.28, 0.43],
        [0.3, 0.39],
        [0.71, 0.25],
        [0.82, 0.31],
        [0.43, 0.49],
        [-0.28, 0.53],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.94, -1.1],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [1.95, -1.1],
        [2.525, -1.1],
        [2.525, 1.1],
        [1.95, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [1.98, -0.73],
        [2.525, -0.73],
        [2.525, 0.73],
        [1.98, 0.73],
      ],
      true,
    );
  } else if (team === "mclaren") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // MCL40 right profile: the sidepod is predominantly anthracite below
      // its orange upper shoulder; an orange wedge returns ahead of the rear tire.
      fill(ctx, column, paint.secondary, [
        [-0.84, 0.1],
        [1.72, 0.1],
        [1.72, 0.53],
        [1.25, 0.58],
        [0.92, 0.62],
        [0.47, 0.63],
        [-0.2, 0.55],
        [-0.84, 0.3],
      ]);
      fill(ctx, column, paint.secondary, [
        [0.06, 0.68],
        [0.43, 0.53],
        [1.42, 0.51],
        [1.72, 0.77],
        [1.72, 1.1],
        [0.06, 1.1],
      ]);
      fill(ctx, column, paint.primary, [
        [1.07, 0.1],
        [1.72, 0.1],
        [1.72, 0.4],
        [1.42, 0.4],
      ]);
      fill(ctx, column, paint.primary, [
        [-0.66, 0.53],
        [-0.08, 0.57],
        [0.18, 0.63],
        [0.36, 0.66],
        [0.22, 0.73],
        [-0.33, 0.69],
      ]);
      fill(ctx, column, paint.accent, [
        [0.43, 0.82],
        [0.96, 0.83],
        [1.1, 0.96],
        [0.45, 0.96],
      ]);
      fill(ctx, column, paint.detail, [
        [-1.18, 0.32],
        [-0.82, 0.34],
        [-0.82, 0.48],
        [-1.18, 0.46],
      ]);
      fill(ctx, column, paint.secondary, [
        [-2.525, 0],
        [-1.95, 0],
        [-1.95, 1.1],
        [-2.525, 1.1],
      ]);
      fill(ctx, column, paint.secondary, [
        [1.98, 0],
        [2.525, 0],
        [2.525, 0.57],
        [1.98, 0.57],
      ]);
    }
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [0.16, -0.38],
        [1.46, -0.44],
        [1.75, -0.18],
        [1.75, 0.18],
        [1.46, 0.44],
        [0.16, 0.38],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-0.78, -0.36],
        [0.15, -0.35],
        [0.3, -0.25],
        [0.3, 0.25],
        [0.15, 0.35],
        [-0.78, 0.36],
      ],
      true,
    );
    // Retain the orange outer shoulders around the dark cockpit spine.
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-0.42, -0.55],
        [0.35, -0.61],
        [0.82, -0.52],
        [0.82, -0.41],
        [0.21, -0.46],
        [-0.42, -0.43],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-0.42, 0.43],
        [0.21, 0.46],
        [0.82, 0.41],
        [0.82, 0.52],
        [0.35, 0.61],
        [-0.42, 0.55],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [0.42, -0.2],
        [0.96, -0.22],
        [1.1, -0.14],
        [1.1, 0.14],
        [0.96, 0.22],
        [0.42, 0.2],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-2.525, -1.1],
        [-1.95, -1.1],
        [-1.95, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
    // Model B front-wing top uses the outboard bands; retain the black center and flap tips.
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-2.42, -0.88],
        [-1.97, -0.79],
        [-1.97, -0.38],
        [-2.42, -0.47],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-2.42, 0.47],
        [-1.97, 0.38],
        [-1.97, 0.79],
        [-2.42, 0.88],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [1.98, -0.36],
        [2.525, -0.36],
        [2.525, 0.36],
        [1.98, 0.36],
      ],
      true,
    );
  } else if (team === "mercedes") {
    const shoulder =
      variant === "season-current-2026-11-06"
        ? MERCEDES_MEXICO_BODY
        : paint.primary;
    ctx.fillStyle = paint.secondary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // Mexico is black/graphite; the launch retains its silver shoulder.
      fill(ctx, column, shoulder, [
        [-1.91, 0.4],
        [-1.28, 0.3],
        [-0.65, 0.39],
        [0.05, 0.62],
        [0.75, 0.7],
        [0.84, 0.66],
        [0.84, 1.1],
        [-1.91, 1.1],
      ]);
      // PETRONAS green flows low around the sidepod, rather than forming a
      // straight stripe across the top of the engine cover.
      fill(ctx, column, paint.accent, [
        [-1.36, 0.39],
        [-0.84, 0.4],
        [-0.36, 0.49],
        [0.23, 0.51],
        [0.78, 0.46],
        [0.87, 0.42],
        [0.87, 0.44],
        [0.78, 0.49],
        [0.23, 0.54],
        [-0.36, 0.52],
        [-0.84, 0.43],
        [-1.36, 0.42],
      ]);
      fill(ctx, column, paint.dark, [
        [-2.525, 0],
        [-1.92, 0],
        [-1.92, 1.1],
        [-2.525, 1.1],
      ]);
      for (let row = 0; row < 4; row++) {
        for (let level = 0; level < 3; level++) {
          threePointedStar(
            ctx,
            column,
            0.94 + row * 0.2 + (level % 2) * 0.08,
            0.53 + level * 0.105,
            paint.ink,
          );
        }
      }
    }
    // Keep the nose and shoulders in graphite for Mexico; launch uses silver.
    fill(
      ctx,
      2,
      shoulder,
      [
        [-1.85, -0.22],
        [-0.75, -0.28],
        [-0.32, -0.31],
        [-0.32, 0.31],
        [-0.75, 0.28],
        [-1.85, 0.22],
      ],
      true,
    );
    fill(
      ctx,
      2,
      shoulder,
      [
        [-0.4, -0.32],
        [0.42, -0.46],
        [0.82, -0.43],
        [0.55, -0.21],
        [-0.4, -0.2],
      ],
      true,
    );
    fill(
      ctx,
      2,
      shoulder,
      [
        [-0.4, 0.2],
        [0.55, 0.21],
        [0.82, 0.43],
        [0.42, 0.46],
        [-0.4, 0.32],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-0.52, -0.34],
        [0.44, -0.48],
        [0.92, -0.43],
        [0.92, -0.4],
        [0.42, -0.44],
        [-0.52, -0.3],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-0.52, 0.3],
        [0.42, 0.44],
        [0.92, 0.4],
        [0.92, 0.43],
        [0.44, 0.48],
        [-0.52, 0.34],
      ],
      true,
    );
    // The nose pinstripe continues toward the cockpit without widening the green sidepod line.
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-1.85, -0.23],
        [-0.78, -0.29],
        [-0.52, -0.33],
        [-0.52, -0.3],
        [-0.78, -0.26],
        [-1.85, -0.2],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-1.85, 0.2],
        [-0.78, 0.26],
        [-0.52, 0.3],
        [-0.52, 0.33],
        [-0.78, 0.29],
        [-1.85, 0.23],
      ],
      true,
    );
    // AMG rhombi occupy the silver top shoulders; each side is drawn in its
    // own projected patch so the center cockpit spine remains black.
    for (const sign of [-1, 1]) {
      for (const start of [-0.06, 0.24, 0.54]) {
        fill(
          ctx,
          2,
          paint.dark,
          [
            [start, sign * 0.24],
            [start + 0.1, sign * 0.24],
            [start + 0.32, sign * 0.43],
            [start + 0.22, sign * 0.43],
          ],
          true,
        );
      }
    }
    for (let row = 0; row < 5; row++) {
      for (const across of [-0.16, -0.05, 0.06, 0.17]) {
        threePointedStar(
          ctx,
          2,
          0.82 + row * 0.19 + (across > 0 ? 0.07 : 0),
          across,
          paint.ink,
          true,
        );
      }
    }
  } else if (team === "redbull") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // The inspected RB22 profile keeps the upper cover blue beneath the
      // red/yellow bull graphic; the prototype's white wedge was incorrect.
      // A deeper navy undercut separates the blue body from the floor.
      fill(ctx, column, paint.dark, [
        [-0.9, 0.06],
        [0.17, 0.09],
        [1.69, 0.13],
        [1.75, 0.31],
        [0.78, 0.32],
        [-0.18, 0.26],
        [-0.9, 0.19],
      ]);
      fill(ctx, column, paint.secondary, [
        [0.3, 0.72],
        [1.52, 0.77],
        [1.76, 0.92],
        [1.76, 1.1],
        [0.3, 1.1],
      ]);
      fill(ctx, column, paint.secondary, [
        [-2.525, 0],
        [-1.94, 0],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ]);
      fill(ctx, column, paint.dark, [
        [1.94, 0],
        [2.525, 0],
        [2.525, 1.1],
        [1.94, 1.1],
      ]);
    }
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.94, -1.1],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [1.94, -1.1],
        [2.525, -1.1],
        [2.525, 1.1],
        [1.94, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [0.36, -0.17],
        [1.68, -0.22],
        [1.75, 0.22],
        [0.36, 0.17],
      ],
      true,
    );
  } else if (team === "racingbulls") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      fill(ctx, column, paint.secondary, [
        [-1.89, 0.37],
        [-1.1, 0.4],
        [-0.59, 0.52],
        [0.06, 0.71],
        [0.76, 0.71],
        [1.62, 0.75],
        [1.78, 0.79],
        [1.78, 0.88],
        [0.69, 0.85],
        [-0.09, 0.78],
        [-0.68, 0.6],
        [-1.89, 0.53],
      ]);
      fill(ctx, column, paint.detail, [
        [-1.85, 0.1],
        [-0.75, 0.11],
        [-0.2, 0.22],
        [0.82, 0.29],
        [1.71, 0.32],
        [1.71, 0.47],
        [0.73, 0.42],
        [-0.27, 0.34],
        [-0.85, 0.19],
        [-1.85, 0.19],
      ]);
      // A white shoulder interrupts the blue side contour at the intake.
      fill(ctx, column, paint.primary, [
        [-0.72, 0.52],
        [-0.22, 0.58],
        [0.1, 0.7],
        [-0.18, 0.73],
        [-0.75, 0.6],
      ]);
      fill(ctx, column, paint.secondary, [
        [-2.525, 0],
        [-1.95, 0],
        [-1.95, 1.1],
        [-2.525, 1.1],
      ]);
      fill(ctx, column, paint.dark, [
        [1.95, 0],
        [2.525, 0],
        [2.525, 1.1],
        [1.95, 1.1],
      ]);
    }
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-1.8, -0.35],
        [-0.95, -0.35],
        [-0.4, -0.24],
        [0.2, -0.3],
        [1.72, -0.38],
        [1.72, -0.32],
        [0.24, -0.22],
        [-0.4, -0.17],
        [-0.99, -0.29],
        [-1.8, -0.29],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-0.22, -0.43],
        [0.61, -0.49],
        [1.54, -0.41],
        [1.54, -0.36],
        [0.48, -0.43],
        [-0.22, -0.37],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-0.22, 0.37],
        [0.48, 0.43],
        [1.54, 0.36],
        [1.54, 0.41],
        [0.61, 0.49],
        [-0.22, 0.43],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [1.95, -1.1],
        [2.525, -1.1],
        [2.525, 1.1],
        [1.95, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.95, -1.1],
        [-1.95, -0.4],
        [-2.525, -0.4],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, 0.4],
        [-1.95, 0.4],
        [-1.95, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
  } else if (team === "astonmartin") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      fill(ctx, column, paint.dark, [
        [-1.95, 0.03],
        [-0.62, 0.04],
        [0.26, 0.12],
        [1.71, 0.12],
        [1.83, 0.25],
        [1.83, 0.42],
        [0.24, 0.36],
        [-0.58, 0.28],
        [-1.95, 0.2],
      ]);
      fill(ctx, column, paint.accent, [
        [-1.88, 0.3],
        [-0.71, 0.32],
        [0.2, 0.46],
        [1.72, 0.49],
        [1.72, 0.515],
        [0.2, 0.49],
        [-0.72, 0.35],
        [-1.88, 0.33],
      ]);
      fill(ctx, column, paint.dark, [
        [1.95, 0],
        [2.525, 0],
        [2.525, 1.1],
        [1.95, 1.1],
      ]);
    }
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.94, -1.1],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-0.1, -0.16],
        [1.54, -0.18],
        [1.78, -0.12],
        [1.78, 0.12],
        [1.54, 0.18],
        [-0.1, 0.16],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-0.65, -0.43],
        [0.65, -0.51],
        [1.68, -0.38],
        [1.68, -0.35],
        [0.65, -0.48],
        [-0.65, -0.4],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-0.65, 0.4],
        [0.65, 0.48],
        [1.68, 0.35],
        [1.68, 0.38],
        [0.65, 0.51],
        [-0.65, 0.43],
      ],
      true,
    );
    // Green front spine stays within the carbon front-wing assembly.
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-1.88, -0.075],
        [-1.17, -0.1],
        [-0.78, -0.12],
        [-0.78, -0.08],
        [-1.17, -0.06],
        [-1.88, -0.04],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-1.88, 0.04],
        [-1.17, 0.06],
        [-0.78, 0.08],
        [-0.78, 0.12],
        [-1.17, 0.1],
        [-1.88, 0.075],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [1.95, -1.1],
        [2.525, -1.1],
        [2.525, 1.1],
        [1.95, 1.1],
      ],
      true,
    );
  } else if (team === "alpine") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // 2026 top/side reference: blue engine cover and sidepod carry the
      // large BWT/eni graphics; pink is concentrated at nose, halo and wing.
      fill(ctx, column, paint.secondary, [
        [-1.96, 0.37],
        [-0.95, 0.36],
        [-0.45, 0.48],
        [0.12, 0.64],
        [0.28, 0.7],
        [-0.18, 0.84],
        [-0.72, 0.65],
        [-1.5, 0.56],
        [-1.96, 0.54],
      ]);
      fill(ctx, column, paint.dark, [
        [-1.84, 0.04],
        [-0.68, 0.04],
        [0.15, 0.1],
        [1.65, 0.14],
        [1.72, 0.27],
        [0.13, 0.22],
        [-0.76, 0.15],
        [-1.84, 0.13],
      ]);
      fill(ctx, column, paint.secondary, [
        [1.96, 0],
        [2.525, 0],
        [2.525, 1.1],
        [1.96, 1.1],
      ]);
    }
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-1.95, -0.21],
        [-0.55, -0.24],
        [0.08, -0.3],
        [0.24, -0.22],
        [0.24, 0.22],
        [0.08, 0.3],
        [-0.55, 0.24],
        [-1.95, 0.21],
      ],
      true,
    );
    // A blue center blade breaks the broad pink nose into two side bands.
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-1.91, -0.065],
        [-0.58, -0.085],
        [0.12, -0.09],
        [0.12, 0.09],
        [-0.58, 0.085],
        [-1.91, 0.065],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [1.96, -1.1],
        [2.525, -1.1],
        [2.525, 1.1],
        [1.96, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-2.525, -1.1],
        [-1.95, -1.1],
        [-1.95, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.95, -1.1],
        [-1.95, -0.47],
        [-2.525, -0.47],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, 0.47],
        [-1.95, 0.47],
        [-1.95, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
  } else if (team === "williams") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // The 2026 right profile has a blue upper side, a cyan Barclays pod,
      // and white only on the lower rear Komatsu panel.
      fill(ctx, column, paint.secondary, [
        [0.48, 0.08],
        [1.76, 0.08],
        [1.76, 0.39],
        [0.95, 0.37],
        [0.48, 0.28],
      ]);
      fill(ctx, column, paint.detail, [
        [-0.82, 0.22],
        [-0.2, 0.25],
        [0.55, 0.32],
        [0.97, 0.4],
        [0.97, 0.59],
        [0.2, 0.55],
        [-0.5, 0.43],
        [-0.82, 0.32],
      ]);
      // White lower flank and a dark aft sweep sit below the cyan field.
      fill(ctx, column, paint.secondary, [
        [0.55, 0.1],
        [1.71, 0.1],
        [1.71, 0.28],
        [1.16, 0.32],
        [0.55, 0.26],
      ]);
      fill(ctx, column, paint.dark, [
        [1.3, 0.2],
        [1.75, 0.15],
        [1.75, 0.59],
        [1.61, 0.52],
        [1.38, 0.37],
      ]);
      fill(ctx, column, paint.accent, [
        [1.24, 0.35],
        [1.48, 0.41],
        [1.7, 0.52],
        [1.7, 0.54],
        [1.46, 0.44],
        [1.22, 0.38],
      ]);
      fill(ctx, column, paint.dark, [
        [-1.88, 0.04],
        [-0.78, 0.04],
        [-0.78, 0.21],
        [-1.88, 0.22],
      ]);
    }
    // FW48 front wing is carbon/white around a blue nose, with the dark
    // portion carrying the Atlassian artwork in the inspected top view.
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.94, -1.1],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-2.46, -0.86],
        [-2.13, -0.79],
        [-2.13, -0.49],
        [-2.46, -0.52],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [-2.46, 0.52],
        [-2.13, 0.49],
        [-2.13, 0.79],
        [-2.46, 0.86],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [0.84, -0.31],
        [1.71, -0.34],
        [1.79, -0.22],
        [1.36, -0.19],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [0.84, 0.31],
        [1.36, 0.19],
        [1.79, 0.22],
        [1.71, 0.34],
      ],
      true,
    );
    // Keep a white central rear-wing field visible inside the dark end tips.
    fill(
      ctx,
      2,
      paint.secondary,
      [
        [1.98, -0.66],
        [2.525, -0.58],
        [2.525, 0.58],
        [1.98, 0.66],
      ],
      true,
    );
  } else if (team === "haas") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      fill(ctx, column, paint.dark, [
        [-1.91, 0.2],
        [-0.73, 0.24],
        [0.08, 0.38],
        [0.83, 0.46],
        [1.73, 0.48],
        [1.73, 0.6],
        [0.75, 0.55],
        [0.05, 0.48],
        [-0.72, 0.34],
        [-1.91, 0.28],
      ]);
      // The right-side VF-26 source has a broad rising red sweep behind the
      // cockpit, not the thin red sliver used by the previous prototype.
      fill(ctx, column, paint.accent, [
        [-0.08, 0.67],
        [0.42, 0.69],
        [1.02, 0.76],
        [1.48, 0.88],
        [1.72, 0.98],
        [1.72, 1.1],
        [0.92, 1.1],
        [0.32, 0.84],
      ]);
      fill(ctx, column, paint.dark, [
        [0.54, 0.86],
        [1.4, 0.98],
        [1.62, 1.1],
        [1.31, 1.1],
        [0.46, 0.94],
      ]);
      fill(ctx, column, paint.accent, [
        [-1.78, 0.16],
        [-1.28, 0.18],
        [-0.85, 0.29],
        [-1.2, 0.29],
        [-1.78, 0.22],
      ]);
      fill(ctx, column, paint.dark, [
        [1.96, 0.58],
        [2.525, 0.58],
        [2.525, 1.1],
        [1.96, 1.1],
      ]);
    }
    fill(
      ctx,
      2,
      paint.dark,
      [
        [0.5, -0.29],
        [1.67, -0.31],
        [1.67, -0.17],
        [1.67, 0.17],
        [1.67, 0.31],
        [0.5, 0.29],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.94, -1.1],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-2.48, -0.68],
        [-2.08, -0.56],
        [-2.08, -0.28],
        [-2.48, -0.43],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-2.48, 0.43],
        [-2.08, 0.28],
        [-2.08, 0.56],
        [-2.48, 0.68],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-2.22, -0.73],
        [-2.13, -0.68],
        [-2.13, -0.44],
        [-2.22, -0.49],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-2.22, 0.49],
        [-2.13, 0.44],
        [-2.13, 0.68],
        [-2.22, 0.73],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-0.93, -0.11],
        [-0.2, -0.17],
        [0.23, -0.14],
        [0.23, 0.14],
        [-0.2, 0.17],
        [-0.93, 0.11],
      ],
      true,
    );
    // Red centerline continues through the white nose into the cockpit shoulder.
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-1.88, -0.045],
        [-0.79, -0.07],
        [-0.33, -0.13],
        [-0.2, -0.11],
        [-0.78, -0.03],
        [-1.88, -0.02],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [-1.88, 0.02],
        [-0.78, 0.03],
        [-0.2, 0.11],
        [-0.33, 0.13],
        [-0.79, 0.07],
        [-1.88, 0.045],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [1.96, -1.1],
        [2.525, -1.1],
        [2.525, 1.1],
        [1.96, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [2.02, -0.78],
        [2.15, -0.78],
        [2.48, -0.34],
        [2.35, -0.34],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [2.02, 0.34],
        [2.15, 0.34],
        [2.48, 0.78],
        [2.35, 0.78],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [2.03, -0.28],
        [2.13, -0.28],
        [2.48, 0.15],
        [2.38, 0.15],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [2.03, 0.28],
        [2.13, 0.28],
        [2.48, -0.15],
        [2.38, -0.15],
      ],
      true,
    );
  } else if (team === "audi") {
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // The inspected right-profile photograph has titanium ahead of the
      // cockpit, a broad red rear sidepod, and carbon above and behind it.
      fill(ctx, column, paint.dark, [
        [0.1, 0.55],
        [0.85, 0.58],
        [1.72, 0.55],
        [1.72, 1.1],
        [0.1, 1.1],
      ]);
      fill(ctx, column, paint.dark, [
        [0.42, 0.44],
        [1.16, 0.48],
        [1.74, 0.42],
        [1.74, 0.6],
        [0.85, 0.62],
        [0.42, 0.56],
      ]);
      fill(ctx, column, paint.accent, [
        [0.56, 0.28],
        [0.78, 0.16],
        [1.48, 0.13],
        [1.78, 0.2],
        [1.78, 0.38],
        [1.16, 0.54],
        [0.72, 0.4],
      ]);
      fill(ctx, column, paint.dark, [
        [-0.48, 0.04],
        [1.74, 0.04],
        [1.74, 0.13],
        [0.25, 0.13],
        [-0.48, 0.11],
      ]);
      fill(ctx, column, paint.dark, [
        [-2.525, 0],
        [-1.95, 0],
        [-1.95, 1.1],
        [-2.525, 1.1],
      ]);
      fill(ctx, column, paint.dark, [
        [1.88, 0],
        [2.525, 0],
        [2.525, 1.1],
        [1.88, 1.1],
      ]);
    }
    fill(
      ctx,
      2,
      paint.dark,
      [
        [0.08, -0.21],
        [1.82, -0.34],
        [1.82, 0.34],
        [0.08, 0.21],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [0.47, -0.51],
        [1.64, -0.45],
        [1.82, -0.33],
        [1.82, 0.33],
        [1.64, 0.45],
        [0.47, 0.51],
        [0.94, 0.3],
        [0.94, -0.3],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [0.18, -0.43],
        [0.9, -0.42],
        [1.32, -0.19],
        [1.32, -0.15],
        [0.7, -0.29],
        [0.18, -0.31],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.accent,
      [
        [0.18, 0.31],
        [0.7, 0.29],
        [1.32, 0.15],
        [1.32, 0.19],
        [0.9, 0.42],
        [0.18, 0.43],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [1.95, -1.1],
        [2.525, -1.1],
        [2.525, 1.1],
        [1.95, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.95, -1.1],
        [-1.95, -0.54],
        [-2.525, -0.54],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, 0.54],
        [-1.95, 0.54],
        [-1.95, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
  } else if (variant === "season-current-2026-11-06") {
    // Belgium-onward Cadillac: white upper shell on both sides, black lower
    // sidepod and wings. The narrow feathered transition remains a review
    // approximation until both profiles are matched on Model B.
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      fill(ctx, column, paint.dark, [
        [-1.92, 0],
        [-1.26, 0],
        [-1.26, 0.34],
        [-1.92, 0.34],
      ]);
      fill(ctx, column, paint.dark, [
        [-0.92, 0],
        [1.76, 0],
        [1.76, 0.43],
        [1.42, 0.48],
        [0.98, 0.5],
        [0.48, 0.47],
        [-0.18, 0.4],
        [-0.92, 0.34],
      ]);
      fill(ctx, column, paint.dark, [
        [-2.525, 0],
        [-1.94, 0],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ]);
      fill(ctx, column, paint.dark, [
        [1.94, 0],
        [2.525, 0],
        [2.525, 1.1],
        [1.94, 1.1],
      ]);
    }
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-2.525, -1.1],
        [-1.94, -1.1],
        [-1.94, 1.1],
        [-2.525, 1.1],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-2.36, -0.88],
        [-1.98, -0.78],
        [-1.98, -0.59],
        [-2.36, -0.68],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-2.36, 0.68],
        [-1.98, 0.59],
        [-1.98, 0.78],
        [-2.36, 0.88],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [0.36, -0.18],
        [1.74, -0.22],
        [1.79, 0.22],
        [0.36, 0.18],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.dark,
      [
        [1.94, -1.1],
        [2.525, -1.1],
        [2.525, 1.1],
        [1.94, 1.1],
      ],
      true,
    );
  } else {
    // Cadillac's February 2026 standard launch is intentionally asymmetric.
    // Physical left is light, physical right is dark; the Belgium revision is
    // NOT the canonical season-default for this local study.
    ctx.fillStyle = paint.dark;
    ctx.fillRect(0, 0, canvas.width, panel);
    ctx.fillStyle = paint.primary;
    ctx.fillRect(0, 0, panel, panel);
    fill(ctx, 0, paint.detail, [
      [-0.78, 0.18],
      [-0.22, 0.22],
      [0.2, 0.18],
      [0.58, 0.25],
      [1.56, 0.22],
      [1.56, 0.39],
      [0.58, 0.43],
      [0.2, 0.36],
      [-0.22, 0.4],
      [-0.78, 0.33],
    ]);
    fill(ctx, 1, paint.secondary, [
      [-0.78, 0.18],
      [-0.22, 0.22],
      [0.2, 0.18],
      [0.58, 0.25],
      [1.56, 0.22],
      [1.56, 0.39],
      [0.58, 0.43],
      [0.2, 0.36],
      [-0.22, 0.4],
      [-0.78, 0.33],
    ]);
    // topX mirrors model-space X: physical left occupies the right atlas half.
    ctx.fillStyle = paint.dark;
    ctx.fillRect(panel * 2, 0, panel, panel);
    ctx.fillStyle = paint.primary;
    ctx.fillRect(panel * 2 + panel / 2, 0, panel / 2, panel);
    // The launch split bends around the cockpit and rejoins the center aft.
    fill(
      ctx,
      2,
      paint.dark,
      [
        [-0.78, -0.12],
        [0.03, -0.1],
        [0.56, -0.16],
        [1.62, -0.12],
        [1.62, 0],
        [0.54, -0.02],
        [0.02, 0.02],
        [-0.78, 0.01],
      ],
      true,
    );
    fill(
      ctx,
      2,
      paint.primary,
      [
        [-0.82, 0.01],
        [-0.18, -0.02],
        [0.42, 0.04],
        [1.55, 0.02],
        [1.55, 0.14],
        [0.41, 0.15],
        [-0.18, 0.1],
        [-0.82, 0.12],
      ],
      true,
    );
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
