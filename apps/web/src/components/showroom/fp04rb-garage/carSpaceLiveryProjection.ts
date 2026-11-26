import * as THREE from "three";
import type { LiveryVariantId } from "./liveryPrdManifest2026";
import { getProcessedLogoCanvas } from "./teamLogos2026";
import type { Team2026Spec, TeamLogoPlacementSpec } from "./teams2026";

/**
 * Measured car-local 3D bounds of FP-04 RB (identical across Desktop & Mobile GLBs;
 * identity transform chain from body_object / front_wing_mixer / rear_wing_no_mod to FP04RB_CAR_ROOT).
 * +Z = Front Nose, -Z = Rear Tail, +Y = Up, +X = Physical Left, -X = Physical Right.
 */
export const FP04RB_BODY_BOUNDS = {
  zMin: -1.85,
  zMax: 3.12,
  yMin: 0.08,
  yMax: 1.12,
  xHalf: 0.68,
} as const;

export const FP04RB_FRONT_WING_BOUNDS = {
  zMin: 2.31,
  zMax: 3.16,
  yMin: 0.08,
  yMax: 0.52,
  xHalf: 1.02,
} as const;

export const FP04RB_REAR_WING_BOUNDS = {
  zMin: -2.38,
  zMax: -1.82,
  yMin: 0.39,
  yMax: 0.99,
  xHalf: 0.64,
} as const;

export type CarSpaceProjectionMode = "body" | "front-wing" | "rear-wing";

interface CarSpaceUniformBag {
  uCarAtlas: { value: THREE.Texture };
  uUseCarAtlas: { value: number };
}

function makeCanvas(
  width: number,
  height: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(
      "Unable to acquire Canvas2D context for 3D car-space atlas",
    );
  }
  return [canvas, ctx];
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return true;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.46;
}

function drawCarbonFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  baseHex = "#14171B",
): void {
  ctx.save();
  ctx.fillStyle = baseHex;
  ctx.fillRect(x, y, w, h);
  const step = Math.max(4, Math.floor(h / 96));
  ctx.fillStyle = "rgba(255,255,255,0.032)";
  for (let py = y; py < y + h; py += step * 2) {
    for (let px = x; px < x + w; px += step * 2) {
      ctx.fillRect(px, py, step, step);
      ctx.fillRect(px + step, py + step, step, step);
    }
  }
  ctx.restore();
}

function drawLogoBox(
  ctx: CanvasRenderingContext2D,
  placement: TeamLogoPlacementSpec,
  fallbackText: string,
  cx: number,
  cy: number,
  boxW: number,
  boxH: number,
  rotationRad = 0,
  fallbackColor = "#FFFFFF",
): void {
  const logoCanvas = getProcessedLogoCanvas(placement.key, placement.tone);
  if (logoCanvas && logoCanvas.width > 0 && logoCanvas.height > 0) {
    const aspect = logoCanvas.width / logoCanvas.height;
    let drawW = boxW;
    let drawH = boxW / aspect;
    if (drawH > boxH) {
      drawH = boxH;
      drawW = boxH * aspect;
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);
    ctx.drawImage(logoCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.font = `900 ${Math.max(10, Math.round(boxH * 0.68))}px "Inter", "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = fallbackColor;
  ctx.fillText(fallbackText, 0, 0, boxW);
  ctx.restore();
}

function drawStylizedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  fontPx: number,
  fill: string,
  stroke?: string,
  rotationRad = 0,
  italic = false,
  maxWidth?: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.font = `${italic ? "italic " : ""}900 ${Math.round(fontPx)}px "Inter", "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(2, fontPx * 0.13);
    ctx.lineJoin = "round";
    ctx.strokeText(text, 0, 0, maxWidth);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0, maxWidth);
  ctx.restore();
}

function drawThreePointedStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    const scale = i % 2 === 0 ? 1 : 0.2;
    const px = cx + Math.cos(angle) * rx * scale;
    const py = cy + Math.sin(angle) * ry * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Generates a 3-panel 3D Car-Space Orthographic Texture Atlas for PART_BODY_SHELL:
 * - Panel 0 [0..1/3]: Physical LEFT (+X) profile — u: Nose (+3.12m) -> Tail (-1.85m), v: Bottom (0.08m) -> Top (1.12m)
 * - Panel 1 [1/3..2/3]: Physical RIGHT (-X) profile — u: Tail (-1.85m) -> Nose (+3.12m), v: Bottom (0.08m) -> Top (1.12m)
 * - Panel 2 [2/3..1]: TOP (+Y) profile — u: Right (-0.68m) -> Left (+0.68m), v: Nose (+3.12m) at bottom -> Tail (-1.85m) at top
 *
 * Every logo & driver number drawn upright (rotation=0) on all 3 panels reads 100% left-to-right and right-side-up in 3D!
 */
export function createBodyCarSpaceAtlas(
  team: Team2026Spec,
  carNumber: string,
  panelSize = 1024,
  variantId?: LiveryVariantId,
): THREE.CanvasTexture {
  const pw = Math.max(512, panelSize);
  const ph = Math.max(512, Math.round(panelSize * 0.5));
  const [canvas, ctx] = makeCanvas(pw * 3, ph);
  const isCadillacDebut =
    team.id === "cadillac" && variantId === "cadillac-debut-2026";

  const { zMin, zMax, yMin, yMax, xHalf } = FP04RB_BODY_BOUNDS;
  const zSpan = zMax - zMin;
  const ySpan = yMax - yMin;

  // Map 3D car-local (z, y) to canvas pixels on Panel 0 (Left) or Panel 1 (Right)
  const sidePt = (
    side: "left" | "right",
    z: number,
    y: number,
  ): [number, number] => {
    const col = side === "left" ? 0 : 1;
    const u = side === "left" ? (zMax - z) / zSpan : (z - zMin) / zSpan;
    const py = (1 - (y - yMin) / ySpan) * ph;
    return [col * pw + u * pw, py];
  };

  // Map 3D car-local (x, z) to canvas pixels on Panel 2 (Top)
  // Canvas X: -xHalf -> +xHalf (left to right when viewing from front)
  // Canvas Y: zMin (-1.85, rear) at py=0 (top), zMax (+3.12, nose tip) at py=ph (bottom)
  const topPt = (x: number, z: number): [number, number] => {
    const u = (x + xHalf) / (2 * xHalf);
    const py = ((z - zMin) / zSpan) * ph;
    return [2 * pw + u * pw, py];
  };

  const fillSidePoly = (
    side: "left" | "right",
    color: string,
    pts: Array<[number, number]>,
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(side === "left" ? 0 : pw, 0, pw, ph);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach(([z, y], idx) => {
      const [px, py] = sidePt(side, z, y);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const fillTopPoly = (color: string, pts: Array<[number, number]>) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(2 * pw, 0, pw, ph);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach(([x, z], idx) => {
      const [px, py] = topPt(x, z);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawSideLogo = (
    side: "left" | "right",
    placement: TeamLogoPlacementSpec,
    fallback: string,
    z: number,
    y: number,
    widthMeters: number,
    heightMeters: number,
    rotSignRad = 0,
    fallbackColor = "#FFFFFF",
  ) => {
    const [cx, cy] = sidePt(side, z, y);
    const boxW = (widthMeters / zSpan) * pw;
    const boxH = (heightMeters / ySpan) * ph;
    const rot = side === "left" ? -rotSignRad : rotSignRad;
    ctx.save();
    ctx.beginPath();
    ctx.rect(side === "left" ? 0 : pw, 0, pw, ph);
    ctx.clip();
    drawLogoBox(
      ctx,
      placement,
      fallback,
      cx,
      cy,
      boxW,
      boxH,
      rot,
      fallbackColor,
    );
    ctx.restore();
  };

  const drawSideText = (
    side: "left" | "right",
    text: string,
    z: number,
    y: number,
    heightMeters: number,
    fill: string,
    stroke?: string,
    rotSignRad = 0,
    italic = true,
  ) => {
    const [cx, cy] = sidePt(side, z, y);
    const fontPx = (heightMeters / ySpan) * ph;
    const rot = side === "left" ? -rotSignRad : rotSignRad;
    ctx.save();
    ctx.beginPath();
    ctx.rect(side === "left" ? 0 : pw, 0, pw, ph);
    ctx.clip();
    drawStylizedText(ctx, text, cx, cy, fontPx, fill, stroke, rot, italic);
    ctx.restore();
  };

  const drawTopLogo = (
    placement: TeamLogoPlacementSpec,
    fallback: string,
    x: number,
    z: number,
    widthMeters: number,
    lengthMeters: number,
    rotRad = 0,
    fallbackColor = "#FFFFFF",
  ) => {
    const [cx, cy] = topPt(x, z);
    const boxW = (widthMeters / (2 * xHalf)) * pw;
    const boxH = (lengthMeters / zSpan) * ph;
    ctx.save();
    ctx.beginPath();
    ctx.rect(2 * pw, 0, pw, ph);
    ctx.clip();
    drawLogoBox(
      ctx,
      placement,
      fallback,
      cx,
      cy,
      boxW,
      boxH,
      rotRad,
      fallbackColor,
    );
    ctx.restore();
  };

  const drawTopNumber = (
    num: string,
    z: number,
    fill: string,
    stroke?: string,
    lengthMeters = 0.28,
  ) => {
    const [cx, cy] = topPt(0, z);
    const fontPx = (lengthMeters / zSpan) * ph * 1.15;
    ctx.save();
    ctx.beginPath();
    ctx.rect(2 * pw, 0, pw, ph);
    ctx.clip();
    drawStylizedText(ctx, num, cx, cy, fontPx, fill, stroke, 0, true);
    ctx.restore();
  };

  const sides: readonly ("left" | "right")[] = ["left", "right"];

  // =========================================================================
  // TEAM-BY-TEAM 3D MULTI-ANGLE PAINT & LOGO PROJECTION (CALIBRATED TO 2026 PHOTOS)
  // =========================================================================
  switch (team.id) {
    case "mclaren": {
      // Base: Papaya #EF6E12 on nose & shoulders; Anthracite #15191C on sidepods & engine cover
      ctx.fillStyle = "#EF6E12";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Dark anthracite sidepod & lower chassis sweeping smoothly under papaya upper nose
        fillSidePoly(s, "#15191C", [
          [2.05, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.96],
          [-0.08, 1.05],
          [0.08, 0.72],
          [0.35, 0.56],
          [0.95, 0.44],
          [1.55, 0.38],
          [2.05, 0.34],
        ]);
        // Bright Papaya rear wedge ahead of rear wheel (carrying black DELL Technologies)
        fillSidePoly(s, "#EF6E12", [
          [-1.85, 0.14],
          [-0.92, 0.14],
          [-1.12, 0.62],
          [-1.48, 0.88],
          [-1.85, 0.84],
        ]);
        // Papaya sweeping shoulder wedge above OKX / VELO
        fillSidePoly(s, "#EF6E12", [
          [0.12, 0.64],
          [0.65, 0.44],
          [1.25, 0.44],
          [1.95, 0.46],
          [1.95, 0.64],
          [0.92, 0.68],
          [0.18, 0.78],
        ]);
        // Compact Teal #2193AE airbox cap (carrying white Allwyn)
        fillSidePoly(s, "#2193AE", [
          [-0.55, 0.94],
          [0.08, 0.94],
          [0.08, 1.12],
          [-0.78, 1.12],
        ]);
        // Dedicated Royal Blue #253796 DP World box under forward papaya shoulder
        fillSidePoly(s, "#253796", [
          [1.02, 0.36],
          [1.72, 0.34],
          [1.72, 0.47],
          [1.02, 0.49],
        ]);
        // Lower dark carbon floor skirt
        fillSidePoly(s, "#121518", [
          [2.2, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.17],
          [2.2, 0.17],
        ]);

        // Logos calibrated to mclaren-launch-06.webp
        drawSideLogo(
          s,
          { key: "allwyn", tone: "light" },
          "ALLWYN",
          -0.15,
          0.98,
          0.54,
          0.1,
          0,
        );
        drawSideLogo(
          s,
          { key: "gemini", tone: "light" },
          "GEMINI",
          -0.58,
          0.76,
          0.78,
          0.18,
          -0.05,
        );
        drawSideLogo(
          s,
          { key: "okx", tone: "light" },
          "OKX",
          0.06,
          0.44,
          0.62,
          0.18,
          0.04,
        );
        drawSideLogo(
          s,
          { key: "mastercard", tone: "original" },
          "MC",
          -0.36,
          0.36,
          0.32,
          0.16,
          0,
        );
        drawSideLogo(
          s,
          { key: "dell", tone: "dark" },
          "DELL",
          -1.26,
          0.56,
          0.48,
          0.14,
          0,
          "#111417",
        );
        drawSideLogo(
          s,
          { key: "cisco", tone: "dark" },
          "CISCO",
          0.32,
          0.63,
          0.34,
          0.1,
          0,
          "#111417",
        );
        drawSideLogo(
          s,
          { key: "dpWorld", tone: "light" },
          "DP WORLD",
          1.38,
          0.41,
          0.54,
          0.1,
          0,
        );
        drawSideLogo(
          s,
          { key: "mclaren", tone: "papaya" },
          "MCL",
          0.72,
          0.27,
          0.36,
          0.12,
          0,
          "#EF6E12",
        );
        drawSideLogo(
          s,
          { key: "workday", tone: "dark" },
          "WORKDAY",
          2.35,
          0.38,
          0.42,
          0.1,
          0,
          "#111417",
        );
        drawSideText(s, carNumber, -1.58, 0.68, 0.15, "#111417", "#F7F6F1");
      }

      // Top View: Papaya nose & outer shoulders around anthracite engine-cover spine & teal airbox
      fillTopPoly("#15191C", [
        [-0.44, 0.25],
        [0.44, 0.25],
        [0.48, -1.35],
        [0.24, -1.85],
        [-0.24, -1.85],
        [-0.48, -1.35],
      ]);
      // Papaya outer sidepod rim & rear haunches
      fillTopPoly("#EF6E12", [
        [-0.68, 0.65],
        [-0.36, 0.65],
        [-0.38, -0.55],
        [-0.68, -0.55],
      ]);
      fillTopPoly("#EF6E12", [
        [0.36, 0.65],
        [0.68, 0.65],
        [0.68, -0.55],
        [0.38, -0.55],
      ]);
      // Compact teal airbox top accent
      fillTopPoly("#2193AE", [
        [-0.14, 0.08],
        [0.14, 0.08],
        [0.14, -0.42],
        [-0.14, -0.42],
      ]);
      drawTopLogo(
        { key: "mclaren", tone: "dark" },
        "MCL",
        0,
        2.75,
        0.24,
        0.26,
        0,
        "#111417",
      );
      drawTopNumber(carNumber, 2.02, "#111417", "#F7F6F1", 0.3);
      drawTopLogo(
        { key: "okx", tone: "dark" },
        "OKX",
        0,
        1.38,
        0.26,
        0.24,
        0,
        "#111417",
      );
      break;
    }

    case "ferrari": {
      // SF-26 calibrated to ferrari-launch-03.webp & ferrari-launch-04.webp
      ctx.fillStyle = "#D9182B";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Warm white #F2F0EB cockpit shoulder collar sweeping into upper engine cover (HP hood)
        fillSidePoly(s, "#F2F0EB", [
          [0.98, 0.6],
          [0.45, 0.62],
          [0.05, 0.62],
          [-0.42, 0.64],
          [-0.95, 0.72],
          [-1.18, 0.94],
          [-1.18, 1.12],
          [0.25, 1.12],
          [0.98, 0.78],
        ]);
        // Crisp dark/yellow separator along bottom edge of white hood
        fillSidePoly(s, "#17191B", [
          [0.98, 0.59],
          [0.05, 0.61],
          [-0.95, 0.7],
          [-1.18, 0.92],
          [-1.18, 0.945],
          [-0.95, 0.725],
          [0.05, 0.635],
          [0.98, 0.615],
        ]);
        // Dark carbon floor skirt & lower undercut
        fillSidePoly(s, "#17191B", [
          [2.1, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.19],
          [2.1, 0.19],
        ]);

        // Logos calibrated to ferrari-launch-04.webp
        drawSideLogo(
          s,
          { key: "hp", tone: "original" },
          "HP",
          -0.58,
          0.88,
          0.42,
          0.26,
          0,
        );
        drawSideLogo(
          s,
          { key: "shell", tone: "original" },
          "SHELL",
          0.48,
          0.41,
          0.28,
          0.22,
          0,
        );
        drawSideLogo(
          s,
          { key: "ceva", tone: "light" },
          "CEVA",
          -0.18,
          0.41,
          0.66,
          0.18,
          0,
        );
        drawSideLogo(
          s,
          { key: "unicredit", tone: "light" },
          "UNICREDIT",
          -1.16,
          0.56,
          0.52,
          0.13,
          0,
        );
        drawSideLogo(
          s,
          { key: "ferrari", tone: "original" },
          "SF",
          1.18,
          0.54,
          0.22,
          0.18,
          0,
        );
        drawSideText(s, carNumber, -1.48, 0.78, 0.17, "#FFFFFF", "#17191B");
      }

      // Top View calibrated to ferrari-launch-03.webp: white collar wraps around cockpit & narrows onto dorsal engine cover
      fillTopPoly("#F2F0EB", [
        [-0.22, 1.16],
        [0.22, 1.16],
        [0.44, 0.68],
        [0.42, 0.05],
        [0.28, -0.58],
        [0.14, -1.12],
        [-0.14, -1.12],
        [-0.28, -0.58],
        [-0.42, 0.05],
        [-0.44, 0.68],
      ]);
      // Subtle dark pinstripe outlining the white cockpit collar
      fillTopPoly("#FFE045", [
        [-0.02, 2.95],
        [0.02, 2.95],
        [0.02, 2.68],
        [-0.02, 2.68],
      ]);
      drawTopLogo(
        { key: "ferrari", tone: "original" },
        "SF",
        0,
        2.84,
        0.14,
        0.18,
        0,
      );
      drawTopLogo(
        { key: "shell", tone: "original" },
        "SHELL",
        0,
        2.28,
        0.22,
        0.22,
        0,
      );
      drawTopNumber(carNumber, 1.82, "#FFFFFF", "#17191B", 0.34);
      drawTopLogo(
        { key: "hp", tone: "original" },
        "HP",
        0,
        -0.45,
        0.28,
        0.28,
        0,
      );
      break;
    }

    case "mercedes": {
      // Stealth Obsidian Jet-Black #0A0D10 full body with vibrant PETRONAS #00D2BE aero ribbons,
      // fine silver AMG shoulder slashes, and cascading 3-pointed stars across the rear engine cover
      ctx.fillStyle = "#0A0D10";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Deep carbon lower undercut
        fillSidePoly(s, "#07090B", [
          [2.2, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.24],
          [2.2, 0.24],
        ]);
        // Sleek brushed-silver narrow nose-ridge highlight fading into obsidian black
        fillSidePoly(s, "#B9C5C8", [
          [3.12, 0.26],
          [2.15, 0.37],
          [1.45, 0.45],
          [1.45, 0.485],
          [2.15, 0.415],
          [3.12, 0.31],
        ]);
        // Flowing Petronas emerald-teal ribbon (#00D2BE) sweeping from nose across sidepod flank
        fillSidePoly(s, "#00D2BE", [
          [2.95, 0.23],
          [1.55, 0.36],
          [0.58, 0.49],
          [-0.38, 0.56],
          [-1.24, 0.47],
          [-1.24, 0.525],
          [-0.38, 0.62],
          [0.58, 0.55],
          [1.55, 0.41],
          [2.95, 0.27],
        ]);
        // Fine lower Petronas floor-edge aero stripe
        fillSidePoly(s, "#00A19C", [
          [1.85, 0.14],
          [-1.55, 0.14],
          [-1.55, 0.175],
          [1.85, 0.175],
        ]);
        // 3 sharp brushed-silver AMG parallelogram slashes on the obsidian upper shoulder
        for (let idx = 0; idx < 3; idx++) {
          const zBase = 0.24 - idx * 0.26;
          fillSidePoly(s, "rgba(216, 226, 230, 0.72)", [
            [zBase, 0.6],
            [zBase - 0.085, 0.6],
            [zBase - 0.21, 0.76],
            [zBase - 0.125, 0.76],
          ]);
        }
        // Repeating silver Mercedes 3-pointed stars across the obsidian rear engine cover
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 3; c++) {
            const zStar = -0.78 - r * 0.19 - (c % 2) * 0.07;
            const yStar = 0.58 + c * 0.12;
            const [sx, sy] = sidePt(s, zStar, yStar);
            drawThreePointedStar(
              ctx,
              sx,
              sy,
              pw * 0.0085,
              ph * 0.022,
              "rgba(232, 240, 242, 0.68)",
            );
          }
        }

        drawSideLogo(
          s,
          { key: "petronas", tone: "light" },
          "PETRONAS",
          -0.18,
          0.4,
          0.92,
          0.18,
          0.04,
        );
        drawSideLogo(
          s,
          { key: "microsoft", tone: "original" },
          "MICROSOFT",
          -0.32,
          0.88,
          0.52,
          0.13,
          0,
        );
        drawSideText(s, carNumber, -1.42, 0.74, 0.16, "#FFFFFF", "#00D2BE");
      }

      // Top View: Stealth obsidian jet-black nose, cockpit & sidepods with Petronas teal shoulder sweep
      for (const sign of [-1, 1]) {
        // Crisp Petronas emerald-teal pinstripe tracing nose & sidepod shoulders
        fillTopPoly("#00D2BE", [
          [sign * 0.14, 2.9],
          [sign * 0.175, 2.9],
          [sign * 0.25, 1.02],
          [sign * 0.62, 0.68],
          [sign * 0.62, -0.45],
          [sign * 0.56, -0.45],
          [sign * 0.56, 0.64],
          [sign * 0.21, 0.99],
        ]);
        // Subtle metallic silver AMG shoulder slashes on obsidian sidepod top
        for (let idx = 0; idx < 3; idx++) {
          const zStart = 0.26 - idx * 0.3;
          fillTopPoly("rgba(216, 226, 230, 0.65)", [
            [sign * 0.27, zStart],
            [sign * 0.27, zStart - 0.09],
            [sign * 0.54, zStart - 0.28],
            [sign * 0.54, zStart - 0.19],
          ]);
        }
      }
      // Subtle silver nose-tip V-accent framing the glowing silver Mercedes star
      fillTopPoly("rgba(216, 226, 230, 0.28)", [
        [-0.08, 3.12],
        [0.08, 3.12],
        [0.14, 2.55],
        [-0.14, 2.55],
      ]);
      // 3-pointed stars along the obsidian rear engine cover in Top view
      for (let r = 0; r < 5; r++) {
        for (const xStar of [-0.18, -0.07, 0.07, 0.18]) {
          const [sx, sy] = topPt(
            xStar,
            -0.65 - r * 0.21 + (xStar > 0 ? 0.06 : 0),
          );
          drawThreePointedStar(
            ctx,
            sx,
            sy,
            pw * 0.011,
            ph * 0.014,
            "rgba(232, 240, 242, 0.62)",
          );
        }
      }
      drawTopLogo(
        { key: "mercedes", tone: "light" },
        "MB",
        0,
        2.84,
        0.16,
        0.18,
        0,
        "#F2F7F8",
      );
      drawTopNumber(carNumber, 1.98, "#FFFFFF", "#00D2BE", 0.32);
      break;
    }

    case "red-bull": {
      // RB22 calibrated to redbull-launch-03.webp
      ctx.fillStyle = "#14306E";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Deep navy lower undercut & floor skirt
        fillSidePoly(s, "#0E1A3B", [
          [2.1, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.3],
          [0.95, 0.26],
          [2.1, 0.22],
        ]);
        // Yellow airbox collar leading into giant red bull dorsal silhouette
        fillSidePoly(s, "#FFCE00", [
          [0.14, 0.88],
          [-0.28, 0.86],
          [-0.28, 1.07],
          [0.14, 1.07],
        ]);
        // Red nose cone tip & subtle red body highlight stripe
        fillSidePoly(s, "#FFCE00", [
          [3.12, 0.18],
          [2.72, 0.18],
          [2.72, 0.36],
          [3.12, 0.36],
        ]);
        fillSidePoly(s, "#E32C31", [
          [0.45, 0.52],
          [-0.78, 0.5],
          [-0.78, 0.54],
          [0.45, 0.56],
        ]);

        // Logos calibrated to redbull-launch-03.webp
        drawSideLogo(
          s,
          { key: "oracle", tone: "light" },
          "ORACLE",
          0.04,
          0.42,
          1.15,
          0.2,
          0,
        );
        drawSideLogo(
          s,
          { key: "redbullSunBulls", tone: "original" },
          "RED BULL",
          -0.52,
          0.84,
          1.28,
          0.36,
          0,
        );
        drawSideLogo(
          s,
          { key: "ford", tone: "original" },
          "FORD",
          -1.24,
          0.52,
          0.42,
          0.16,
          0,
        );
        drawSideText(s, carNumber, -1.52, 0.72, 0.17, "#E32C31", "#FFFFFF");
      }

      // Top View: Glossy royal-navy body, yellow nose tip, sun & bulls along engine cover spine
      fillTopPoly("#FFCE00", [
        [-0.18, 3.12],
        [0.18, 3.12],
        [0.15, 2.7],
        [-0.15, 2.7],
      ]);
      fillTopPoly("#0E1A3B", [
        [-0.22, -0.35],
        [0.22, -0.35],
        [0.24, -1.85],
        [-0.24, -1.85],
      ]);
      drawTopLogo(
        { key: "redbullSunBulls", tone: "original" },
        "RB",
        0,
        2.38,
        0.28,
        0.28,
        0,
      );
      drawTopNumber(carNumber, 1.85, "#E32C31", "#FFFFFF", 0.34);
      drawTopLogo(
        { key: "redbullSunBulls", tone: "original" },
        "RB",
        0,
        -0.55,
        0.44,
        0.55,
        0,
      );
      break;
    }

    case "racing-bulls": {
      // VCARB 03 calibrated to racingbulls-launch-03.webp
      ctx.fillStyle = "#ECF0EE";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Dark midnight-blue lower sweeping flank curving from cockpit undercut to rear wheel
        fillSidePoly(s, "#132248", [
          [0.95, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.56],
          [-1.25, 0.58],
          [-0.65, 0.22],
          [0.05, 0.28],
          [0.48, 0.54],
          [0.95, 0.52],
        ]);
        // Metallic Royal Ford Blue (#1C4AA9) rear haunch & sky-blue sidepod glow
        fillSidePoly(s, "#1C4AA9", [
          [-1.85, 0.28],
          [-1.08, 0.28],
          [-0.88, 0.64],
          [-1.85, 0.64],
        ]);
        // Yellow airbox collar (matching racingbulls-launch-03.webp)
        fillSidePoly(s, "#FFCE00", [
          [0.14, 0.88],
          [-0.26, 0.86],
          [-0.26, 1.07],
          [0.14, 1.07],
        ]);
        // Blue nose sidewall stripe
        fillSidePoly(s, "#1C4AA9", [
          [2.85, 0.24],
          [1.45, 0.36],
          [1.45, 0.42],
          [2.85, 0.3],
        ]);

        // Logos calibrated to racingbulls-launch-03.webp
        drawSideLogo(
          s,
          { key: "visa", tone: "blue" },
          "VISA",
          -0.32,
          0.44,
          0.96,
          0.24,
          0.14,
          "#1C4AA9",
        );
        drawSideLogo(
          s,
          { key: "redbullSunBulls", tone: "original" },
          "RB",
          -0.58,
          0.86,
          1.05,
          0.3,
          0,
        );
        drawSideLogo(
          s,
          { key: "ford", tone: "original" },
          "FORD",
          -1.32,
          0.48,
          0.42,
          0.16,
          0,
        );
        drawSideText(s, carNumber, -1.58, 0.72, 0.16, "#1C4AA9", "#FFFFFF");
      }

      // Top View: Bright white nose & shoulders with twin metallic blue contour lines
      for (const sign of [-1, 1]) {
        fillTopPoly("#1C4AA9", [
          [sign * 0.14, 2.75],
          [sign * 0.2, 2.75],
          [sign * 0.36, 0.85],
          [sign * 0.56, -0.4],
          [sign * 0.42, -1.65],
          [sign * 0.34, -1.65],
          [sign * 0.48, -0.4],
          [sign * 0.28, 0.85],
        ]);
      }
      drawTopLogo(
        { key: "racingbulls", tone: "red" },
        "VCARB",
        0,
        2.78,
        0.22,
        0.22,
        0,
        "#D93439",
      );
      drawTopNumber(carNumber, 1.92, "#1C4AA9", "#FFFFFF", 0.34);
      break;
    }

    case "aston-martin": {
      // AMR26 calibrated to astonmartin-launch-04.webp
      ctx.fillStyle = "#075744";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Deep dark carbon-green lower sidepod undercut & floor
        fillSidePoly(s, "#0E1C19", [
          [2.1, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.46],
          [-0.95, 0.42],
          [0.25, 0.34],
          [1.15, 0.28],
          [2.1, 0.22],
        ]);
        // Dark dorsal sharkfin top edge
        fillSidePoly(s, "#0E1C19", [
          [-0.18, 0.86],
          [-1.85, 0.72],
          [-1.85, 1.05],
          [-0.18, 1.07],
        ]);
        // Razor-thin AMR26 lime #BFD82C accent line tracing nose flank & lower transition cleanly below aramco
        fillSidePoly(s, "#BFD82C", [
          [2.45, 0.27],
          [1.45, 0.35],
          [0.95, 0.4],
          [0.95, 0.435],
          [1.45, 0.385],
          [2.45, 0.3],
        ]);
        fillSidePoly(s, "#BFD82C", [
          [0.52, 0.48],
          [-0.65, 0.48],
          [-1.35, 0.51],
          [-1.35, 0.535],
          [-0.65, 0.505],
          [0.52, 0.505],
        ]);

        // Logos calibrated to astonmartin-launch-04.webp
        drawSideLogo(
          s,
          { key: "aramco", tone: "original" },
          "aramco",
          -0.22,
          0.43,
          0.96,
          0.19,
          0.06,
        );
        drawSideLogo(
          s,
          { key: "valvoline", tone: "original" },
          "Valvoline",
          -0.52,
          0.62,
          0.42,
          0.12,
          0,
        );
        drawSideLogo(
          s,
          { key: "astonmartin", tone: "light" },
          "AMR",
          1.18,
          0.5,
          0.38,
          0.14,
          0,
          "#F3F6EA",
        );
        drawSideText(s, carNumber, -1.48, 0.72, 0.16, "#F3F6EA", "#0E1C19");
      }

      // Top View: Racing Green shoulders with fine lime pinstripes framing dark central cockpit-airbox spine
      fillTopPoly("#0E1C19", [
        [-0.18, 0.85],
        [0.18, 0.85],
        [0.2, -1.85],
        [-0.2, -1.85],
      ]);
      for (const sign of [-1, 1]) {
        fillTopPoly("#BFD82C", [
          [sign * 0.08, 2.75],
          [sign * 0.11, 2.75],
          [sign * 0.22, 1.05],
          [sign * 0.54, 0.25],
          [sign * 0.44, -1.35],
          [sign * 0.41, -1.35],
          [sign * 0.51, 0.25],
          [sign * 0.19, 1.05],
        ]);
      }
      drawTopLogo(
        { key: "astonmartin", tone: "light" },
        "AMR",
        0,
        2.82,
        0.26,
        0.16,
        0,
        "#F3F6EA",
      );
      drawTopNumber(carNumber, 1.94, "#F3F6EA", "#0E1C19", 0.34);
      break;
    }

    case "alpine": {
      // A526 calibrated to alpine-launch-03.webp & alpine-launch-04.webp
      ctx.fillStyle = "#095FB1";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // BWT Pink nose deck & forward halo shoulder tapering down into Alpine Blue sidepods
        fillSidePoly(s, "#F17EB6", [
          [2.45, 0.34],
          [1.25, 0.5],
          [0.45, 0.64],
          [0.18, 0.86],
          [0.95, 0.88],
          [1.65, 0.64],
          [2.45, 0.48],
        ]);
        // Pink rear engine-cover dorsal accent wedge (visible on alpine-launch-04.webp)
        fillSidePoly(s, "#F17EB6", [
          [-1.08, 0.54],
          [-1.58, 0.54],
          [-1.58, 0.78],
          [-1.18, 0.78],
        ]);
        // Dark carbon lower skirt & sidepod undercut
        fillSidePoly(s, "#1B1D24", [
          [2.2, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.24],
          [1.25, 0.22],
          [2.2, 0.2],
        ]);

        // Logos calibrated to alpine-launch-04.webp
        drawSideLogo(
          s,
          { key: "bwt", tone: "pink" },
          "BWT",
          -0.35,
          0.42,
          0.88,
          0.26,
          0,
          "#F17EB6",
        );
        drawSideLogo(
          s,
          { key: "eni", tone: "light" },
          "eni",
          -0.42,
          0.78,
          0.54,
          0.18,
          0,
          "#F8F8FC",
        );
        drawSideText(s, carNumber, -1.36, 0.66, 0.16, "#FFFFFF", "#1B1D24");
      }

      // Top View calibrated to alpine-launch-03.webp: Metallic blue nose tip -> BWT Pink upper nose & halo -> Blue body
      fillTopPoly("#F17EB6", [
        [-0.2, 2.48],
        [0.2, 2.48],
        [0.26, 0.96],
        [0.34, 0.45],
        [-0.34, 0.45],
        [-0.26, 0.96],
      ]);
      // Metallic blue nose tip cap ahead of pink deck
      fillTopPoly("#095FB1", [
        [-0.22, 3.12],
        [0.22, 3.12],
        [0.18, 2.42],
        [-0.18, 2.42],
      ]);
      drawTopLogo(
        { key: "alpine", tone: "light" },
        "A",
        0,
        2.82,
        0.18,
        0.2,
        0,
        "#FFFFFF",
      );
      drawTopLogo(
        { key: "eni", tone: "dark" },
        "eni",
        0,
        2.25,
        0.18,
        0.14,
        0,
        "#1B1D24",
      );
      drawTopLogo(
        { key: "bwt", tone: "blue" },
        "BWT",
        0,
        1.82,
        0.22,
        0.16,
        0,
        "#095FB1",
      );
      drawTopNumber(carNumber, 1.38, "#1B1D24", "#FFFFFF", 0.28);
      break;
    }

    case "williams": {
      // FW48 calibrated directly to williams-launch-02.webp & williams-launch-04.webp
      ctx.fillStyle = "#1555BD";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Dark carbon lower chassis & undercut
        fillSidePoly(s, "#11171E", [
          [2.1, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.26],
          [0.95, 0.26],
          [1.65, 0.42],
          [2.1, 0.34],
        ]);
        // Tier 2: Sweeping Sky Cyan #30A5D2 Barclays mid-sidepod shoulder
        fillSidePoly(s, "#30A5D2", [
          [0.82, 0.42],
          [-0.22, 0.44],
          [-0.95, 0.52],
          [-0.95, 0.62],
          [0.18, 0.58],
          [0.82, 0.55],
        ]);
        // Tier 3: Clean White #F1F2F0 lower rear Komatsu panel ahead of rear wheel
        fillSidePoly(s, "#F1F2F0", [
          [0.12, 0.24],
          [-1.38, 0.24],
          [-1.52, 0.48],
          [-0.85, 0.52],
          [-0.18, 0.44],
          [0.12, 0.36],
        ]);
        // Duracell copper & black airbox intake cap (signature FW48 feature visible in williams-launch-02.webp!)
        fillSidePoly(s, "#C97A2B", [
          [0.12, 0.92],
          [-0.14, 0.92],
          [-0.14, 1.07],
          [0.12, 1.07],
        ]);
        fillSidePoly(s, "#11171E", [
          [-0.14, 0.92],
          [-0.52, 0.92],
          [-0.52, 1.07],
          [-0.14, 1.07],
        ]);
        // Heritage red-white pinstripe along cyan/blue boundary
        fillSidePoly(s, "#D32E37", [
          [0.82, 0.55],
          [-0.95, 0.62],
          [-0.95, 0.64],
          [0.82, 0.57],
        ]);

        // Logos calibrated to williams-launch-02.webp
        drawSideLogo(
          s,
          { key: "atlassian", tone: "light" },
          "ATLASSIAN",
          -0.68,
          0.72,
          0.88,
          0.16,
          0,
        );
        drawSideLogo(
          s,
          { key: "barclays", tone: "light" },
          "BARCLAYS",
          0.18,
          0.49,
          0.68,
          0.14,
          0,
        );
        drawSideLogo(
          s,
          { key: "komatsu", tone: "blue" },
          "KOMATSU",
          -0.68,
          0.37,
          0.76,
          0.16,
          0,
          "#1555BD",
        );
        drawSideText(s, carNumber, -1.56, 0.7, 0.15, "#FFFFFF", "#11171E");
      }

      // Top View: Gloss cobalt blue nose & spine with cyan outer sidepod flanks
      for (const sign of [-1, 1]) {
        fillTopPoly("#30A5D2", [
          [sign * 0.42, 0.75],
          [sign * 0.68, 0.55],
          [sign * 0.65, -0.75],
          [sign * 0.42, -0.85],
        ]);
      }
      drawTopLogo(
        { key: "williams", tone: "light" },
        "W",
        0,
        2.78,
        0.18,
        0.18,
        0,
      );
      drawTopNumber(carNumber, 1.98, "#FFFFFF", "#11171E", 0.34);
      drawTopLogo(
        { key: "atlassian", tone: "light" },
        "ATLASSIAN",
        0,
        -0.58,
        0.32,
        0.24,
        0,
      );
      break;
    }

    case "haas": {
      // VF-26 calibrated directly to haas-2026-official-right.webp
      ctx.fillStyle = "#E8E9E6";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Gloss black lower sidepod undercut & rear Coke-bottle area
        fillSidePoly(s, "#141719", [
          [1.65, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.52],
          [-1.15, 0.52],
          [-0.82, 0.22],
          [0.32, 0.24],
          [0.88, 0.42],
          [1.65, 0.26],
        ]);
        // Red #D51C2D airbox & broad rising red sweep along dorsal engine cover
        fillSidePoly(s, "#D51C2D", [
          [0.18, 0.88],
          [-0.36, 0.88],
          [-0.78, 0.78],
          [-1.55, 0.88],
          [-1.55, 1.07],
          [0.18, 1.07],
        ]);
        // Sharp horizontal black-and-red shoulder stripe along upper white sidepod (matching haas-2026-official-right.webp)
        fillSidePoly(s, "#141719", [
          [1.95, 0.42],
          [0.65, 0.56],
          [-1.25, 0.58],
          [-1.25, 0.625],
          [0.65, 0.6],
          [1.95, 0.455],
        ]);
        fillSidePoly(s, "#D51C2D", [
          [1.95, 0.39],
          [0.65, 0.53],
          [-1.25, 0.52],
          [-1.25, 0.58],
          [0.65, 0.56],
          [1.95, 0.42],
        ]);

        // Logos calibrated to haas-2026-official-right.webp
        drawSideLogo(
          s,
          { key: "haasSidepod", tone: "original" },
          "HAAS",
          -0.05,
          0.39,
          1.18,
          0.26,
          0.14,
          "#141719",
        );
        drawSideLogo(
          s,
          { key: "tgr", tone: "original" },
          "GR",
          -0.82,
          0.86,
          0.92,
          0.28,
          -0.06,
          "#141719",
        );
        drawSideText(s, carNumber, -1.56, 0.68, 0.15, "#FFFFFF", "#141719");
      }

      // Top View: White nose & sidepods with twin red-black centerline stripes & dark rear dorsal fin
      fillTopPoly("#141719", [
        [-0.14, 0.85],
        [0.14, 0.85],
        [0.2, -1.85],
        [-0.2, -1.85],
      ]);
      for (const sign of [-1, 1]) {
        fillTopPoly("#D51C2D", [
          [sign * 0.05, 2.72],
          [sign * 0.09, 2.72],
          [sign * 0.18, 1.0],
          [sign * 0.14, 1.0],
        ]);
      }
      drawTopLogo(
        { key: "haas", tone: "dark" },
        "HAAS",
        0,
        2.82,
        0.2,
        0.18,
        0,
        "#141719",
      );
      drawTopNumber(carNumber, 1.98, "#141719", "#E8E9E6", 0.32);
      drawTopLogo(
        { key: "tgr", tone: "original" },
        "TGR",
        0,
        -0.58,
        0.32,
        0.28,
        0,
      );
      break;
    }

    case "audi": {
      // R26 calibrated directly to audi-launch-02.webp & audi-launch-04.webp
      ctx.fillStyle = "#AEB2B1";
      ctx.fillRect(0, 0, canvas.width, ph);

      for (const s of sides) {
        // Matte Carbon Black #111315 rear half & upper engine cover
        fillSidePoly(s, "#111315", [
          [-0.08, 0.72],
          [-0.65, 0.56],
          [-1.18, 0.18],
          [-1.85, 0.18],
          [-1.85, 1.07],
          [-0.08, 1.07],
        ]);
        // Bold sweeping Lava Red #FF2E24 rear sidepod block (audi-launch-02.webp!)
        fillSidePoly(s, "#F02B22", [
          [-0.22, 0.24],
          [-1.12, 0.24],
          [-1.18, 0.52],
          [-0.72, 0.66],
          [-0.36, 0.64],
          [-0.45, 0.42],
        ]);
        // Lava Red sidepod inlet inner highlight & airbox intake lip
        fillSidePoly(s, "#F02B22", [
          [0.82, 0.4],
          [0.32, 0.42],
          [0.32, 0.52],
          [0.82, 0.52],
        ]);
        fillSidePoly(s, "#F02B22", [
          [0.14, 0.89],
          [-0.05, 0.89],
          [-0.05, 1.07],
          [0.14, 1.07],
        ]);
        // Carbon floor edge & lower sidepod skirt
        fillSidePoly(s, "#111315", [
          [2.1, 0.08],
          [-1.85, 0.08],
          [-1.85, 0.25],
          [2.1, 0.25],
        ]);

        // Logos calibrated to audi-launch-02.webp
        drawSideLogo(
          s,
          { key: "revolut", tone: "dark" },
          "Revolut",
          0.08,
          0.42,
          0.78,
          0.18,
          0,
          "#111315",
        );
        drawSideLogo(
          s,
          { key: "audi", tone: "red" },
          "AUDI",
          -0.58,
          0.84,
          0.52,
          0.18,
          0,
          "#F02B22",
        );
        drawSideText(s, carNumber, -1.48, 0.72, 0.16, "#F02B22", "#111315");
      }

      // Top View calibrated to audi-launch-04.webp: Titanium front -> sweeping Lava Red rear sidepods -> Carbon rear cover
      fillTopPoly("#111315", [
        [-0.22, -0.05],
        [0.22, -0.05],
        [0.52, -1.25],
        [0.38, -1.85],
        [-0.38, -1.85],
        [-0.52, -1.25],
      ]);
      for (const sign of [-1, 1]) {
        fillTopPoly("#F02B22", [
          [sign * 0.24, -0.35],
          [sign * 0.62, -0.45],
          [sign * 0.54, -1.18],
          [sign * 0.22, -0.95],
        ]);
      }
      drawTopLogo(
        { key: "audi", tone: "red" },
        "AUDI",
        0,
        2.84,
        0.22,
        0.12,
        0,
        "#F02B22",
      );
      drawTopNumber(carNumber, 1.98, "#F02B22", "#111315", 0.34);
      break;
    }

    case "cadillac": {
      if (!isCadillacDebut) {
        // MAC-26 Belgian GP (Spa · Default P6) calibrated directly to cadillac-current-belgium-side.jpg & cadillac-updated-02.webp
        ctx.fillStyle = "#EDECE8";
        ctx.fillRect(0, 0, canvas.width, ph);

        for (const s of sides) {
          // Glossy Black #111315 lower nose flank & sweeping lower sidepod undercut on BOTH sides
          fillSidePoly(s, "#111315", [
            [3.12, 0.08],
            [-1.85, 0.08],
            [-1.85, 0.42],
            [-1.08, 0.34],
            [-0.22, 0.28],
            [0.62, 0.42],
            [1.15, 0.56],
            [1.95, 0.4],
            [3.12, 0.24],
          ]);
          // Signature Spa checkered/striped black-and-white chevron bars on rear engine cover taper
          for (let b = 0; b < 4; b++) {
            const yBar = 0.44 + b * 0.075;
            fillSidePoly(s, "#111315", [
              [-0.86, yBar],
              [-1.68, yBar - 0.02],
              [-1.68, yBar + 0.025],
              [-0.86, yBar + 0.038],
            ]);
          }

          // Logos calibrated to cadillac-current-belgium-side.jpg
          drawSideLogo(
            s,
            { key: "twg", tone: "dark" },
            "TWG",
            -0.14,
            0.43,
            0.88,
            0.2,
            0.08,
            "#111315",
          );
          drawSideLogo(
            s,
            { key: "cadillac", tone: "dark" },
            "CADILLAC",
            -0.45,
            0.88,
            0.46,
            0.16,
            0,
            "#111315",
          );
          drawSideText(s, carNumber, -1.52, 0.78, 0.15, "#111315", "#EDECE8");
        }

        // Top View: Symmetric Warm White #EDECE8 nose, halo & upper shell with subtle dark rear dorsal taper
        fillTopPoly("#111315", [
          [-0.14, -1.05],
          [0.14, -1.05],
          [0.24, -1.85],
          [-0.24, -1.85],
        ]);
        drawTopLogo(
          { key: "cadillac", tone: "dark" },
          "CAD",
          0,
          2.84,
          0.24,
          0.14,
          0,
          "#111315",
        );
        drawTopNumber(carNumber, 1.98, "#111315", "#EDECE8", 0.32);
      } else {
        // MAC-26 Debut Launch Variant: Physical LEFT Pearl White #EDECE8, Physical RIGHT Obsidian Black #111315
        ctx.fillStyle = "#EDECE8";
        ctx.fillRect(0, 0, pw, ph);
        ctx.fillStyle = "#111315";
        ctx.fillRect(pw, 0, pw, ph);
        // Top View split down centerline x=0
        ctx.fillStyle = "#111315";
        ctx.fillRect(2 * pw, 0, pw / 2, ph);
        ctx.fillStyle = "#EDECE8";
        ctx.fillRect(2 * pw + pw / 2, 0, pw / 2, ph);

        // Left side (white)
        fillSidePoly("left", "#BCC0BF", [
          [1.6, 0.16],
          [-1.6, 0.16],
          [-1.6, 0.28],
          [1.6, 0.28],
        ]);
        drawSideLogo(
          "left",
          { key: "twg", tone: "dark" },
          "TWG",
          -0.1,
          0.46,
          0.88,
          0.2,
          0.05,
          "#111315",
        );
        drawSideLogo(
          "left",
          { key: "cadillac", tone: "dark" },
          "CADILLAC",
          -0.45,
          0.86,
          0.46,
          0.16,
          0,
          "#111315",
        );
        drawSideText(
          "left",
          carNumber,
          -1.48,
          0.72,
          0.15,
          "#111315",
          "#EDECE8",
        );

        // Right side (obsidian black)
        fillSidePoly("right", "#1D2127", [
          [1.6, 0.16],
          [-1.6, 0.16],
          [-1.6, 0.28],
          [1.6, 0.28],
        ]);
        drawSideLogo(
          "right",
          { key: "twg", tone: "light" },
          "TWG",
          -0.1,
          0.46,
          0.88,
          0.2,
          0.05,
          "#FFFFFF",
        );
        drawSideLogo(
          "right",
          { key: "cadillac", tone: "original" },
          "CADILLAC",
          -0.45,
          0.86,
          0.46,
          0.16,
          0,
          "#FFFFFF",
        );
        drawSideText(
          "right",
          carNumber,
          -1.48,
          0.72,
          0.15,
          "#FFFFFF",
          "#111315",
        );

        drawTopLogo(
          { key: "cadillac", tone: "original" },
          "CAD",
          0,
          2.84,
          0.24,
          0.14,
          0,
          "#FFFFFF",
        );
        drawTopNumber(carNumber, 1.98, "#FFFFFF", "#111315", 0.32);
      }
      break;
    }
  }

  // Subtle neutral panel vignette along bottom floor line to anchor depth without washing out paint
  if (typeof ctx.createLinearGradient === "function") {
    const grad = ctx.createLinearGradient(0, ph * 0.82, 0, ph);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, ph * 0.82, pw * 2, ph * 0.18);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  tex.anisotropy = 4;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a 3-panel 3D Car-Space Orthographic Texture Atlas for PART_FRONT_WING:
 * - Panel 0 [0..1/3]: TOP flaps (X: -1.02..+1.02, Z: 2.31..3.16)
 * - Panel 1 [1/3..2/3]: LEFT outer endplate (+X)
 * - Panel 2 [2/3..1]: RIGHT outer endplate (-X)
 */
export function createFrontWingCarSpaceAtlas(
  team: Team2026Spec,
  panelSize = 512,
  variantId?: LiveryVariantId,
): THREE.CanvasTexture {
  const pw = Math.max(256, panelSize);
  const ph = pw;
  const [canvas, ctx] = makeCanvas(pw * 3, ph);
  const zp = team.zonePaint;
  const isCadillacDebut =
    team.id === "cadillac" && variantId === "cadillac-debut-2026";

  // Base carbon weave across all 3 panels
  drawCarbonFill(ctx, 0, 0, pw * 3, ph, zp.wing);

  // Panel 0: Top Flaps (u: x from -1.02 to +1.02; py=0 is z=2.31 rear edge, py=ph is z=3.16 leading edge)
  if (team.id === "mclaren") {
    // Black center, Papaya outer flaps
    ctx.fillStyle = "#EF6E12";
    ctx.fillRect(pw * 0.04, ph * 0.18, pw * 0.28, ph * 0.66);
    ctx.fillRect(pw * 0.68, ph * 0.18, pw * 0.28, ph * 0.66);
  } else if (team.id === "alpine") {
    // Bright BWT Pink inner cascade flaps carrying blue BWT wordmarks (alpine-launch-03.webp)
    ctx.fillStyle = "#F17EB6";
    ctx.fillRect(pw * 0.12, ph * 0.2, pw * 0.3, ph * 0.58);
    ctx.fillRect(pw * 0.58, ph * 0.2, pw * 0.3, ph * 0.58);
    drawLogoBox(
      ctx,
      { key: "bwt", tone: "blue" },
      "BWT",
      pw * 0.27,
      ph * 0.48,
      pw * 0.24,
      ph * 0.24,
      0,
      "#095FB1",
    );
    drawLogoBox(
      ctx,
      { key: "bwt", tone: "blue" },
      "BWT",
      pw * 0.73,
      ph * 0.48,
      pw * 0.24,
      ph * 0.24,
      0,
      "#095FB1",
    );
  } else if (team.id === "williams") {
    ctx.fillStyle = "#F1F2F0";
    ctx.fillRect(pw * 0.12, ph * 0.22, pw * 0.24, ph * 0.52);
    ctx.fillRect(pw * 0.64, ph * 0.22, pw * 0.24, ph * 0.52);
    drawLogoBox(
      ctx,
      { key: "atlassian", tone: "blue" },
      "ATLASSIAN",
      pw * 0.24,
      ph * 0.48,
      pw * 0.2,
      ph * 0.16,
      0,
      "#1555BD",
    );
    drawLogoBox(
      ctx,
      { key: "atlassian", tone: "blue" },
      "ATLASSIAN",
      pw * 0.76,
      ph * 0.48,
      pw * 0.2,
      ph * 0.16,
      0,
      "#1555BD",
    );
  } else if (team.id === "haas") {
    ctx.fillStyle = "#E8E9E6";
    ctx.fillRect(pw * 0.1, ph * 0.2, pw * 0.28, ph * 0.56);
    ctx.fillRect(pw * 0.62, ph * 0.2, pw * 0.28, ph * 0.56);
    ctx.fillStyle = "#D51C2D";
    ctx.fillRect(pw * 0.1, ph * 0.2, pw * 0.28, ph * 0.08);
    ctx.fillRect(pw * 0.62, ph * 0.2, pw * 0.28, ph * 0.08);
  } else if (team.id === "racing-bulls") {
    ctx.fillStyle = "#1C4AA9";
    ctx.fillRect(pw * 0.08, ph * 0.24, pw * 0.34, ph * 0.54);
    ctx.fillRect(pw * 0.58, ph * 0.24, pw * 0.34, ph * 0.54);
    drawLogoBox(
      ctx,
      { key: "visa", tone: "light" },
      "VISA",
      pw * 0.25,
      ph * 0.5,
      pw * 0.24,
      ph * 0.16,
    );
    drawLogoBox(
      ctx,
      { key: "visa", tone: "light" },
      "VISA",
      pw * 0.75,
      ph * 0.5,
      pw * 0.24,
      ph * 0.16,
    );
  } else if (team.id === "mercedes") {
    ctx.fillStyle = "#00A19C";
    ctx.fillRect(pw * 0.08, ph * 0.72, pw * 0.84, ph * 0.06);
    drawLogoBox(
      ctx,
      { key: "petronas", tone: "light" },
      "PETRONAS",
      pw * 0.26,
      ph * 0.46,
      pw * 0.26,
      ph * 0.16,
    );
    drawLogoBox(
      ctx,
      { key: "petronas", tone: "light" },
      "PETRONAS",
      pw * 0.74,
      ph * 0.46,
      pw * 0.26,
      ph * 0.16,
    );
  } else if (team.id === "ferrari") {
    drawLogoBox(
      ctx,
      { key: "hp", tone: "original" },
      "HP",
      pw * 0.28,
      ph * 0.46,
      pw * 0.16,
      ph * 0.16,
    );
    drawLogoBox(
      ctx,
      { key: "hp", tone: "original" },
      "HP",
      pw * 0.72,
      ph * 0.46,
      pw * 0.16,
      ph * 0.16,
    );
  } else if (team.id === "red-bull") {
    ctx.fillStyle = "#E32C31";
    ctx.fillRect(pw * 0.08, ph * 0.74, pw * 0.84, ph * 0.05);
    drawLogoBox(
      ctx,
      { key: "oracle", tone: "light" },
      "ORACLE",
      pw * 0.26,
      ph * 0.48,
      pw * 0.26,
      ph * 0.14,
    );
    drawLogoBox(
      ctx,
      { key: "oracle", tone: "light" },
      "ORACLE",
      pw * 0.74,
      ph * 0.48,
      pw * 0.26,
      ph * 0.14,
    );
  } else if (team.id === "aston-martin") {
    ctx.fillStyle = "#BFD82C";
    ctx.fillRect(pw * 0.06, ph * 0.74, pw * 0.88, ph * 0.045);
    drawLogoBox(
      ctx,
      { key: "aramco", tone: "original" },
      "aramco",
      pw * 0.26,
      ph * 0.48,
      pw * 0.26,
      ph * 0.14,
    );
    drawLogoBox(
      ctx,
      { key: "aramco", tone: "original" },
      "aramco",
      pw * 0.74,
      ph * 0.48,
      pw * 0.26,
      ph * 0.14,
    );
  } else if (team.id === "audi") {
    ctx.fillStyle = "#AEB2B1";
    ctx.fillRect(pw * 0.08, ph * 0.22, pw * 0.3, ph * 0.56);
    ctx.fillRect(pw * 0.62, ph * 0.22, pw * 0.3, ph * 0.56);
    drawLogoBox(
      ctx,
      { key: "revolut", tone: "dark" },
      "Revolut",
      pw * 0.23,
      ph * 0.48,
      pw * 0.24,
      ph * 0.14,
      0,
      "#111315",
    );
    drawLogoBox(
      ctx,
      { key: "revolut", tone: "dark" },
      "Revolut",
      pw * 0.77,
      ph * 0.48,
      pw * 0.24,
      ph * 0.14,
      0,
      "#111315",
    );
  }

  // Panel 1 & 2: Left & Right Front-Wing Endplates
  for (const col of [1, 2]) {
    const ox = col * pw;
    let epBg = zp.wing;
    if (team.id === "mclaren") epBg = "#EF6E12";
    else if (team.id === "alpine") epBg = "#F17EB6";
    else if (team.id === "haas") epBg = "#E8E9E6";
    else if (team.id === "cadillac") {
      epBg = isCadillacDebut && col === 2 ? "#111315" : "#EDECE8";
    } else if (team.id === "aston-martin") epBg = "#075744";

    ctx.fillStyle = epBg;
    ctx.fillRect(ox, 0, pw, ph);

    if (team.id === "mclaren") {
      drawLogoBox(
        ctx,
        { key: "workday", tone: "dark" },
        "workday",
        ox + pw * 0.5,
        ph * 0.58,
        pw * 0.72,
        ph * 0.28,
        0,
        "#111417",
      );
    } else if (team.id === "ferrari") {
      drawLogoBox(
        ctx,
        { key: "unicredit", tone: "light" },
        "UniCredit",
        ox + pw * 0.5,
        ph * 0.56,
        pw * 0.74,
        ph * 0.26,
      );
    } else if (team.id === "mercedes") {
      drawLogoBox(
        ctx,
        { key: "microsoft", tone: "original" },
        "Microsoft",
        ox + pw * 0.5,
        ph * 0.58,
        pw * 0.74,
        ph * 0.26,
      );
    } else if (team.id === "cadillac" && !isCadillacDebut) {
      drawStylizedText(
        ctx,
        "3M",
        ox + pw * 0.5,
        ph * 0.58,
        ph * 0.28,
        "#111315",
      );
    } else {
      drawLogoBox(
        ctx,
        team.logos.constructorBadge,
        team.shortCode,
        ox + pw * 0.5,
        ph * 0.56,
        pw * 0.62,
        ph * 0.28,
        0,
        isDarkHex(epBg) ? "#FFFFFF" : "#111417",
      );
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  tex.anisotropy = 4;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a 3-panel 3D Car-Space Orthographic Texture Atlas for PART_REAR_WING:
 * - Panel 0 [0..1/3]: Rear-facing Mainplane & DRS Flap (X: -0.47..+0.47, Y: 0.39..0.99)
 * - Panel 1 [1/3..2/3]: LEFT Endplate (+X)
 * - Panel 2 [2/3..1]: RIGHT Endplate (-X)
 */
export function createRearWingCarSpaceAtlas(
  team: Team2026Spec,
  panelSize = 512,
  variantId?: LiveryVariantId,
): THREE.CanvasTexture {
  const pw = Math.max(256, panelSize);
  const ph = pw;
  const [canvas, ctx] = makeCanvas(pw * 3, ph);
  const zp = team.zonePaint;
  const isCadillacDebut =
    team.id === "cadillac" && variantId === "cadillac-debut-2026";

  // Panel 0: Mainplane & DRS Flap
  const mainBg = team.id === "alpine" ? "#F17EB6" : zp.wing;
  drawCarbonFill(ctx, 0, 0, pw, ph, mainBg);
  if (team.id === "haas") {
    ctx.fillStyle = "#E8E9E6";
    ctx.fillRect(0, ph * 0.08, pw, ph * 0.24);
    ctx.fillStyle = "#D51C2D";
    ctx.fillRect(0, ph * 0.32, pw, ph * 0.06);
  }

  if (team.id === "cadillac" && !isCadillacDebut) {
    // cadillac-current-belgium-rear.png: crisp USA lettering across dark rear wing
    drawStylizedText(ctx, "U S A", pw * 0.5, ph * 0.24, ph * 0.16, "#EDECE8");
  } else if (team.id === "audi") {
    drawLogoBox(
      ctx,
      { key: "audi", tone: "red" },
      "AUDI",
      pw * 0.5,
      ph * 0.24,
      pw * 0.72,
      ph * 0.24,
      0,
      "#F02B22",
    );
  } else if (team.id === "williams") {
    drawLogoBox(
      ctx,
      { key: "atlassian", tone: "light" },
      "ATLASSIAN",
      pw * 0.5,
      ph * 0.24,
      pw * 0.78,
      ph * 0.22,
    );
  } else {
    drawLogoBox(
      ctx,
      team.logos.rearWingMark,
      team.wordmark,
      pw * 0.5,
      ph * 0.24,
      pw * 0.78,
      ph * 0.24,
      0,
      isDarkHex(mainBg) ? "#FFFFFF" : "#111417",
    );
  }

  // Panel 1 & 2: Left & Right Outer Endplates
  for (const col of [1, 2]) {
    const ox = col * pw;
    let epBg = zp.wing;
    if (team.id === "mclaren") {
      // mclaren-launch-06.webp: Papaya upper half (Dropbox black), dark carbon lower half (groq white)
      ctx.fillStyle = "#15191C";
      ctx.fillRect(ox, 0, pw, ph);
      ctx.fillStyle = "#EF6E12";
      ctx.fillRect(ox, 0, pw, ph * 0.54);
      drawLogoBox(
        ctx,
        { key: "dropbox", tone: "dark" },
        "Dropbox",
        ox + pw * 0.5,
        ph * 0.28,
        pw * 0.76,
        ph * 0.22,
        0,
        "#111417",
      );
      drawStylizedText(
        ctx,
        "groq",
        ox + pw * 0.5,
        ph * 0.72,
        ph * 0.13,
        "#F7F6F1",
      );
      continue;
    }
    if (team.id === "williams") {
      // williams-launch-02.webp: Blue upper endplate (white KOMATSU) over White lower endplate
      ctx.fillStyle = "#F1F2F0";
      ctx.fillRect(ox, 0, pw, ph);
      ctx.fillStyle = "#1555BD";
      ctx.fillRect(ox, 0, pw, ph * 0.52);
      drawLogoBox(
        ctx,
        { key: "komatsu", tone: "light" },
        "KOMATSU",
        ox + pw * 0.5,
        ph * 0.26,
        pw * 0.78,
        ph * 0.2,
      );
      continue;
    }
    if (team.id === "alpine") epBg = "#F17EB6";
    else if (team.id === "haas") epBg = "#E8E9E6";
    else if (team.id === "aston-martin") epBg = "#075744";
    else if (team.id === "cadillac") {
      epBg = isCadillacDebut && col === 2 ? "#111315" : "#EDECE8";
    }

    ctx.fillStyle = epBg;
    ctx.fillRect(ox, 0, pw, ph);

    if (team.id === "alpine") {
      drawLogoBox(
        ctx,
        { key: "eni", tone: "dark" },
        "eni",
        ox + pw * 0.5,
        ph * 0.34,
        pw * 0.72,
        ph * 0.26,
        0,
        "#1B1D24",
      );
    } else if (team.id === "racing-bulls") {
      drawLogoBox(
        ctx,
        { key: "visa", tone: "light" },
        "VISA",
        ox + pw * 0.5,
        ph * 0.34,
        pw * 0.72,
        ph * 0.24,
      );
    } else if (team.id === "cadillac" && !isCadillacDebut) {
      // cadillac-current-belgium-side.jpg: bold black IFS on white rear-wing endplate
      drawStylizedText(
        ctx,
        "IFS",
        ox + pw * 0.5,
        ph * 0.32,
        ph * 0.26,
        "#111315",
      );
    } else if (team.id === "aston-martin") {
      drawStylizedText(
        ctx,
        "coinbase",
        ox + pw * 0.5,
        ph * 0.32,
        ph * 0.16,
        "#F3F6EA",
      );
    } else {
      drawLogoBox(
        ctx,
        team.logos.constructorBadge,
        team.shortCode,
        ox + pw * 0.5,
        ph * 0.34,
        pw * 0.6,
        ph * 0.28,
        0,
        isDarkHex(epBg) ? "#FFFFFF" : "#111417",
      );
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  tex.anisotropy = 4;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Injects a zero-recompile 3D car-local orthographic projection shader into a MeshStandardMaterial /
 * MeshPhysicalMaterial. Subsequent team switches only update `userData.carSpaceUniforms.uCarAtlas.value`.
 */
export function bindCarSpaceLiveryShader(
  material: THREE.MeshStandardMaterial,
  mode: CarSpaceProjectionMode,
  atlasTexture: THREE.Texture,
): void {
  const existing = material.userData.carSpaceUniforms as
    CarSpaceUniformBag | undefined;
  if (existing && material.userData.carSpaceMode === mode) {
    existing.uCarAtlas.value = atlasTexture;
    existing.uUseCarAtlas.value = 1;
    return;
  }

  const uniforms: CarSpaceUniformBag = {
    uCarAtlas: { value: atlasTexture },
    uUseCarAtlas: { value: 1 },
  };
  material.userData.carSpaceUniforms = uniforms;
  material.userData.carSpaceMode = mode;

  const fragmentLogic =
    mode === "body"
      ? `
        if (uUseCarAtlas > 0.5) {
          float zMin = ${FP04RB_BODY_BOUNDS.zMin.toFixed(3)};
          float zMax = ${FP04RB_BODY_BOUNDS.zMax.toFixed(3)};
          float zSpan = ${(FP04RB_BODY_BOUNDS.zMax - FP04RB_BODY_BOUNDS.zMin).toFixed(3)};
          float yMin = ${FP04RB_BODY_BOUNDS.yMin.toFixed(3)};
          float ySpan = ${(FP04RB_BODY_BOUNDS.yMax - FP04RB_BODY_BOUNDS.yMin).toFixed(3)};
          float xHalf = ${FP04RB_BODY_BOUNDS.xHalf.toFixed(3)};

          float isLeft = (vCarLocalPos.x + vCarLocalNormal.x * 0.04) >= 0.0 ? 1.0 : 0.0;
          float uLeft = clamp((zMax - vCarLocalPos.z) / zSpan, 0.002, 0.998);
          float uRight = clamp((vCarLocalPos.z - zMin) / zSpan, 0.002, 0.998);
          float vSide = clamp((vCarLocalPos.y - yMin) / ySpan, 0.002, 0.998);

          vec2 leftUv = vec2(uLeft / 3.0, vSide);
          vec2 rightUv = vec2((1.0 + uRight) / 3.0, vSide);
          vec2 sideUv = mix(rightUv, leftUv, isLeft);

          float uTop = clamp((vCarLocalPos.x + xHalf) / (2.0 * xHalf), 0.002, 0.998);
          float vTop = clamp((zMax - vCarLocalPos.z) / zSpan, 0.002, 0.998);
          vec2 topUv = vec2((2.0 + uTop) / 3.0, vTop);

          // Use Top View strongly on the upward nose deck (z > 1.15m) and flat horizontal cockpit/shoulder decks
          float noseBoost = smoothstep(0.95, 1.45, vCarLocalPos.z);
          float topThresholdLo = mix(0.74, 0.46, noseBoost);
          float topThresholdHi = mix(0.89, 0.68, noseBoost);
          float topWeight = smoothstep(topThresholdLo, topThresholdHi, vCarLocalNormal.y);
          // Keep vertical dorsal sharkfin & steep flanks purely in side projection
          float finKeepSide = 1.0 - smoothstep(0.45, 0.65, abs(vCarLocalNormal.x));
          topWeight *= mix(finKeepSide, 1.0, noseBoost * 0.6);

          vec3 sideCol = texture2D(uCarAtlas, sideUv).rgb;
          vec3 topCol = texture2D(uCarAtlas, topUv).rgb;
          diffuseColor.rgb = mix(sideCol, topCol, topWeight);
        }
      `
      : mode === "front-wing"
        ? `
        if (uUseCarAtlas > 0.5) {
          float zMin = ${FP04RB_FRONT_WING_BOUNDS.zMin.toFixed(3)};
          float zMax = ${FP04RB_FRONT_WING_BOUNDS.zMax.toFixed(3)};
          float zSpan = ${(FP04RB_FRONT_WING_BOUNDS.zMax - FP04RB_FRONT_WING_BOUNDS.zMin).toFixed(3)};
          float yMin = ${FP04RB_FRONT_WING_BOUNDS.yMin.toFixed(3)};
          float ySpan = ${(FP04RB_FRONT_WING_BOUNDS.yMax - FP04RB_FRONT_WING_BOUNDS.yMin).toFixed(3)};
          float xHalf = ${FP04RB_FRONT_WING_BOUNDS.xHalf.toFixed(3)};

          float uTop = clamp((vCarLocalPos.x + xHalf) / (2.0 * xHalf), 0.002, 0.998);
          float vTop = clamp((zMax - vCarLocalPos.z) / zSpan, 0.002, 0.998);
          vec2 topUv = vec2(uTop / 3.0, vTop);

          float isLeft = vCarLocalPos.x >= 0.0 ? 1.0 : 0.0;
          float outward = vCarLocalNormal.x * (isLeft > 0.5 ? 1.0 : -1.0);
          float uEpRaw = isLeft > 0.5
            ? clamp((zMax - vCarLocalPos.z) / zSpan, 0.002, 0.998)
            : clamp((vCarLocalPos.z - zMin) / zSpan, 0.002, 0.998);
          float uEp = outward >= 0.0 ? uEpRaw : 0.03;
          float vEp = clamp((vCarLocalPos.y - yMin) / ySpan, 0.002, 0.998);
          vec2 epUv = vec2(((isLeft > 0.5 ? 1.0 : 2.0) + uEp) / 3.0, vEp);

          float isEndplate = smoothstep(0.84, 0.92, abs(vCarLocalPos.x)) * smoothstep(0.35, 0.65, abs(vCarLocalNormal.x));
          diffuseColor.rgb = mix(texture2D(uCarAtlas, topUv).rgb, texture2D(uCarAtlas, epUv).rgb, isEndplate);
        }
      `
        : `
        if (uUseCarAtlas > 0.5) {
          float zMin = ${FP04RB_REAR_WING_BOUNDS.zMin.toFixed(3)};
          float zMax = ${FP04RB_REAR_WING_BOUNDS.zMax.toFixed(3)};
          float zSpan = ${(FP04RB_REAR_WING_BOUNDS.zMax - FP04RB_REAR_WING_BOUNDS.zMin).toFixed(3)};
          float yMin = ${FP04RB_REAR_WING_BOUNDS.yMin.toFixed(3)};
          float ySpan = ${(FP04RB_REAR_WING_BOUNDS.yMax - FP04RB_REAR_WING_BOUNDS.yMin).toFixed(3)};

          // Panel 0: Mainplane & DRS flap — readable left-to-right from both Rear (-Z) and Front 3/4 (+Z)
          float uRear = vCarLocalNormal.z < 0.0
            ? clamp((0.48 - vCarLocalPos.x) / 0.96, 0.002, 0.998)
            : clamp((vCarLocalPos.x + 0.48) / 0.96, 0.002, 0.998);
          float vRear = clamp((vCarLocalPos.y - yMin) / ySpan, 0.002, 0.998);
          vec2 rearUv = vec2(uRear / 3.0, vRear);

          // Panel 1 & 2: Outer endplate faces show logos right-way-round; inner faces sample clean paint strip (u=0.03)
          float isLeft = vCarLocalPos.x >= 0.0 ? 1.0 : 0.0;
          float outward = vCarLocalNormal.x * (isLeft > 0.5 ? 1.0 : -1.0);
          float uEpRaw = isLeft > 0.5
            ? clamp((zMax - vCarLocalPos.z) / zSpan, 0.002, 0.998)
            : clamp((vCarLocalPos.z - zMin) / zSpan, 0.002, 0.998);
          float uEp = outward >= 0.0 ? uEpRaw : 0.03;
          vec2 epUv = vec2(((isLeft > 0.5 ? 1.0 : 2.0) + uEp) / 3.0, vRear);

          float isEndplate = smoothstep(0.45, 0.50, abs(vCarLocalPos.x)) * smoothstep(0.32, 0.62, abs(vCarLocalNormal.x));
          diffuseColor.rgb = mix(texture2D(uCarAtlas, rearUv).rgb, texture2D(uCarAtlas, epUv).rgb, isEndplate);
        }
      `;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCarAtlas = uniforms.uCarAtlas;
    shader.uniforms.uUseCarAtlas = uniforms.uUseCarAtlas;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vCarLocalPos;\nvarying vec3 vCarLocalNormal;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvCarLocalPos = position;\nvCarLocalNormal = normalize(normal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vCarLocalPos;\nvarying vec3 vCarLocalNormal;\nuniform sampler2D uCarAtlas;\nuniform float uUseCarAtlas;",
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>\n${fragmentLogic}`,
      );
  };
  material.customProgramCacheKey = () => `fp04rb-car-space-livery-v1-${mode}`;
  material.needsUpdate = true;
}
