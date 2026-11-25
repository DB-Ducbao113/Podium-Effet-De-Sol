import * as THREE from "three";
import type { Fp04rbCarInstance } from "./fp04rbLoader";
import type { LiveryVariantId } from "./liveryPrdManifest2026";
import { getProcessedLogoCanvas, type LogoAssetKey } from "./teamLogos2026";
import type { Team2026Spec, TeamId, TeamLogoPlacementSpec } from "./teams2026";
import {
  bindCarSpaceLiveryShader,
  createBodyCarSpaceAtlas,
  createFrontWingCarSpaceAtlas,
  createRearWingCarSpaceAtlas,
} from "./carSpaceLiveryProjection";

export type BayRole = "bay-1" | "bay-2";

export interface LiveryTextureBundle {
  teamId: TeamId;
  bayRole: BayRole;
  carNumber: string;
  variantId: LiveryVariantId;
  mainBody: THREE.CanvasTexture;
  frontWing: THREE.CanvasTexture;
  rearWing: THREE.CanvasTexture;
  bodyCarSpaceAtlas: THREE.CanvasTexture;
  frontWingCarSpaceAtlas: THREE.CanvasTexture;
  rearWingCarSpaceAtlas: THREE.CanvasTexture;
  floor: THREE.CanvasTexture;
  mirrors: THREE.CanvasTexture;
  winglets: THREE.CanvasTexture;
  wheelCovers: THREE.CanvasTexture;
  carbonRoughness: THREE.CanvasTexture;
  dispose: () => void;
}

export interface LiveryZoneSummary {
  teamId: TeamId;
  bayRole: BayRole;
  carNumber: string;
  variantId: LiveryVariantId;
  asymmetricSplit: boolean;
  zones: {
    nose: { primary: string; secondary: string; accent: string };
    sidepodLeft: { primary: string; secondary: string; accent: string };
    sidepodRight: { primary: string; secondary: string; accent: string };
    engineCover: string;
    frontWing: string;
    rearWing: string;
    floor: string;
  };
  decals: Array<{
    id: string;
    slot: string;
    u: number;
    v: number;
    rotationRad: number;
    text: string;
    logoKey?: LogoAssetKey;
  }>;
}

export function resolveEffectiveVariantId(
  team: Team2026Spec,
  variantId?: LiveryVariantId,
): LiveryVariantId {
  if (team.id !== "cadillac") return "standard-2026";
  if (
    variantId === "cadillac-spa-2026" ||
    variantId === "cadillac-debut-2026"
  ) {
    return variantId;
  }
  return "cadillac-spa-2026";
}

export function isEffectiveAsymmetricSplit(
  team: Team2026Spec,
  variantId?: LiveryVariantId,
): boolean {
  if (team.id !== "cadillac") return team.asymmetricSplit;
  return resolveEffectiveVariantId(team, variantId) === "cadillac-debut-2026";
}

export function buildLiveryAtlasSummary(
  team: Team2026Spec,
  bayRole: BayRole,
  variantId?: LiveryVariantId,
): LiveryZoneSummary {
  const effectiveVariant = resolveEffectiveVariantId(team, variantId);
  const effectiveAsymmetric = isEffectiveAsymmetricSplit(
    team,
    effectiveVariant,
  );
  const carNumber =
    bayRole === "bay-1" ? team.carNumbers.bay1 : team.carNumbers.bay2;
  const zp = team.zonePaint;
  const sidepodLeft = {
    primary: zp.sidepod,
    secondary: zp.engineCover,
    accent: team.accentColor,
  };
  const sidepodRight = effectiveAsymmetric
    ? {
        primary: team.secondaryColor,
        secondary: team.primaryColor,
        accent: team.accentColor,
      }
    : sidepodLeft;

  return {
    teamId: team.id,
    bayRole,
    carNumber,
    variantId: effectiveVariant,
    asymmetricSplit: effectiveAsymmetric,
    zones: {
      nose: {
        primary: zp.nose,
        secondary: team.secondaryColor,
        accent: team.accentColor,
      },
      sidepodLeft,
      sidepodRight,
      engineCover: zp.engineCover,
      frontWing: zp.wing,
      rearWing: zp.wing,
      floor: "#15181C",
    },
    decals: [
      {
        id: "halo-mark",
        slot: "main_body_texture",
        u: 0.44,
        v: 0.16,
        rotationRad: 0,
        text: team.shortCode,
        logoKey: team.logos.constructorBadge.key,
      },
      {
        id: "sidepod-left",
        slot: "main_body_texture",
        u: 0.305,
        v: 0.495,
        rotationRad: Math.PI,
        text: team.wordmark,
        logoKey: team.logos.sidepodPrimary.key,
      },
      {
        id: "sidepod-right",
        slot: "main_body_texture",
        u: 0.305,
        v: 0.875,
        rotationRad: 0,
        text: team.wordmark,
        logoKey: (effectiveAsymmetric
          ? (team.logos.rightSidepodOverride ?? team.logos.sidepodPrimary)
          : team.logos.sidepodPrimary
        ).key,
      },
      {
        id: "cover-left-logo",
        slot: "main_body_texture",
        u: 0.215,
        v: 0.525,
        rotationRad: Math.PI,
        text: team.shortCode,
        logoKey: team.logos.engineCoverMark.key,
      },
      {
        id: "cover-right-logo",
        slot: "main_body_texture",
        u: 0.215,
        v: 0.845,
        rotationRad: 0,
        text: team.shortCode,
        logoKey: (effectiveAsymmetric
          ? (team.logos.rightEngineCoverOverride ?? team.logos.engineCoverMark)
          : team.logos.engineCoverMark
        ).key,
      },
      {
        id: "fin-left-num",
        slot: "main_body_texture",
        u: 0.135,
        v: 0.502,
        rotationRad: Math.PI,
        text: carNumber,
      },
      {
        id: "fin-right-num",
        slot: "main_body_texture",
        u: 0.135,
        v: 0.868,
        rotationRad: 0,
        text: carNumber,
      },
      {
        id: "front-wing-banner",
        slot: "front_wing_texture",
        u: 0.36,
        v: 0.46,
        rotationRad: -Math.PI / 2,
        text: team.wingBanner,
        logoKey: team.logos.frontWingMark.key,
      },
      {
        id: "rear-wing-flap",
        slot: "rear_wing_texture",
        u: 0.76,
        v: 0.49,
        rotationRad: -Math.PI / 2,
        text: team.wordmark,
        logoKey: team.logos.rearWingMark.key,
      },
    ],
  };
}

function makeCanvas(
  size: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("Unable to acquire Canvas2D context for livery composer");
  return [canvas, ctx];
}

function makeTextureFromCanvas(
  canvas: HTMLCanvasElement,
  srgb = true,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function drawCarbonWeaveRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  size: number,
): void {
  ctx.save();
  ctx.fillStyle = "#14171B";
  ctx.fillRect(x, y, w, h);
  const step = Math.max(4, Math.floor(size / 128));
  ctx.fillStyle = "rgba(255,255,255,0.036)";
  for (let py = y; py < y + h; py += step * 2) {
    for (let px = x; px < x + w; px += step * 2) {
      ctx.fillRect(px, py, step, step);
      ctx.fillRect(px + step, py + step, step, step);
    }
  }
  ctx.restore();
}

function contrastingOutline(fillHex: string): string {
  const clean = fillHex.replace("#", "");
  if (clean.length !== 6) return "#111417";
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma >= 0.48 ? "#111417" : "#F7F8FA";
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return true;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.46;
}

function drawOrientedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  rotationRad: number,
  fontPx: number,
  color: string,
  outlineColor?: string,
  maxWidth?: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.font = `900 ${fontPx}px "Inter", "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (outlineColor) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = Math.max(2, fontPx * 0.11);
    ctx.strokeText(text, 0, 0, maxWidth);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0, maxWidth);
  ctx.restore();
}

/**
 * Draws a transparent background-cutout logo onto the UV canvas with aspect ratio
 * preserved inside [boxW x boxH] at (cx, cy) rotated by rotationRad.
 * Falls back cleanly to drawOrientedText if logos have not yet finished decoding
 * (e.g. synchronous Vitest runs).
 */
function drawLogoOrFallbackText(
  ctx: CanvasRenderingContext2D,
  placement: TeamLogoPlacementSpec,
  fallbackText: string,
  cx: number,
  cy: number,
  rotationRad: number,
  boxW: number,
  boxH: number,
  fallbackTextColor: string,
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

  drawOrientedText(
    ctx,
    fallbackText,
    cx,
    cy,
    rotationRad,
    boxH * 0.62,
    fallbackTextColor,
    contrastingOutline(fallbackTextColor),
    boxW,
  );
}

function drawThreePointedStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    const rad = i % 2 === 0 ? r : r * 0.22;
    const px = cx + Math.cos(angle) * rad;
    const py = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAmgDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rw: number,
  rh: number,
  color: string,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - rh);
  ctx.lineTo(cx + rw, cy);
  ctx.lineTo(cx, cy + rh);
  ctx.lineTo(cx - rw, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Renders the authentic 2026 flank livery pattern for each of the 11 teams
 * calibrated against PRD v1.0 (Z01-Z11), STANDARD_2026_PAINT, and paintAtlas.ts.
 * In FP-04 RB's UV layout:
 * - u increases from rear sharkfin/engine-cover (u=0.02) forward to sidepod leading edge (u=0.60).
 * - On Left Flank (+X, flipVertical=true), v=0.39 is lower floor edge and v=0.59 is upper engine cover spine.
 * - On Right Flank (-X, flipVertical=false), v=0.97 is lower floor edge and v=0.77 is upper engine cover spine.
 */
function draw2026FlankPattern(
  ctx: CanvasRenderingContext2D,
  team: Team2026Spec,
  x: number,
  y: number,
  w: number,
  h: number,
  isLeftFlank: boolean,
  variantId?: LiveryVariantId,
): void {
  const zp = team.zonePaint;
  const effectiveAsymmetric = isEffectiveAsymmetricSplit(team, variantId);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Helper mapping normalized flank coordinates:
  // uNorm: 0.0 (rear tail) -> 1.0 (forward sidepod intake)
  // vHeight: 0.0 (bottom floor skirt) -> 1.0 (top engine cover dorsal ridge)
  const pt = (uNorm: number, vHeight: number): [number, number] => [
    x + uNorm * w,
    isLeftFlank ? y + vHeight * h : y + (1 - vHeight) * h,
  ];
  const fillPoly = (color: string, coords: Array<[number, number]>) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    coords.forEach(([uN, vH], idx) => {
      const [px, py] = pt(uN, vH);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
  };

  switch (team.id) {
    case "mclaren": {
      // MCL40 (§3.1): Anthracite #15191C sidepod & engine cover, papaya #EF6E12 forward shoulder,
      // dedicated DP World #253796 blue box under forward shoulder, compact teal #2193AE airbox shoulder,
      // and small papaya rear wedge separated from floor by dark lower skirt.
      fillPoly(zp.sidepod, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // Papaya forward cockpit shoulder & upper intake sweep
      fillPoly(zp.nose, [
        [0.52, 0.58],
        [1.0, 0.44],
        [1.0, 1.0],
        [0.56, 1.0],
      ]);
      // Dedicated DP World #253796 blue box below forward papaya shoulder
      fillPoly(zp.detail, [
        [0.7, 0.22],
        [0.96, 0.24],
        [0.96, 0.41],
        [0.7, 0.39],
      ]);
      // Small papaya rear wedge ahead of rear wheel (kept above vH=0.12 dark floor skirt)
      fillPoly(zp.nose, [
        [0.02, 0.12],
        [0.32, 0.12],
        [0.22, 0.42],
        [0.02, 0.42],
      ]);
      // Compact teal #2193AE airbox shoulder highlight (Z05 only — not dragged across engine cover)
      fillPoly("#2193AE", [
        [0.32, 0.78],
        [0.54, 0.78],
        [0.51, 0.97],
        [0.29, 0.97],
      ]);
      break;
    }

    case "ferrari": {
      // SF-26 (§3.2): Iconic Rosso Corsa #D9182B sidepods & lower body with warm white #F2F0EB
      // cockpit shoulder wrap & upper engine cover hood (HP zone)
      fillPoly(zp.sidepod, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // White SF-26 upper engine cover & cockpit shoulder collar (HP zone: nx in [0.06..0.54])
      fillPoly(zp.engineCover, [
        [0.08, 0.58],
        [0.54, 0.64],
        [0.5, 1.0],
        [0.04, 1.0],
      ]);
      // Giallo Modena yellow pin-stripe separating white upper engine cover from Rosso sidepod
      fillPoly(team.accentColor, [
        [0.08, 0.53],
        [0.55, 0.59],
        [0.54, 0.64],
        [0.08, 0.58],
      ]);
      break;
    }

    case "mercedes": {
      // Stealth Obsidian Black #0A0D10 full body with vibrant PETRONAS #00D2BE aero sweep & silver stars
      fillPoly("#0A0D10", [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // Petronas emerald-teal sweep rising along sidepod shoulder
      fillPoly("#00A19C", [
        [0.14, 0.32],
        [0.54, 0.42],
        [0.96, 0.26],
        [0.96, 0.35],
        [0.54, 0.5],
        [0.14, 0.4],
      ]);
      fillPoly("#00D2BE", [
        [0.14, 0.35],
        [0.54, 0.45],
        [0.96, 0.29],
        [0.96, 0.325],
        [0.54, 0.475],
        [0.14, 0.375],
      ]);
      // Subtle metallic silver AMG diamonds on obsidian shoulder
      for (let idx = 0; idx < 3; idx++) {
        const [dx, dy] = pt(0.52 + idx * 0.075, 0.66 - idx * 0.03);
        drawAmgDiamond(
          ctx,
          dx,
          dy,
          Math.max(4, w * 0.014),
          Math.max(3, h * 0.028),
          "rgba(216, 226, 230, 0.68)",
        );
      }
      // Repeating Mercedes 3-pointed stars across obsidian rear engine cover
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          const [sx, sy] = pt(
            0.08 + r * 0.075 + (c % 2) * 0.025,
            0.58 + c * 0.13,
          );
          drawThreePointedStar(
            ctx,
            sx,
            sy,
            Math.max(4, w * 0.011),
            "rgba(244, 250, 249, 0.62)",
          );
        }
      }
      break;
    }

    case "red-bull": {
      // RB22 (§3.4): Glossy deep blue #14306E body with darker #101A3D lower undercut and yellow/red sun-and-bulls dorsal glow
      fillPoly(zp.sidepod, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // Deep navy floor undercut
      fillPoly(zp.lowerFlank, [
        [0, 0],
        [1, 0],
        [1, 0.24],
        [0, 0.28],
      ]);
      // Golden sun arc on upper engine cover behind airbox
      fillPoly(zp.detail, [
        [0.18, 0.68],
        [0.46, 0.72],
        [0.44, 1.0],
        [0.16, 1.0],
      ]);
      // Red bull charge slash
      fillPoly(team.accentColor, [
        [0.14, 0.58],
        [0.54, 0.64],
        [0.5, 0.73],
        [0.12, 0.66],
      ]);
      break;
    }

    case "racing-bulls": {
      // VCARB 03 (§3.5): Large bright white #ECF0EE field for blue VISA & high red charging bull,
      // framed by two blue bands (#1C4AA9 aft tail/upper border and #163F9B lower band)
      fillPoly(zp.sidepod, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // Upper/aft #1C4AA9 blue engine-cover tail & dorsal border (leaving [0.24..0.52, 0.56..0.88] white for red bull!)
      fillPoly(zp.engineCover, [
        [0.0, 0.0],
        [0.24, 0.0],
        [0.28, 0.86],
        [0.88, 0.86],
        [0.88, 1.0],
        [0.0, 1.0],
      ]);
      // Lower #163F9B blue sidepod contour band above dark floor skirt
      fillPoly(zp.lowerFlank, [
        [0.0, 0.0],
        [0.95, 0.0],
        [0.95, 0.23],
        [0.0, 0.3],
      ]);
      // Red #D93439 diagonal accent slash separating white sidepod from blue tail
      fillPoly(team.accentColor, [
        [0.22, 0.26],
        [0.27, 0.26],
        [0.32, 0.84],
        [0.27, 0.84],
      ]);
      break;
    }

    case "aston-martin": {
      // AMR26 (§3.6): Satin Racing Green #075744 body with dark #11221F undercut & spine and fine lime #BFD82C pinstripe
      fillPoly(zp.sidepod, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // Dark green-black lower undercut
      fillPoly(zp.lowerFlank, [
        [0, 0],
        [1, 0],
        [1, 0.25],
        [0, 0.31],
      ]);
      // Fine lime #BFD82C body contour line running cleanly below aramco wordmark
      fillPoly(zp.detail, [
        [0.06, 0.33],
        [0.96, 0.27],
        [0.96, 0.32],
        [0.06, 0.38],
      ]);
      break;
    }

    case "alpine": {
      // A526 (§3.7): Alpine Blue #095FB1 sidepod & engine cover with BWT Pink #F17EB6 forward shoulder taper & dark #1B1D24 lower skirt
      fillPoly(zp.sidepod, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // BWT Pink forward shoulder contour tapering down into cockpit shoulder
      fillPoly(zp.nose, [
        [0.54, 0.56],
        [1.0, 0.36],
        [1.0, 0.86],
        [0.58, 0.92],
      ]);
      // Dark carbon lower skirt
      fillPoly(zp.lowerFlank, [
        [0, 0],
        [1, 0],
        [1, 0.22],
        [0, 0.26],
      ]);
      break;
    }

    case "williams": {
      // FW48 (§3.8): Three-tier flank — gloss blue #1555BD upper engine cover, cyan #30A5D2 Barclays mid-sidepod,
      // white #F1F2F0 lower rear Komatsu panel ahead of rear wheel, and red-white #D32E37 heritage border
      fillPoly(zp.engineCover, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // Cyan #30A5D2 Barclays mid-sidepod shoulder contour
      fillPoly(zp.sidepod, [
        [0.34, 0.24],
        [0.92, 0.22],
        [0.92, 0.62],
        [0.36, 0.65],
      ]);
      // White #F1F2F0 lower rear Komatsu panel ahead of rear wheel
      fillPoly(zp.lowerFlank, [
        [0.04, 0.1],
        [0.34, 0.1],
        [0.32, 0.42],
        [0.04, 0.44],
      ]);
      // Heritage red-white (#D32E37 + #F1F2F0) border line
      fillPoly(team.accentColor, [
        [0.04, 0.44],
        [0.34, 0.42],
        [0.92, 0.62],
        [0.92, 0.66],
        [0.34, 0.46],
        [0.04, 0.48],
      ]);
      fillPoly("#F1F2F0", [
        [0.34, 0.65],
        [0.92, 0.66],
        [0.92, 0.69],
        [0.34, 0.68],
      ]);
      break;
    }

    case "haas": {
      // VF-26 (§3.9): White #E8E9E6 sidepod & forward body with wide rising red #D51C2D sweep behind cockpit
      // bordered by black #141719 band (keeping airbox intake separate)
      fillPoly(zp.sidepod, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // Rising black #141719 inner/lower border sweep
      fillPoly(zp.lowerFlank, [
        [0.0, 0.36],
        [0.96, 0.19],
        [0.96, 0.3],
        [0.0, 0.5],
      ]);
      // Wide rising red #D51C2D engine-cover sweep behind cockpit (stopping at uN=0.50 before airbox mouth)
      fillPoly(zp.engineCover, [
        [0.0, 0.52],
        [0.5, 0.62],
        [0.44, 0.96],
        [0.0, 0.96],
      ]);
      // Upper black #141719 dorsal wedge
      fillPoly(zp.lowerFlank, [
        [0.0, 0.8],
        [0.32, 0.85],
        [0.26, 1.0],
        [0.0, 1.0],
      ]);
      break;
    }

    case "audi": {
      // R26 (§3.10): Titanium #AEB2B1 forward sidepod, bold Lava Red #D92D35 rear sidepod block,
      // and exposed carbon #111315 upper engine cover
      fillPoly(zp.sidepod, [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]);
      // Exposed carbon #111315 upper engine cover
      fillPoly(zp.engineCover, [
        [0.0, 0.54],
        [0.54, 0.58],
        [0.5, 1.0],
        [0.0, 1.0],
      ]);
      // Bold Lava Red #D92D35 rear sidepod block (not a thin stripe)
      fillPoly(zp.detail, [
        [0.0, 0.12],
        [0.38, 0.12],
        [0.48, 0.56],
        [0.0, 0.54],
      ]);
      break;
    }

    case "cadillac": {
      if (!effectiveAsymmetric) {
        // Belgian GP (Spa · Default P6 §3.11): Warm White #EDECE8 upper body and Black #111315 lower body
        // on BOTH physical left and right flanks with stepped elevation contour across front shoulder, sidepod, and rear taper.
        fillPoly(zp.sidepod, [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]);
        // Black #111315 lower body on both flanks with stepped elevation boundary
        fillPoly(team.secondaryColor, [
          [0.0, 0.0],
          [1.0, 0.0],
          [1.0, 0.34],
          [0.64, 0.34],
          [0.54, 0.4],
          [0.24, 0.4],
          [0.14, 0.3],
          [0.0, 0.3],
        ]);
        // Silver-gray #BCC0BF stepped transition pinstripe
        fillPoly(zp.detail, [
          [0.0, 0.3],
          [0.14, 0.3],
          [0.24, 0.4],
          [0.54, 0.4],
          [0.64, 0.34],
          [1.0, 0.34],
          [1.0, 0.375],
          [0.64, 0.375],
          [0.54, 0.435],
          [0.24, 0.435],
          [0.14, 0.335],
          [0.0, 0.335],
        ]);
      } else {
        // Debut Launch Variant (§3.11): physical Left is Pearl White #EDECE8 with silver-gray lower sweep;
        // physical Right is Obsidian Black #111315 with dark graphite contour.
        const baseColor = isLeftFlank ? zp.sidepod : team.secondaryColor;
        const contourColor = isLeftFlank ? zp.detail : "#1E2228";
        fillPoly(baseColor, [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]);
        fillPoly(contourColor, [
          [0.08, 0.18],
          [0.88, 0.18],
          [0.84, 0.34],
          [0.08, 0.36],
        ]);
      }
      break;
    }
  }

  ctx.restore();
}

function drawNeutralPanelShading(
  ctx: CanvasRenderingContext2D,
  size: number,
  strength: number,
): void {
  ctx.save();
  if (typeof ctx.createLinearGradient === "function") {
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, `rgba(0, 0, 0, ${strength * 0.65})`);
    grad.addColorStop(0.5, "rgba(0, 0, 0, 0)");
    grad.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.fillStyle = `rgba(0, 0, 0, ${strength * 0.35})`;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.restore();
}

function multiplyAo(
  ctx: CanvasRenderingContext2D,
  _aoKey: string,
  size: number,
  strength = 0.08,
): void {
  drawNeutralPanelShading(ctx, size, strength);
}

function paintMainBodyAtlas(
  team: Team2026Spec,
  carNumber: string,
  size: number,
  variantId?: LiveryVariantId,
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size);
  const zp = team.zonePaint;
  const effectiveAsymmetric = isEffectiveAsymmetricSplit(team, variantId);

  // Base twill carbon weave across the whole UV sheet
  drawCarbonWeaveRect(ctx, 0, 0, size, size, size);

  // 1. Halo wishbone upper band (Z04: u in [0.05..0.84], v in [0.02..0.24])
  ctx.fillStyle = zp.halo;
  ctx.fillRect(size * 0.04, size * 0.02, size * 0.82, size * 0.22);
  ctx.fillStyle = team.accentColor;
  ctx.fillRect(size * 0.12, size * 0.095, size * 0.68, size * 0.024);

  const haloTextTone = isDarkHex(zp.halo) ? "#F4F6F9" : "#111417";
  drawLogoOrFallbackText(
    ctx,
    team.logos.constructorBadge,
    team.shortCode,
    size * 0.44,
    size * 0.16,
    0,
    size * 0.14,
    size * 0.065,
    haloTextTone,
  );

  // 2. Nose & Monocoque Upper Deck (Z02-Z03 & Z11: u in [0.66..0.99], v in [0.36..0.98])
  ctx.fillStyle = zp.nose;
  ctx.fillRect(size * 0.66, size * 0.36, size * 0.33, size * 0.62);
  if (effectiveAsymmetric) {
    ctx.fillStyle = team.secondaryColor;
    ctx.fillRect(size * 0.66, size * 0.684, size * 0.33, size * 0.296);
    ctx.fillStyle = team.accentColor;
    ctx.fillRect(size * 0.66, size * 0.674, size * 0.33, size * 0.02);
  } else if (team.id === "ferrari") {
    // SF-26 clean white + Giallo Modena nose centerline stripe (keeping [0.66..0.72] sidepod-inlet islands pure Rosso Corsa)
    ctx.fillStyle = zp.engineCover;
    ctx.fillRect(size * 0.73, size * 0.67, size * 0.23, size * 0.028);
    ctx.fillStyle = team.accentColor;
    ctx.fillRect(size * 0.73, size * 0.679, size * 0.23, size * 0.01);
  } else if (team.id === "red-bull") {
    // RB22 yellow nose cone tip
    ctx.fillStyle = zp.detail;
    ctx.fillRect(size * 0.88, size * 0.58, size * 0.11, size * 0.21);
    ctx.fillStyle = team.accentColor;
    ctx.fillRect(size * 0.72, size * 0.668, size * 0.16, size * 0.032);
  } else if (team.id === "alpine") {
    // A526 blue central blade breaking the BWT pink nose
    ctx.fillStyle = zp.sidepod;
    ctx.fillRect(size * 0.68, size * 0.658, size * 0.28, size * 0.052);
  } else if (team.id === "aston-martin") {
    // AMR26 fine lime #BFD82C line starting on nose flank (§3.6)
    ctx.fillStyle = zp.detail;
    ctx.fillRect(size * 0.72, size * 0.56, size * 0.24, size * 0.014);
    ctx.fillRect(size * 0.72, size * 0.79, size * 0.24, size * 0.014);
  } else if (team.id === "racing-bulls") {
    // VCARB 03 blue #1C4AA9 lines running along nose flanks (§3.5)
    ctx.fillStyle = zp.engineCover;
    ctx.fillRect(size * 0.7, size * 0.55, size * 0.26, size * 0.02);
    ctx.fillRect(size * 0.7, size * 0.8, size * 0.26, size * 0.02);
  } else if (team.id === "haas") {
    // VF-26 dark spine lead-in & short red nose flank accent (§3.9)
    ctx.fillStyle = zp.lowerFlank;
    ctx.fillRect(size * 0.68, size * 0.666, size * 0.2, size * 0.036);
    ctx.fillStyle = zp.detail;
    ctx.fillRect(size * 0.76, size * 0.56, size * 0.16, size * 0.016);
    ctx.fillRect(size * 0.76, size * 0.79, size * 0.16, size * 0.016);
  } else {
    ctx.fillStyle = team.accentColor;
    ctx.fillRect(size * 0.72, size * 0.666, size * 0.24, size * 0.036);
    ctx.fillStyle = zp.detail;
    ctx.fillRect(size * 0.75, size * 0.676, size * 0.21, size * 0.016);
  }

  // Z02 Nose Tip Constructor Badge & Z11 Nose Driver Number
  const noseTextTone = isDarkHex(zp.nose) ? "#F7F8FA" : "#111417";
  drawLogoOrFallbackText(
    ctx,
    team.logos.noseMark,
    team.shortCode,
    size * 0.91,
    size * 0.683,
    -Math.PI / 2,
    size * 0.056,
    size * 0.044,
    noseTextTone,
  );
  drawOrientedText(
    ctx,
    carNumber,
    size * 0.79,
    size * 0.683,
    -Math.PI / 2,
    size * 0.034,
    noseTextTone,
    contrastingOutline(noseTextTone),
    size * 0.068,
  );
  if (team.id === "mclaren") {
    // §3.1 Workday candidate on right nose flank ahead of front wheel
    drawLogoOrFallbackText(
      ctx,
      { key: "workday", tone: "dark" },
      "WORKDAY",
      size * 0.83,
      size * 0.81,
      0,
      size * 0.075,
      size * 0.028,
      "#111417",
    );
  }

  // 3. Left Flank (+X): Sidepod & Engine Cover / Sharkfin (Z05-Z07: v in [0.39..0.60], u in [0.02..0.62])
  draw2026FlankPattern(
    ctx,
    team,
    size * 0.02,
    size * 0.39,
    size * 0.58,
    size * 0.2,
    true,
    variantId,
  );
  if (team.finish.carbonBlend !== "painted") {
    drawCarbonWeaveRect(
      ctx,
      size * 0.04,
      size * 0.396,
      size * 0.52,
      size * 0.022,
      size,
    );
  }

  const leftSidepodText = isDarkHex(zp.sidepod) ? "#F4F6F9" : "#111417";
  // Primary 2026 Sidepod Partner Logo (Tier 1: OKX, CEVA, PETRONAS, ORACLE, VISA, ARAMCO, BWT, BARCLAYS, HAAS, REVOLUT, TWG AI)
  drawLogoOrFallbackText(
    ctx,
    team.logos.sidepodPrimary,
    team.wordmark,
    size * 0.315,
    team.id === "cadillac" && !effectiveAsymmetric
      ? size * 0.505
      : size * 0.488,
    Math.PI,
    size * 0.135,
    size * 0.052,
    leftSidepodText,
  );

  // Secondary Sidepod / Forward or Aft Partner Logo (Tier 2)
  if (team.logos.sidepodSecondary) {
    if (team.id === "williams") {
      // §3.8 FW48 Tier-3 lower-rear white panel: blue Komatsu ahead of rear wheel (non-overlapping with Barclays)
      drawLogoOrFallbackText(
        ctx,
        { key: "komatsu", tone: "blue" },
        "KOMATSU",
        size * 0.13,
        size * 0.442,
        Math.PI,
        size * 0.095,
        size * 0.034,
        "#1555BD",
      );
    } else if (team.id === "red-bull" || team.id === "racing-bulls") {
      // §3.4 & §3.5 Ford oval on rear lower engine cover ahead of rear tyre
      drawLogoOrFallbackText(
        ctx,
        { key: "ford", tone: "original" },
        "FORD",
        size * 0.11,
        size * 0.455,
        Math.PI,
        size * 0.072,
        size * 0.034,
        "#FFFFFF",
      );
    } else if (team.id === "mercedes") {
      // §3.3 Microsoft positioned lower/aft of 3-pointed star cluster on engine cover
      drawLogoOrFallbackText(
        ctx,
        { key: "microsoft", tone: "original" },
        "MICROSOFT",
        size * 0.16,
        size * 0.495,
        Math.PI,
        size * 0.082,
        size * 0.032,
        "#F4FAF9",
      );
    } else {
      drawLogoOrFallbackText(
        ctx,
        team.logos.sidepodSecondary,
        team.shortCode,
        size * 0.425,
        size * 0.488,
        Math.PI,
        size * 0.068,
        size * 0.044,
        leftSidepodText,
      );
    }
  }

  // Team-specific PRD Tier-2/Tier-3 flank marks (Left Flank)
  if (team.id === "mclaren") {
    // §3.1 Allwyn on teal airbox shoulder, DP World in #253796 blue front box, orange Speedmark on low dark shroud
    drawLogoOrFallbackText(
      ctx,
      { key: "allwyn", tone: "light" },
      "ALLWYN",
      size * 0.26,
      size * 0.562,
      Math.PI,
      size * 0.072,
      size * 0.026,
      "#F7F6F1",
    );
    drawLogoOrFallbackText(
      ctx,
      { key: "dpWorld", tone: "light" },
      "DP WORLD",
      size * 0.5,
      size * 0.452,
      Math.PI,
      size * 0.075,
      size * 0.026,
      "#F7F6F1",
    );
    drawLogoOrFallbackText(
      ctx,
      { key: "mclaren", tone: "papaya" },
      "MCL",
      size * 0.41,
      size * 0.435,
      Math.PI,
      size * 0.046,
      size * 0.028,
      "#EF6E12",
    );
  } else if (team.id === "ferrari") {
    // §3.2 Scuderia shield ahead of cockpit + UniCredit on upper rear red flank
    drawLogoOrFallbackText(
      ctx,
      { key: "ferrari", tone: "original" },
      "SF",
      size * 0.485,
      size * 0.525,
      Math.PI,
      size * 0.038,
      size * 0.038,
      "#FFE045",
    );
    drawLogoOrFallbackText(
      ctx,
      { key: "unicredit", tone: "light" },
      "UNICREDIT",
      size * 0.165,
      size * 0.478,
      Math.PI,
      size * 0.082,
      size * 0.028,
      "#FFFFFF",
    );
  }

  // Upper Engine Cover Constructor / Title Logo (Tier 1: HP on Ferrari white cover, Red Bull Sun+Bulls, Gemini, Audi Rings, Eni, Atlassian, TGR, Cadillac Crest)
  const leftCoverText = isDarkHex(zp.engineCover) ? "#F4F6F9" : "#111417";
  drawLogoOrFallbackText(
    ctx,
    team.logos.engineCoverMark,
    team.shortCode,
    team.id === "racing-bulls" ? size * 0.25 : size * 0.22,
    size * 0.538,
    Math.PI,
    size * 0.095,
    size * 0.048,
    leftCoverText,
  );

  // Left Rear Flank Driver Number (Z11)
  drawOrientedText(
    ctx,
    carNumber,
    size * 0.09,
    size * 0.502,
    Math.PI,
    size * 0.036,
    "#FFFFFF",
    "#111417",
    size * 0.072,
  );

  // 4. Right Flank (-X): Sidepod & Engine Cover / Sharkfin (Z05-Z07: v in [0.76..0.97], u in [0.02..0.62])
  draw2026FlankPattern(
    ctx,
    team,
    size * 0.02,
    size * 0.77,
    size * 0.58,
    size * 0.2,
    false,
    variantId,
  );
  if (team.finish.carbonBlend !== "painted") {
    drawCarbonWeaveRect(
      ctx,
      size * 0.04,
      size * 0.942,
      size * 0.52,
      size * 0.022,
      size,
    );
  }

  const rightSidepodBg = effectiveAsymmetric ? team.secondaryColor : zp.sidepod;
  const rightSidepodText = isDarkHex(rightSidepodBg) ? "#F4F6F9" : "#111417";
  const rightSidepodLogo = effectiveAsymmetric
    ? (team.logos.rightSidepodOverride ?? team.logos.sidepodPrimary)
    : team.logos.sidepodPrimary;

  drawLogoOrFallbackText(
    ctx,
    rightSidepodLogo,
    team.wordmark,
    size * 0.315,
    team.id === "cadillac" && !effectiveAsymmetric
      ? size * 0.865
      : size * 0.882,
    0,
    size * 0.135,
    size * 0.052,
    rightSidepodText,
  );

  if (team.logos.sidepodSecondary) {
    if (team.id === "williams") {
      // §3.8 Blue Komatsu on white lower-rear panel ahead of rear wheel
      drawLogoOrFallbackText(
        ctx,
        { key: "komatsu", tone: "blue" },
        "KOMATSU",
        size * 0.13,
        size * 0.918,
        0,
        size * 0.095,
        size * 0.034,
        "#1555BD",
      );
    } else if (team.id === "red-bull" || team.id === "racing-bulls") {
      // §3.4 & §3.5 Ford oval on rear lower engine cover ahead of rear tyre
      drawLogoOrFallbackText(
        ctx,
        { key: "ford", tone: "original" },
        "FORD",
        size * 0.11,
        size * 0.905,
        0,
        size * 0.072,
        size * 0.034,
        "#FFFFFF",
      );
    } else if (team.id === "mercedes") {
      // §3.3 Microsoft lower/aft of 3-pointed star cluster
      drawLogoOrFallbackText(
        ctx,
        { key: "microsoft", tone: "original" },
        "MICROSOFT",
        size * 0.16,
        size * 0.865,
        0,
        size * 0.082,
        size * 0.032,
        "#F4FAF9",
      );
    } else {
      drawLogoOrFallbackText(
        ctx,
        team.logos.sidepodSecondary,
        team.shortCode,
        size * 0.425,
        size * 0.882,
        0,
        size * 0.068,
        size * 0.044,
        rightSidepodText,
      );
    }
  }

  // Team-specific PRD Tier-2/Tier-3 flank marks (Right Flank)
  if (team.id === "mclaren") {
    // §3.1 Three-tier right profile: Allwyn on teal airbox shoulder, Dell Technologies lower rear below Gemini,
    // DP World in #253796 blue box, Cisco on papaya cockpit shoulder, orange Speedmark on low dark shroud
    drawLogoOrFallbackText(
      ctx,
      { key: "allwyn", tone: "light" },
      "ALLWYN",
      size * 0.26,
      size * 0.798,
      0,
      size * 0.072,
      size * 0.026,
      "#F7F6F1",
    );
    drawLogoOrFallbackText(
      ctx,
      { key: "dell", tone: "light" },
      "DELL",
      size * 0.15,
      size * 0.888,
      0,
      size * 0.074,
      size * 0.028,
      "#F7F6F1",
    );
    drawLogoOrFallbackText(
      ctx,
      { key: "dpWorld", tone: "light" },
      "DP WORLD",
      size * 0.5,
      size * 0.908,
      0,
      size * 0.075,
      size * 0.026,
      "#F7F6F1",
    );
    drawLogoOrFallbackText(
      ctx,
      { key: "cisco", tone: "dark" },
      "CISCO",
      size * 0.48,
      size * 0.815,
      0,
      size * 0.058,
      size * 0.026,
      "#111417",
    );
    drawLogoOrFallbackText(
      ctx,
      { key: "mclaren", tone: "papaya" },
      "MCL",
      size * 0.41,
      size * 0.925,
      0,
      size * 0.046,
      size * 0.028,
      "#EF6E12",
    );
  } else if (team.id === "ferrari") {
    // §3.2 Scuderia shield ahead of cockpit + UniCredit on upper rear red flank
    drawLogoOrFallbackText(
      ctx,
      { key: "ferrari", tone: "original" },
      "SF",
      size * 0.485,
      size * 0.835,
      0,
      size * 0.038,
      size * 0.038,
      "#FFE045",
    );
    drawLogoOrFallbackText(
      ctx,
      { key: "unicredit", tone: "light" },
      "UNICREDIT",
      size * 0.165,
      size * 0.882,
      0,
      size * 0.082,
      size * 0.028,
      "#FFFFFF",
    );
  }

  const rightCoverBg = effectiveAsymmetric
    ? team.secondaryColor
    : zp.engineCover;
  const rightCoverText = isDarkHex(rightCoverBg) ? "#F4F6F9" : "#111417";
  const rightCoverLogo = effectiveAsymmetric
    ? (team.logos.rightEngineCoverOverride ?? team.logos.engineCoverMark)
    : team.logos.engineCoverMark;

  drawLogoOrFallbackText(
    ctx,
    rightCoverLogo,
    team.shortCode,
    team.id === "racing-bulls" ? size * 0.25 : size * 0.22,
    size * 0.822,
    0,
    size * 0.095,
    size * 0.048,
    rightCoverText,
  );

  // Right Rear Flank Driver Number (Z11)
  drawOrientedText(
    ctx,
    carNumber,
    size * 0.09,
    size * 0.868,
    0,
    size * 0.036,
    "#FFFFFF",
    "#111417",
    size * 0.072,
  );

  multiplyAo(ctx, "main_body", size, 0.08);
  return canvas;
}

function paintFrontWingAtlas(
  team: Team2026Spec,
  size: number,
  variantId?: LiveryVariantId,
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size);
  const zp = team.zonePaint;
  const effectiveAsymmetric = isEffectiveAsymmetricSplit(team, variantId);
  drawCarbonWeaveRect(ctx, 0, 0, size, size, size);

  // Z01 Front Wing (§3.1-§3.11): distinct center section, outer cascade flaps, and L/R endplates
  let centerFlapColor = zp.wing;
  let outerFlapColor = zp.wing;
  if (team.id === "mclaren") {
    // §3.1 Dark anthracite center base with papaya #EF6E12 outer flaps
    centerFlapColor = zp.wing;
    outerFlapColor = zp.nose;
  } else if (team.id === "alpine") {
    // §3.7 BWT pink #F17EB6 center section with dark #1B1D24 outer flaps
    centerFlapColor = zp.nose;
    outerFlapColor = zp.lowerFlank;
  } else if (team.id === "williams" || team.id === "haas") {
    // §3.8 & §3.9 Dark base with white #F1F2F0 / #E8E9E6 outer boxes
    centerFlapColor = zp.wing;
    outerFlapColor = "#F1F2F0";
  } else if (team.id === "racing-bulls") {
    // §3.5 Blue #1C4AA9 and dark #161A25 split front wing
    centerFlapColor = zp.wing;
    outerFlapColor = "#161A25";
  } else if (team.id === "audi") {
    // §3.10 Titanium #AEB2B1 center detail with dark #111315 outboard flaps
    centerFlapColor = zp.nose;
    outerFlapColor = zp.wing;
  }

  ctx.fillStyle = centerFlapColor;
  ctx.fillRect(size * 0.02, size * 0.02, size * 0.36, size * 0.84);
  ctx.fillStyle = outerFlapColor;
  ctx.fillRect(size * 0.38, size * 0.04, size * 0.42, size * 0.82);
  ctx.fillStyle = team.accentColor;
  ctx.fillRect(size * 0.12, size * 0.02, size * 0.035, size * 0.84);
  ctx.fillRect(size * 0.76, size * 0.06, size * 0.04, size * 0.82);

  // Left/Right endplates (u in [0.80..0.98])
  ctx.fillStyle = zp.nose;
  ctx.fillRect(size * 0.82, size * 0.02, size * 0.16, size * 0.45);
  ctx.fillStyle = effectiveAsymmetric ? team.secondaryColor : zp.nose;
  ctx.fillRect(size * 0.82, size * 0.47, size * 0.16, size * 0.48);

  const wingTextColor = isDarkHex(centerFlapColor) ? "#F4F6F9" : "#111417";
  drawLogoOrFallbackText(
    ctx,
    team.logos.frontWingMark,
    team.wingBanner,
    size * 0.36,
    size * 0.46,
    -Math.PI / 2,
    size * 0.46,
    size * 0.12,
    wingTextColor,
  );
  drawLogoOrFallbackText(
    ctx,
    team.logos.constructorBadge,
    team.shortCode,
    size * 0.9,
    size * 0.25,
    -Math.PI / 2,
    size * 0.12,
    size * 0.1,
    isDarkHex(zp.nose) ? "#F4F6F9" : "#111417",
  );
  drawLogoOrFallbackText(
    ctx,
    team.logos.constructorBadge,
    team.shortCode,
    size * 0.9,
    size * 0.72,
    -Math.PI / 2,
    size * 0.12,
    size * 0.1,
    effectiveAsymmetric
      ? "#F4F6F9"
      : isDarkHex(zp.nose)
        ? "#F4F6F9"
        : "#111417",
  );

  multiplyAo(ctx, "front_wing", size, 0.08);
  return canvas;
}

function paintRearWingAtlas(
  team: Team2026Spec,
  size: number,
  variantId?: LiveryVariantId,
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size);
  const zp = team.zonePaint;
  const effectiveAsymmetric = isEffectiveAsymmetricSplit(team, variantId);
  drawCarbonWeaveRect(ctx, 0, 0, size, size, size);

  // Z09 Endplates (u in [0.08..0.62])
  const leftEndplateBg =
    team.id === "williams"
      ? zp.engineCover
      : team.id === "alpine"
        ? zp.nose
        : zp.wing;
  const rightEndplateBg = effectiveAsymmetric
    ? team.secondaryColor
    : leftEndplateBg;
  ctx.fillStyle = leftEndplateBg;
  ctx.fillRect(size * 0.08, size * 0.02, size * 0.54, size * 0.44);
  ctx.fillStyle = rightEndplateBg;
  ctx.fillRect(size * 0.08, size * 0.52, size * 0.54, size * 0.44);

  // Endplate accent stripes
  ctx.fillStyle = team.accentColor;
  ctx.fillRect(size * 0.12, size * 0.05, size * 0.05, size * 0.38);
  ctx.fillRect(size * 0.12, size * 0.55, size * 0.05, size * 0.38);

  // Upper DRS mainplane & flap (u in [0.66..0.96], v in [0.06..0.92])
  const flapFill = team.id === "alpine" ? zp.nose : zp.wing;
  ctx.fillStyle = flapFill;
  ctx.fillRect(size * 0.66, size * 0.06, size * 0.3, size * 0.86);
  if (team.id === "haas") {
    // §3.9 VF-26 rear wing combines dark base, two white zones and red accent
    ctx.fillStyle = "#E8E9E6";
    ctx.fillRect(size * 0.68, size * 0.08, size * 0.26, size * 0.18);
    ctx.fillRect(size * 0.68, size * 0.72, size * 0.26, size * 0.18);
  }
  ctx.fillStyle = team.accentColor;
  ctx.fillRect(size * 0.66, size * 0.06, size * 0.035, size * 0.86);

  const flapTextColor = isDarkHex(flapFill) ? "#F4F6F9" : "#111417";
  drawLogoOrFallbackText(
    ctx,
    team.logos.rearWingMark,
    team.wordmark,
    size * 0.81,
    size * 0.49,
    -Math.PI / 2,
    size * 0.58,
    size * 0.16,
    flapTextColor,
  );

  // PRD §3.1, §3.5, §3.7, §3.8 verified right endplate partner logos
  const endplateMark: TeamLogoPlacementSpec =
    team.id === "mclaren"
      ? { key: "dropbox", tone: "light" }
      : team.id === "racing-bulls"
        ? { key: "visa", tone: "light" }
        : team.id === "alpine"
          ? { key: "eni", tone: "dark" }
          : team.id === "williams"
            ? { key: "komatsu", tone: "light" }
            : team.logos.constructorBadge;

  drawLogoOrFallbackText(
    ctx,
    endplateMark,
    team.shortCode,
    size * 0.36,
    size * 0.24,
    0,
    size * 0.24,
    size * 0.12,
    isDarkHex(leftEndplateBg) ? "#F4F6F9" : "#111417",
  );
  drawLogoOrFallbackText(
    ctx,
    endplateMark,
    team.shortCode,
    size * 0.36,
    size * 0.74,
    0,
    size * 0.24,
    size * 0.12,
    isDarkHex(rightEndplateBg) ? "#F4F6F9" : "#111417",
  );

  multiplyAo(ctx, "rear_wing", size, 0.08);
  return canvas;
}

function paintFloorAtlas(team: Team2026Spec, size: number): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size);
  // Real 2026 F1 Venturi floors are exposed matte/satin carbon fibre (avoiding loud fake accent bands)
  drawCarbonWeaveRect(ctx, 0, 0, size, size, size);

  // Subtle floor-edge technical pinstripe only where authentic (e.g. Aston Martin lime, Mercedes teal, McLaren papaya)
  const floorAccent =
    team.id === "aston-martin"
      ? "#BFD82C"
      : team.id === "mercedes"
        ? "#00A19C"
        : "#242830";
  ctx.fillStyle = floorAccent;
  ctx.fillRect(size * 0.02, size * 0.315, size * 0.94, size * 0.01);
  ctx.fillRect(size * 0.02, size * 0.825, size * 0.94, size * 0.01);

  multiplyAo(ctx, "floor", size, 0.08);
  return canvas;
}

function drawRadialAeroSpokes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  count: number,
  color: string,
  lineWidth: number,
  phaseRad = 0,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  for (let i = 0; i < count; i += 1) {
    const a = phaseRad + (i * Math.PI * 2) / count;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
    ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSegmentedRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lineWidth: number,
  segments: ReadonlyArray<readonly [number, number, string]>,
): void {
  for (const [a0, a1, col] of segments) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.stroke();
    ctx.restore();
  }
}

function paintWheelCoverAtlas(
  team: Team2026Spec,
  size: number,
  variantId?: LiveryVariantId,
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size);
  const isCadillacSpa =
    team.id === "cadillac" && variantId !== "cadillac-debut-2026";
  const cx = size * 0.5;
  const cy = size * 0.5;

  // Deep satin carbon base shared across modern 18" F1 aero wheel covers
  drawCarbonWeaveRect(ctx, 0, 0, size, size, size);

  // Subtle recessed inner dish shading so the wheel cover reads with genuine 3D depth
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  switch (team.id) {
    case "mclaren": {
      // MCL40 Google Chrome 4-quadrant racing ring + papaya inner hub collar
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.16,
        size * 0.29,
        8,
        "rgba(255,255,255,0.09)",
        size * 0.012,
      );
      drawSegmentedRing(ctx, cx, cy, size * 0.355, size * 0.115, [
        [-Math.PI * 0.74, -Math.PI * 0.26, "#EA4335"],
        [-Math.PI * 0.24, Math.PI * 0.24, "#4285F4"],
        [Math.PI * 0.26, Math.PI * 0.74, "#34A853"],
        [Math.PI * 0.76, Math.PI * 1.24, "#FBBC05"],
      ]);
      // Crisp papaya precision inner hub ring
      ctx.save();
      ctx.strokeStyle = "#EF6E12";
      ctx.lineWidth = size * 0.022;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.195, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "ferrari": {
      // Scuderia Maranello Rosso Corsa outer speed-arcs + Modena Yellow precision hub ring + 5 turbine ribs
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.17,
        size * 0.31,
        5,
        "rgba(242, 240, 235, 0.24)",
        size * 0.02,
        -Math.PI * 0.5,
      );
      drawSegmentedRing(ctx, cx, cy, size * 0.36, size * 0.088, [
        [-Math.PI * 0.92, -Math.PI * 0.08, "#D9182B"],
        [Math.PI * 0.08, Math.PI * 0.92, "#D9182B"],
        [-Math.PI * 0.05, Math.PI * 0.05, "#FFE045"],
        [Math.PI * 0.95, Math.PI * 1.05, "#FFE045"],
      ]);
      ctx.save();
      ctx.strokeStyle = "#FFE045";
      ctx.lineWidth = size * 0.032;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.205, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "mercedes": {
      // Stealth Obsidian Black + vibrant PETRONAS emerald-teal outer ring + silver 3-pointed star spokes
      ctx.fillStyle = "#090C0F";
      ctx.fillRect(0, 0, size, size);
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.14,
        size * 0.34,
        3,
        "#D8E2E5",
        size * 0.028,
        -Math.PI * 0.5,
      );
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.22,
        size * 0.34,
        3,
        "rgba(0, 210, 190, 0.42)",
        size * 0.012,
        Math.PI * 0.5,
      );
      // Luminous Petronas emerald-teal outer aero rim ring
      ctx.save();
      ctx.strokeStyle = "#00D2BE";
      ctx.lineWidth = size * 0.072;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.37, 0, Math.PI * 2);
      ctx.stroke();
      // Fine silver inner hub halo
      ctx.strokeStyle = "#DCE5E8";
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "red-bull": {
      // Milton Keynes Midnight Navy-Carbon + Crimson Red outer speed arcs + Sun-Gold inner precision ring
      ctx.fillStyle = "#0D1A3B";
      ctx.fillRect(0, 0, size, size);
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.17,
        size * 0.33,
        6,
        "rgba(255, 255, 255, 0.14)",
        size * 0.018,
      );
      drawSegmentedRing(ctx, cx, cy, size * 0.365, size * 0.085, [
        [-Math.PI * 0.88, -Math.PI * 0.12, "#E32C31"],
        [Math.PI * 0.12, Math.PI * 0.88, "#E32C31"],
        [-Math.PI * 0.08, Math.PI * 0.08, "#FFCE00"],
        [Math.PI * 0.92, Math.PI * 1.08, "#FFCE00"],
      ]);
      ctx.save();
      ctx.strokeStyle = "#FFCE00";
      ctx.lineWidth = size * 0.036;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "racing-bulls": {
      // VCARB Faenza gloss white aero disc with cobalt blue outer bevel, 8 dark vents & red center ring
      ctx.fillStyle = "#EBF0F3";
      ctx.fillRect(0, 0, size, size);
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.22,
        size * 0.34,
        8,
        "rgba(22, 63, 155, 0.24)",
        size * 0.016,
      );
      ctx.save();
      ctx.strokeStyle = "#1C4AA9";
      ctx.lineWidth = size * 0.055;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.39, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#D93439";
      ctx.lineWidth = size * 0.052;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "aston-martin": {
      // Silverstone British Racing Green dish + iconic AMR Lime outer ring & 6 swept aero louvers
      ctx.fillStyle = "#063C30";
      ctx.fillRect(0, 0, size, size);
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.17,
        size * 0.34,
        6,
        "rgba(201, 223, 67, 0.34)",
        size * 0.016,
        Math.PI / 6,
      );
      ctx.save();
      ctx.strokeStyle = "#C9DF43";
      ctx.lineWidth = size * 0.072;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.37, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#E7F4A8";
      ctx.lineWidth = size * 0.022;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.195, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "alpine": {
      // Enstone Alpine Metallic Blue dish + BWT Pink dual-arc outer rim & pearl-white hub ring
      ctx.fillStyle = "#0A3E7A";
      ctx.fillRect(0, 0, size, size);
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.17,
        size * 0.33,
        5,
        "rgba(244, 241, 243, 0.24)",
        size * 0.018,
      );
      drawSegmentedRing(ctx, cx, cy, size * 0.365, size * 0.088, [
        [-Math.PI * 0.85, -Math.PI * 0.15, "#F17EB6"],
        [Math.PI * 0.15, Math.PI * 0.85, "#F17EB6"],
        [-Math.PI * 0.12, Math.PI * 0.12, "#1959C6"],
        [Math.PI * 0.88, Math.PI * 1.12, "#1959C6"],
      ]);
      ctx.save();
      ctx.strokeStyle = "#F4F1F3";
      ctx.lineWidth = size * 0.028;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "williams": {
      // Grove Royal Blue dish + vibrant Barclays Cyan outer speed-ring + heritage Red/White quarter ticks
      ctx.fillStyle = "#0F2F73";
      ctx.fillRect(0, 0, size, size);
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.17,
        size * 0.33,
        8,
        "rgba(241, 242, 240, 0.18)",
        size * 0.014,
      );
      drawSegmentedRing(ctx, cx, cy, size * 0.365, size * 0.085, [
        [-Math.PI * 0.85, -Math.PI * 0.15, "#30A5D2"],
        [Math.PI * 0.15, Math.PI * 0.85, "#30A5D2"],
        [-Math.PI * 0.12, Math.PI * 0.12, "#D32E37"],
        [Math.PI * 0.88, Math.PI * 1.12, "#F1F2F0"],
      ]);
      ctx.save();
      ctx.strokeStyle = "#F1F2F0";
      ctx.lineWidth = size * 0.024;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "haas": {
      // Haas TGR Tri-Color: carbon core + stark Pearl White & Gazoo Crimson opposing rim arcs
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.17,
        size * 0.33,
        6,
        "rgba(232, 233, 230, 0.2)",
        size * 0.016,
      );
      drawSegmentedRing(ctx, cx, cy, size * 0.365, size * 0.09, [
        [-Math.PI * 0.94, -Math.PI * 0.06, "#E8E9E6"],
        [Math.PI * 0.06, Math.PI * 0.94, "#D51C2D"],
      ]);
      ctx.save();
      ctx.strokeStyle = "#D51C2D";
      ctx.lineWidth = size * 0.032;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "audi": {
      // Audi Sport Neuburg: brushed Titanium-Carbon radial dish + bold Lava Red split ring + 4 silver bars
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.16,
        size * 0.33,
        4,
        "#C5C9C8",
        size * 0.026,
        Math.PI * 0.25,
      );
      drawSegmentedRing(ctx, cx, cy, size * 0.368, size * 0.086, [
        [-Math.PI * 0.72, -Math.PI * 0.28, "#F02B22"],
        [-Math.PI * 0.22, Math.PI * 0.22, "#AEB2B1"],
        [Math.PI * 0.28, Math.PI * 0.72, "#F02B22"],
        [Math.PI * 0.78, Math.PI * 1.22, "#AEB2B1"],
      ]);
      ctx.save();
      ctx.strokeStyle = "#F02B22";
      ctx.lineWidth = size * 0.026;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.195, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }

    case "cadillac": {
      // Cadillac MAC-26: Pearl White architectural outer ring (Spa) or brushed Platinum dual ring (Debut)
      drawRadialAeroSpokes(
        ctx,
        cx,
        cy,
        size * 0.16,
        size * 0.33,
        8,
        "rgba(237, 236, 232, 0.24)",
        size * 0.016,
      );
      ctx.save();
      ctx.strokeStyle = isCadillacSpa ? "#EDECE8" : "#BCC0BF";
      ctx.lineWidth = isCadillacSpa ? size * 0.125 : size * 0.078;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.358, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#BCC0BF";
      ctx.lineWidth = size * 0.026;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return canvas;
    }
  }
}

function paintSolidAccentAtlas(
  primary: string,
  accent: string,
  placement: TeamLogoPlacementSpec | null,
  label: string,
  size: number,
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size);
  drawCarbonWeaveRect(ctx, 0, 0, size, size, size);
  ctx.fillStyle = primary;
  ctx.fillRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);
  ctx.fillStyle = accent;
  ctx.fillRect(size * 0.06, size * 0.46, size * 0.88, size * 0.08);
  if (placement) {
    drawLogoOrFallbackText(
      ctx,
      placement,
      label,
      size * 0.5,
      size * 0.5,
      0,
      size * 0.52,
      size * 0.24,
      isDarkHex(primary) ? "#FFFFFF" : "#111417",
    );
  } else if (label) {
    drawOrientedText(
      ctx,
      label,
      size * 0.5,
      size * 0.5,
      0,
      size * 0.14,
      "#FFFFFF",
    );
  }
  return canvas;
}

function paintCarbonRoughnessAtlas(size = 256): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size);
  ctx.fillStyle = "#585858";
  ctx.fillRect(0, 0, size, size);
  const step = 8;
  for (let y = 0; y < size; y += step * 2) {
    for (let x = 0; x < size; x += step * 2) {
      ctx.fillStyle = "#6E6E6E";
      ctx.fillRect(x, y, step, step);
      ctx.fillRect(x + step, y + step, step, step);
    }
  }
  return canvas;
}

export function createTeamLiveryTextures(
  team: Team2026Spec,
  bayRole: BayRole,
  resolution = 1024,
  variantId?: LiveryVariantId,
): LiveryTextureBundle {
  const effectiveVariant = resolveEffectiveVariantId(team, variantId);
  const carNumber =
    bayRole === "bay-1" ? team.carNumbers.bay1 : team.carNumbers.bay2;
  const sideSize = Math.max(512, resolution);
  const wingSize = Math.max(256, resolution >> 1);
  const smallSize = 256;
  const zp = team.zonePaint;

  const mainBody = makeTextureFromCanvas(
    paintMainBodyAtlas(team, carNumber, sideSize, effectiveVariant),
  );
  const frontWing = makeTextureFromCanvas(
    paintFrontWingAtlas(team, wingSize, effectiveVariant),
  );
  const rearWing = makeTextureFromCanvas(
    paintRearWingAtlas(team, wingSize, effectiveVariant),
  );
  // True 3D Car-Space Multi-Angle Orthographic Atlases (zero UV seam sawtoothing)
  const bodyCarSpaceAtlas = createBodyCarSpaceAtlas(
    team,
    carNumber,
    sideSize,
    effectiveVariant,
  );
  const frontWingCarSpaceAtlas = createFrontWingCarSpaceAtlas(
    team,
    wingSize,
    effectiveVariant,
  );
  const rearWingCarSpaceAtlas = createRearWingCarSpaceAtlas(
    team,
    wingSize,
    effectiveVariant,
  );
  const floor = makeTextureFromCanvas(paintFloorAtlas(team, wingSize));
  const mirrors = makeTextureFromCanvas(
    paintSolidAccentAtlas(
      team.id === "ferrari"
        ? "#D9182B"
        : team.id === "mclaren"
          ? "#EF6E12"
          : team.id === "alpine"
            ? "#095FB1"
            : zp.nose,
      team.accentColor,
      null,
      "",
      smallSize,
    ),
  );
  const winglets = makeTextureFromCanvas(
    paintSolidAccentAtlas("#181B20", "#181B20", null, "", smallSize),
  );
  const wheelCovers = makeTextureFromCanvas(
    paintWheelCoverAtlas(team, 512, effectiveVariant),
  );
  const carbonRoughness = makeTextureFromCanvas(
    paintCarbonRoughnessAtlas(256),
    false,
  );

  return {
    teamId: team.id,
    bayRole,
    carNumber,
    variantId: effectiveVariant,
    mainBody,
    frontWing,
    rearWing,
    bodyCarSpaceAtlas,
    frontWingCarSpaceAtlas,
    rearWingCarSpaceAtlas,
    floor,
    mirrors,
    winglets,
    wheelCovers,
    carbonRoughness,
    dispose: () => {
      mainBody.dispose();
      frontWing.dispose();
      rearWing.dispose();
      bodyCarSpaceAtlas.dispose();
      frontWingCarSpaceAtlas.dispose();
      rearWingCarSpaceAtlas.dispose();
      floor.dispose();
      mirrors.dispose();
      winglets.dispose();
      wheelCovers.dispose();
      carbonRoughness.dispose();
    },
  };
}

function setPaintMaterialMap(
  materials: THREE.MeshStandardMaterial[] | undefined,
  tex: THREE.CanvasTexture,
  team: Team2026Spec,
  isFloor = false,
): void {
  if (!materials) return;
  for (const mat of materials) {
    mat.map = tex;
    mat.color.set("#FFFFFF");
    mat.metalness = isFloor ? 0.08 : team.finish.metalness;
    mat.roughness = isFloor ? 0.44 : team.finish.roughness;
    if (mat instanceof THREE.MeshPhysicalMaterial) {
      mat.clearcoat = isFloor ? 0.1 : team.finish.clearcoat;
      mat.clearcoatRoughness = isFloor ? 0.5 : team.finish.clearcoatRoughness;
    }
    mat.needsUpdate = true;
  }
}

export function applyLiveryInPlace(
  carInstance: Fp04rbCarInstance,
  team: Team2026Spec,
  bayRole: BayRole,
  resolution = 1024,
  variantId?: LiveryVariantId,
): LiveryTextureBundle {
  // Dispose previous dynamic textures cleanly before binding the next team's maps
  for (const prevTex of carInstance.ownedTextures) {
    prevTex.dispose();
  }
  carInstance.ownedTextures.length = 0;

  const bundle = createTeamLiveryTextures(team, bayRole, resolution, variantId);
  carInstance.ownedTextures.push(
    bundle.mainBody,
    bundle.frontWing,
    bundle.rearWing,
    bundle.bodyCarSpaceAtlas,
    bundle.frontWingCarSpaceAtlas,
    bundle.rearWingCarSpaceAtlas,
    bundle.floor,
    bundle.mirrors,
    bundle.winglets,
    bundle.wheelCovers,
    bundle.carbonRoughness,
  );

  const bodyMats = carInstance.paintMaterials.get("main_body_texture");
  setPaintMaterialMap(bodyMats, bundle.mainBody, team);
  if (bodyMats) {
    for (const mat of bodyMats) {
      bindCarSpaceLiveryShader(mat, "body", bundle.bodyCarSpaceAtlas);
    }
  }

  const fwMats = carInstance.paintMaterials.get("front_wing_texture");
  setPaintMaterialMap(fwMats, bundle.frontWing, team);
  if (fwMats) {
    for (const mat of fwMats) {
      bindCarSpaceLiveryShader(
        mat,
        "front-wing",
        bundle.frontWingCarSpaceAtlas,
      );
    }
  }

  const rwMats = carInstance.paintMaterials.get("rear_wing_texture");
  setPaintMaterialMap(rwMats, bundle.rearWing, team);
  if (rwMats) {
    for (const mat of rwMats) {
      bindCarSpaceLiveryShader(mat, "rear-wing", bundle.rearWingCarSpaceAtlas);
    }
  }
  setPaintMaterialMap(
    carInstance.paintMaterials.get("floor_texture"),
    bundle.floor,
    team,
    true,
  );
  setPaintMaterialMap(
    carInstance.paintMaterials.get("mirrors_texture"),
    bundle.mirrors,
    team,
  );
  setPaintMaterialMap(
    carInstance.paintMaterials.get("winglets_texture"),
    bundle.winglets,
    team,
  );
  setPaintMaterialMap(
    carInstance.paintMaterials.get("wheel_covers_texture"),
    bundle.wheelCovers,
    team,
  );
  setPaintMaterialMap(
    carInstance.paintMaterials.get("wheel_covers_texture.001"),
    bundle.wheelCovers,
    team,
  );

  // Align auxiliary source material slots (wing trims/edge accents) cleanly per team without leftover red strips
  const zp = team.zonePaint;
  const wingEdgeAccent =
    team.id === "mclaren"
      ? "#EF6E12"
      : team.id === "ferrari"
        ? "#17191B"
        : team.id === "mercedes"
          ? "#00A19C"
          : team.id === "red-bull"
            ? "#101A3D"
            : team.id === "racing-bulls"
              ? "#1C4AA9"
              : team.id === "aston-martin"
                ? "#BFD82C"
                : team.id === "alpine"
                  ? "#F17EB6"
                  : team.id === "williams"
                    ? "#1555BD"
                    : team.id === "haas"
                      ? "#D51C2D"
                      : team.id === "audi"
                        ? "#F02B22"
                        : "#111315";
  const wheelCoverLip =
    team.id === "racing-bulls"
      ? "#DCE2E8"
      : team.id === "ferrari"
        ? "#2A1114"
        : team.id === "mercedes"
          ? "#0B1919"
          : team.id === "aston-martin"
            ? "#0A261E"
            : team.id === "red-bull"
              ? "#0F1938"
              : team.id === "alpine"
                ? "#0E2346"
                : team.id === "williams"
                  ? "#102454"
                  : "#161920";
  const tintSlots: [string, string, number, number][] = [
    ["audi_red", wingEdgeAccent, 0.22, 0.3],
    ["audi_white", zp.wing, 0.15, 0.34],
    ["reflex_yellow", wingEdgeAccent, 0.24, 0.24],
    ["Paint_wheel_cover", wheelCoverLip, 0.26, 0.32],
    ["Glossy Paint_wheel", "#12151B", 0.55, 0.24],
    ["cockpit_foam_texture", "#181B20", 0.05, 0.72],
  ];
  for (const [slotName, hexColor, metalness, roughness] of tintSlots) {
    const mats = carInstance.paintMaterials.get(slotName);
    if (!mats) continue;
    for (const mat of mats) {
      mat.map = null;
      mat.color.set(hexColor);
      mat.metalness = metalness;
      mat.roughness = roughness;
      mat.needsUpdate = true;
    }
  }

  // Calibrate F1 slick rubber tread to rich dark motorsport vulcanized rubber (eliminating chalky grey washout)
  for (const tyreSlot of ["Tyre Thread ", "Tyre Thread"]) {
    const tyreMats = carInstance.paintMaterials.get(tyreSlot);
    if (!tyreMats) continue;
    for (const mat of tyreMats) {
      mat.color.set("#3A3F48");
      mat.metalness = 0.04;
      mat.roughness = 0.74;
      mat.needsUpdate = true;
    }
  }

  // Anodize the 4 center-lock wheel nuts cleanly in each team's racing accent (without affecting cockpit hardware)
  for (const corner of ["FL", "FR", "RL", "RR"] as const) {
    const nutObj = carInstance.corners[corner]?.wheelNut;
    if (!nutObj) continue;
    nutObj.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.color.set(wingEdgeAccent);
          m.metalness = 0.78;
          m.roughness = 0.22;
          m.needsUpdate = true;
        }
      }
    });
  }

  // Apply realistic dark satin carbon fiber to all raw GLB carbon slots
  // (FP-04 RB Blender procedural carbon exports without baseColorFactor, which defaults to white in glTF)
  const carbonSlotNames = [
    "carbon",
    "Carbon Fiber (no UV)",
    "Carbon Fiber (no UV)_rough",
    "Carbon Fiber (no UV)_rough.002",
    "Carbon Fiber (no UV)_rough_steering_wheel.002",
    "Carbon Fiber Procedural",
  ];
  const carbonRough =
    team.finish.carbonBlend === "high"
      ? 0.36
      : team.finish.carbonBlend === "balanced"
        ? 0.42
        : 0.46;
  for (const slotName of carbonSlotNames) {
    const carbonMats = carInstance.paintMaterials.get(slotName) ?? [];
    for (const carbonMat of carbonMats) {
      carbonMat.map = null;
      carbonMat.color.set("#181B20");
      carbonMat.roughnessMap = bundle.carbonRoughness;
      carbonMat.metalness = 0.08;
      carbonMat.roughness = slotName.includes("rough")
        ? Math.min(0.68, carbonRough + 0.14)
        : carbonRough;
      carbonMat.needsUpdate = true;
    }
  }

  return bundle;
}
