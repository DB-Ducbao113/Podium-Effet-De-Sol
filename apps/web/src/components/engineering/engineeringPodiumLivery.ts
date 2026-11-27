import * as THREE from "three";

/**
 * Bespoke "Concept A — Storm Midnight Stealth" PODIUM EFFET DE SOL runtime livery
 * for the 47-part FP-04 RB Engineering GLB (`fp04rb-engineering-v1.glb`).
 *
 * Coordinate convention measured directly from `fp04rb-engineering-v1.glb`:
 * - `-Z` = Front Nose (`z = -2.60`), `+Z` = Rear Tail (`z = +2.60`)
 * - `+Y` = Up (`y = 0.08 .. 1.05`)
 * - `-X` = Physical Left (`SIDEPOD_SHELL_LEFT`), `+X` = Physical Right (`SIDEPOD_SHELL_RIGHT`)
 *
 * Because each of the 47 engineering parts explodes away from its assembled resting
 * `basePosition`, the vertex shader computes `vCarLocalPos = position + uPartBaseOffset`
 * so the livery remains continuous when assembled and stays 100% locked to every part
 * during disassembly.
 */

export const ENG_LIVERY_PALETTE = {
  midnightBase: "#0a1326",
  midnightDeep: "#060b16",
  midnightHighlight: "#142444",
  carbonBase: "#0d121c",
  crimsonBright: "#ff3b1f",
  crimsonCore: "#d92218",
  crimsonDark: "#7a0e12",
  silverChrome: "#e6eef8",
  silverMuted: "#b6c5d8",
  aeroCyan: "#72e0ff",
} as const;

export const ENG_BODY_BOUNDS = {
  zMin: -2.6,
  zMax: 2.1,
  yMin: 0.08,
  yMax: 1.05,
  xHalf: 0.65,
} as const;

export const ENG_FRONT_WING_BOUNDS = {
  zMin: -2.6,
  zMax: -1.82,
  yMin: 0.08,
  yMax: 0.48,
  xHalf: 0.96,
} as const;

export const ENG_REAR_WING_BOUNDS = {
  zMin: 2.08,
  zMax: 2.6,
  yMin: 0.36,
  yMax: 0.94,
  xHalf: 0.6,
} as const;

export type EngineeringLiverySurfaceMode = "body" | "front-wing" | "rear-wing";

export interface EngineeringPodiumLiveryBundle {
  readonly bodyAtlas: THREE.CanvasTexture;
  readonly frontWingAtlas: THREE.CanvasTexture;
  readonly rearWingAtlas: THREE.CanvasTexture;
  readonly wheelCoverTexture: THREE.CanvasTexture;
  readonly floorTexture: THREE.CanvasTexture;
  readonly dispose: () => void;
}

const BRAND_LOGO_URL = "/logo/logo.png";

function createCanvas2D(
  width: number,
  height: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return [canvas, ctx];
}

function drawCarbonWeave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  baseHex: string = ENG_LIVERY_PALETTE.carbonBase,
  alpha = 0.04,
): void {
  ctx.save();
  ctx.fillStyle = baseHex;
  ctx.fillRect(x, y, w, h);
  const step = Math.max(4, Math.floor(h / 110));
  ctx.fillStyle = `rgba(210, 232, 255, ${alpha})`;
  for (let py = y; py < y + h; py += step * 2) {
    for (let px = x; px < x + w; px += step * 2) {
      ctx.fillRect(px, py, step, step);
      ctx.fillRect(px + step, py + step, step, step);
    }
  }
  ctx.restore();
}

function drawMetallicWordmark(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  fontPx: number,
  options?: {
    italic?: boolean;
    maxWidth?: number;
    letterSpacing?: string;
    rotationRad?: number;
  },
): void {
  ctx.save();
  ctx.translate(cx, cy);
  if (options?.rotationRad) ctx.rotate(options.rotationRad);
  ctx.font = `${options?.italic ? "italic " : ""}900 ${Math.round(fontPx)}px "Inter", "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx && options?.letterSpacing) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      options.letterSpacing;
  }

  const grad = ctx.createLinearGradient(0, -fontPx * 0.55, 0, fontPx * 0.55);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.45, "#dfe9f5");
  grad.addColorStop(0.7, "#9eb1c8");
  grad.addColorStop(1, "#eef5ff");

  ctx.shadowColor = "rgba(4, 8, 18, 0.85)";
  ctx.shadowBlur = Math.max(4, fontPx * 0.14);
  ctx.shadowOffsetY = Math.max(1, fontPx * 0.04);
  ctx.lineWidth = Math.max(2, fontPx * 0.06);
  ctx.strokeStyle = "rgba(5, 10, 20, 0.88)";
  ctx.lineJoin = "round";
  ctx.strokeText(text, 0, 0, options?.maxWidth);
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0, options?.maxWidth);
  ctx.restore();
}

function drawStormMidnightPanelBase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, ENG_LIVERY_PALETTE.midnightHighlight);
  grad.addColorStop(0.32, ENG_LIVERY_PALETTE.midnightBase);
  grad.addColorStop(0.75, ENG_LIVERY_PALETTE.midnightDeep);
  grad.addColorStop(1, ENG_LIVERY_PALETTE.carbonBase);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

/**
 * Draws the Concept A crimson Venturi airflow slashes on one sidepod panel.
 * Canvas Y = 0 is top of car (`yMax = 1.05`), Y = h is bottom (`yMin = 0.08`).
 */
function drawSidePanelConceptA(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelW: number,
  panelH: number,
  frontOnLeft: boolean,
): void {
  drawStormMidnightPanelBase(ctx, panelX, 0, panelW, panelH);

  // Subtle exposed carbon lower floor/undercut skirt
  drawCarbonWeave(
    ctx,
    panelX,
    Math.round(panelH * 0.78),
    panelW,
    Math.round(panelH * 0.22),
    "#080c14",
    0.045,
  );

  // Map normalized longitudinal coordinate t ∈ [0=nose, 1=tail] into panel X
  const tx = (t: number) =>
    panelX + (frontOnLeft ? t * panelW : (1 - t) * panelW);
  // Map normalized car height v ∈ [0=bottom, 1=top] into canvas Y
  const ty = (v: number) => (1 - v) * panelH;

  // Crimson Venturi airflow ribs sweeping back along the lower sidepod undercut
  const drawAeroSlash = (
    t0: number,
    v0: number,
    t1: number,
    v1: number,
    t2: number,
    v2: number,
    thickness: number,
    colorA: string,
    colorB: string,
  ) => {
    ctx.save();
    const grad = ctx.createLinearGradient(tx(t0), ty(v0), tx(t2), ty(v2));
    grad.addColorStop(0, colorA);
    grad.addColorStop(0.65, colorB);
    grad.addColorStop(1, "rgba(180, 20, 20, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(tx(t0), ty(v0));
    ctx.quadraticCurveTo(tx(t1), ty(v1 + thickness), tx(t2), ty(v2));
    ctx.quadraticCurveTo(tx(t1), ty(v1 - thickness * 0.45), tx(t0), ty(v0));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawAeroSlash(
    0.43,
    0.37,
    0.65,
    0.20,
    0.87,
    0.44,
    0.064,
    ENG_LIVERY_PALETTE.crimsonBright,
    ENG_LIVERY_PALETTE.crimsonCore,
  );
  drawAeroSlash(
    0.49,
    0.27,
    0.69,
    0.14,
    0.88,
    0.34,
    0.048,
    "#ff5633",
    ENG_LIVERY_PALETTE.crimsonCore,
  );
  drawAeroSlash(
    0.55,
    0.18,
    0.74,
    0.09,
    0.89,
    0.24,
    0.032,
    ENG_LIVERY_PALETTE.crimsonCore,
    ENG_LIVERY_PALETTE.crimsonDark,
  );

  // Sculpted brushed titanium-silver aero shoulder contour tracing the upper sidepod waist
  ctx.save();
  const silverContour = ctx.createLinearGradient(
    tx(0.32),
    ty(0.54),
    tx(0.88),
    ty(0.58),
  );
  silverContour.addColorStop(0, "rgba(230, 238, 248, 0)");
  silverContour.addColorStop(0.28, "rgba(230, 238, 248, 0.85)");
  silverContour.addColorStop(0.72, "rgba(114, 224, 255, 0.78)");
  silverContour.addColorStop(1, "rgba(114, 224, 255, 0)");
  ctx.strokeStyle = silverContour;
  ctx.lineWidth = Math.max(4, panelH * 0.011);
  ctx.beginPath();
  ctx.moveTo(tx(0.30), ty(0.50));
  ctx.bezierCurveTo(
    tx(0.48),
    ty(0.60),
    tx(0.68),
    ty(0.56),
    tx(0.89),
    ty(0.59),
  );
  ctx.stroke();
  ctx.restore();

  // Sharp crimson roll-hoop / airbox collar accent + halo side highlight
  ctx.save();
  ctx.fillStyle = ENG_LIVERY_PALETTE.crimsonBright;
  ctx.beginPath();
  ctx.moveTo(tx(0.56), ty(0.87));
  ctx.lineTo(tx(0.67), ty(0.92));
  ctx.lineTo(tx(0.74), ty(0.85));
  ctx.lineTo(tx(0.60), ty(0.81));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Electric cyan Venturi floor-edge hairline (crisp high-contrast ground-effect cue)
  ctx.save();
  ctx.strokeStyle = ENG_LIVERY_PALETTE.aeroCyan;
  ctx.lineWidth = Math.max(5, panelH * 0.013);
  ctx.shadowColor = ENG_LIVERY_PALETTE.aeroCyan;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(tx(0.42), ty(0.06));
  ctx.lineTo(tx(0.88), ty(0.06));
  ctx.stroke();
  ctx.restore();

  // Subtle technical F1 telemetry stencil ticks on monocoque flank
  ctx.save();
  ctx.fillStyle = "rgba(214, 232, 255, 0.72)";
  ctx.font = `700 ${Math.round(panelH * 0.024)}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText("FP-04 RB · EDS", tx(0.36), ty(0.43));
  ctx.restore();

  // Bold metallic silver "PODIUM" wordmark centered cleanly on the flat sidepod flank
  drawMetallicWordmark(ctx, "PODIUM", tx(0.66), ty(0.35), panelH * 0.112, {
    italic: true,
    maxWidth: panelW * 0.25,
    letterSpacing: "3px",
    rotationRad: frontOnLeft ? -0.025 : 0.025,
  });

  // Crisp "EFFET DE SOL" along the upper engine cover / sharkfin
  drawMetallicWordmark(ctx, "EFFET DE SOL", tx(0.77), ty(0.72), panelH * 0.044, {
    italic: true,
    maxWidth: panelW * 0.19,
    letterSpacing: "3px",
  });

  // Clean crimson accent pill + "01" works badge on the rear sharkfin
  ctx.save();
  ctx.fillStyle = ENG_LIVERY_PALETTE.crimsonBright;
  ctx.fillRect(tx(0.855) - 18, ty(0.81) - 10, 36, 4);
  ctx.restore();
  drawMetallicWordmark(ctx, "01", tx(0.855), ty(0.76), panelH * 0.056, {
    italic: true,
    maxWidth: panelW * 0.08,
  });
}

function drawTopPanelConceptA(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelW: number,
  panelH: number,
  logoImg: HTMLImageElement | null,
): void {
  drawStormMidnightPanelBase(ctx, panelX, 0, panelW, panelH);

  // Subtle metallic highlight down the nose & cockpit spine
  const spineGrad = ctx.createLinearGradient(panelX, 0, panelX + panelW, 0);
  spineGrad.addColorStop(0, "rgba(10, 19, 38, 0)");
  spineGrad.addColorStop(0.42, "rgba(38, 66, 118, 0.28)");
  spineGrad.addColorStop(0.5, "rgba(114, 224, 255, 0.20)");
  spineGrad.addColorStop(0.58, "rgba(38, 66, 118, 0.28)");
  spineGrad.addColorStop(1, "rgba(10, 19, 38, 0)");
  ctx.fillStyle = spineGrad;
  ctx.fillRect(panelX, 0, panelW, panelH);

  // Crimson Halo center pillar & nose V-spear accent (echoes the glowing red spine of the Podium logo)
  const noseCx = panelX + panelW * 0.5;
  ctx.save();
  ctx.fillStyle = ENG_LIVERY_PALETTE.crimsonBright;
  ctx.beginPath();
  ctx.moveTo(noseCx, panelH * 0.025);
  ctx.lineTo(noseCx + panelW * 0.045, panelH * 0.075);
  ctx.lineTo(noseCx, panelH * 0.058);
  ctx.lineTo(noseCx - panelW * 0.045, panelH * 0.075);
  ctx.closePath();
  ctx.fill();

  // Halo front wishbone crimson accent arc
  ctx.strokeStyle = ENG_LIVERY_PALETTE.crimsonBright;
  ctx.lineWidth = Math.max(8, panelW * 0.016);
  ctx.beginPath();
  ctx.arc(noseCx, panelH * 0.49, panelW * 0.18, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();

  // Official Podium Effet De Sol crest on the nosecone (oriented upright when viewed from front -Z)
  const noseCy = panelH * 0.145;
  if (logoImg && logoImg.naturalWidth > 0 && logoImg.naturalHeight > 0) {
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    const drawW = panelW * 0.2;
    const drawH = drawW / aspect;
    ctx.save();
    ctx.translate(noseCx, noseCy);
    ctx.rotate(Math.PI);
    ctx.drawImage(logoImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    // Immediate crisp vector crest fallback before PNG finishes decoding
    ctx.save();
    ctx.translate(noseCx, noseCy);
    ctx.rotate(Math.PI);
    ctx.fillStyle = ENG_LIVERY_PALETTE.crimsonBright;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(24, 16);
    ctx.lineTo(0, 6);
    ctx.lineTo(-24, 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    drawMetallicWordmark(ctx, "PODIUM", noseCx, noseCy - 28, 22, {
      italic: true,
      maxWidth: panelW * 0.19,
      rotationRad: Math.PI,
    });
  }

  // Crisp metallic silver racing number "01" on the mid-nose bulkhead (upright from front)
  drawMetallicWordmark(ctx, "01", noseCx, panelH * 0.275, 58, {
    italic: true,
    maxWidth: panelW * 0.18,
    rotationRad: Math.PI,
  });

  // Subtle electric cyan aero micro-cheeks flanking the cockpit nose
  ctx.save();
  ctx.strokeStyle = "rgba(114, 224, 255, 0.72)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(noseCx - panelW * 0.08, panelH * 0.22);
  ctx.lineTo(noseCx - panelW * 0.13, panelH * 0.36);
  ctx.moveTo(noseCx + panelW * 0.08, panelH * 0.22);
  ctx.lineTo(noseCx + panelW * 0.13, panelH * 0.36);
  ctx.stroke();
  ctx.restore();
}

function paintBodyAtlas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  logoImg: HTMLImageElement | null,
): void {
  const pw = w / 3;
  // Panel 0: Left side (x < 0 -> front -Z is on left)
  drawSidePanelConceptA(ctx, 0, pw, h, true);
  // Panel 1: Right side (x > 0 -> front -Z is on right)
  drawSidePanelConceptA(ctx, pw, pw, h, false);
  // Panel 2: Top deck (nosecone, monocoque, halo top)
  drawTopPanelConceptA(ctx, pw * 2, pw, h, logoImg);
}

function paintFrontWingAtlas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const pw = w / 3;
  // Panel 0: Top view of Front Wing (u=0 -> left tip, u=0.5 -> nose center, u=1 -> right tip; v=0 -> leading edge)
  drawCarbonWeave(ctx, 0, 0, pw, h, "#0b101a", 0.05);

  // Sculpted Concept A vivid crimson-red aerodynamic flaps on left & right wing cascades
  const drawCascadeFlaps = (leftSide: boolean) => {
    const xStart = leftSide ? pw * 0.08 : pw * 0.56;
    const xEnd = leftSide ? pw * 0.44 : pw * 0.92;
    const flapW = xEnd - xStart;

    const grad = ctx.createLinearGradient(xStart, h * 0.18, xEnd, h * 0.85);
    grad.addColorStop(0, ENG_LIVERY_PALETTE.crimsonBright);
    grad.addColorStop(0.55, ENG_LIVERY_PALETTE.crimsonCore);
    grad.addColorStop(1, "#9a1515");

    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(xStart, h * 0.24, flapW, h * 0.62, 26);
    ctx.fill();

    // Subtle dark carbon separation lines between the 4 stacked planes
    ctx.strokeStyle = "rgba(8, 12, 22, 0.85)";
    ctx.lineWidth = Math.max(5, h * 0.016);
    for (const frac of [0.42, 0.58, 0.74]) {
      ctx.beginPath();
      ctx.moveTo(xStart - 6, h * frac);
      ctx.lineTo(xEnd + 6, h * frac);
      ctx.stroke();
    }
    ctx.restore();
  };

  drawCascadeFlaps(true);
  drawCascadeFlaps(false);

  // Center nose attachment bridge in satin Storm Midnight navy
  ctx.fillStyle = ENG_LIVERY_PALETTE.midnightBase;
  ctx.fillRect(pw * 0.42, 0, pw * 0.16, h);

  // Panel 1 & 2: Left & Right Front Wing Endplates (matte carbon + crimson footplate + silver PEDS mark + cyan leading edge)
  for (const offset of [pw, pw * 2]) {
    drawCarbonWeave(ctx, offset, 0, pw, h, "#0a101d", 0.045);
    ctx.fillStyle = ENG_LIVERY_PALETTE.crimsonBright;
    ctx.fillRect(offset, h * 0.84, pw, h * 0.08);
    ctx.fillStyle = ENG_LIVERY_PALETTE.aeroCyan;
    ctx.fillRect(offset, h * 0.78, pw, h * 0.025);
    drawMetallicWordmark(ctx, "PEDS", offset + pw * 0.52, h * 0.48, h * 0.14, {
      italic: true,
      maxWidth: pw * 0.7,
    });
  }
}

function paintRearWingAtlas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const pw = w / 3;
  // Panel 0: Mainplane & DRS flap — deep Storm Midnight satin with crisp "EFFET DE SOL"
  drawStormMidnightPanelBase(ctx, 0, 0, pw, h);
  drawCarbonWeave(ctx, 0, h * 0.62, pw, h * 0.38, "#080d17", 0.045);

  // Subtle crimson lower DRS slot accent
  ctx.fillStyle = ENG_LIVERY_PALETTE.crimsonBright;
  ctx.fillRect(pw * 0.08, h * 0.42, pw * 0.84, h * 0.028);

  // Crisp metallic silver "EFFET DE SOL" across the upper DRS flap
  drawMetallicWordmark(ctx, "EFFET DE SOL", pw * 0.5, h * 0.22, h * 0.115, {
    italic: true,
    maxWidth: pw * 0.82,
    letterSpacing: "6px",
  });

  // Panel 1 & 2: Rear Wing Endplates (matte Storm Midnight + subtle crimson accent slash)
  for (const offset of [pw, pw * 2]) {
    drawCarbonWeave(ctx, offset, 0, pw, h, "#0a1120", 0.045);
    ctx.fillStyle = ENG_LIVERY_PALETTE.crimsonCore;
    ctx.beginPath();
    ctx.moveTo(offset + pw * 0.15, h * 0.22);
    ctx.lineTo(offset + pw * 0.88, h * 0.12);
    ctx.lineTo(offset + pw * 0.88, h * 0.21);
    ctx.lineTo(offset + pw * 0.15, h * 0.30);
    ctx.closePath();
    ctx.fill();
  }
}

function createWheelCoverTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const pair = createCanvas2D(512, 512);
  const canvas = pair ? pair[0] : (({} as unknown) as HTMLCanvasElement);
  if (pair) {
    const [, ctx] = pair;
    drawCarbonWeave(ctx, 0, 0, 512, 512, "#0b101b", 0.05);
    // Concentric dark satin hub + electric cyan rim lip (Concept A signature)
    ctx.strokeStyle = "rgba(180, 200, 224, 0.16)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 172, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = ENG_LIVERY_PALETTE.aeroCyan;
    ctx.lineWidth = 10;
    ctx.shadowColor = ENG_LIVERY_PALETTE.aeroCyan;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(256, 256, 232, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function createFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const pair = createCanvas2D(512, 512);
  const canvas = pair ? pair[0] : (({} as unknown) as HTMLCanvasElement);
  if (pair) {
    const [, ctx] = pair;
    drawCarbonWeave(ctx, 0, 0, 512, 512, "#090d16", 0.05);
    // Subtle cyan Venturi edge cue along perimeter
    ctx.strokeStyle = "rgba(114, 224, 255, 0.65)";
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 492, 492);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createEngineeringPodiumLiveryBundle(
  maxAnisotropy = 4,
  onLogoUpdated?: () => void,
): EngineeringPodiumLiveryBundle {
  const bodyPair = createCanvas2D(3072, 1024);
  const fwPair = createCanvas2D(3072, 1024);
  const rwPair = createCanvas2D(3072, 1024);

  if (bodyPair) paintBodyAtlas(bodyPair[1], 3072, 1024, null);
  if (fwPair) paintFrontWingAtlas(fwPair[1], 3072, 1024);
  if (rwPair) paintRearWingAtlas(rwPair[1], 3072, 1024);

  const makeTex = (pair: [HTMLCanvasElement, CanvasRenderingContext2D] | null) => {
    const tex = new THREE.CanvasTexture(
      pair ? pair[0] : (({} as unknown) as HTMLCanvasElement),
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  };

  const bodyAtlas = makeTex(bodyPair);
  const frontWingAtlas = makeTex(fwPair);
  const rearWingAtlas = makeTex(rwPair);
  const wheelCoverTexture = createWheelCoverTexture(maxAnisotropy);
  const floorTexture = createFloorTexture(maxAnisotropy);

  // Load official /logo/logo.png asynchronously and repaint the nosecone crest cleanly
  let disposed = false;
  if (bodyPair && typeof Image !== "undefined") {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (disposed) return;
      paintBodyAtlas(bodyPair[1], 3072, 1024, img);
      bodyAtlas.needsUpdate = true;
      onLogoUpdated?.();
    };
    img.src = BRAND_LOGO_URL;
  }

  return {
    bodyAtlas,
    frontWingAtlas,
    rearWingAtlas,
    wheelCoverTexture,
    floorTexture,
    dispose: () => {
      disposed = true;
      bodyAtlas.dispose();
      frontWingAtlas.dispose();
      rearWingAtlas.dispose();
      wheelCoverTexture.dispose();
      floorTexture.dispose();
    },
  };
}

function bindEngineeringCarSpaceShader(
  material: THREE.MeshStandardMaterial,
  mode: EngineeringLiverySurfaceMode,
  atlasTexture: THREE.CanvasTexture,
  partBaseOffset: THREE.Vector3,
): void {
  const offsetCopy = partBaseOffset.clone();
  const fragmentLogic =
    mode === "body"
      ? `
        float zMin = ${ENG_BODY_BOUNDS.zMin.toFixed(3)};
        float zMax = ${ENG_BODY_BOUNDS.zMax.toFixed(3)};
        float zSpan = ${(ENG_BODY_BOUNDS.zMax - ENG_BODY_BOUNDS.zMin).toFixed(3)};
        float yMin = ${ENG_BODY_BOUNDS.yMin.toFixed(3)};
        float ySpan = ${(ENG_BODY_BOUNDS.yMax - ENG_BODY_BOUNDS.yMin).toFixed(3)};
        float xHalf = ${ENG_BODY_BOUNDS.xHalf.toFixed(3)};

        // -X = Physical Left, +X = Physical Right; -Z = Front Nose, +Z = Rear Tail
        float isLeft = (vEngCarPos.x + vEngCarNormal.x * 0.04) <= 0.0 ? 1.0 : 0.0;
        float uLeft = clamp((vEngCarPos.z - zMin) / zSpan, 0.002, 0.998);
        float uRight = clamp((zMax - vEngCarPos.z) / zSpan, 0.002, 0.998);
        // flipY=false: canvas v=0 is top (yMax), v=1 is bottom (yMin)
        float vSide = clamp(1.0 - (vEngCarPos.y - yMin) / ySpan, 0.002, 0.998);

        vec2 leftUv = vec2(uLeft / 3.0, vSide);
        vec2 rightUv = vec2((1.0 + uRight) / 3.0, vSide);
        vec2 sideUv = mix(rightUv, leftUv, isLeft);

        float uTop = clamp((vEngCarPos.x + xHalf) / (2.0 * xHalf), 0.002, 0.998);
        float vTop = clamp((vEngCarPos.z - zMin) / zSpan, 0.002, 0.998);
        vec2 topUv = vec2((2.0 + uTop) / 3.0, vTop);

        float noseBoost = smoothstep(-0.95, -1.50, vEngCarPos.z);
        float topThresholdLo = mix(0.72, 0.44, noseBoost);
        float topThresholdHi = mix(0.88, 0.66, noseBoost);
        float topWeight = smoothstep(topThresholdLo, topThresholdHi, vEngCarNormal.y);
        float finKeepSide = 1.0 - smoothstep(0.45, 0.65, abs(vEngCarNormal.x));
        topWeight *= mix(finKeepSide, 1.0, noseBoost * 0.65);

        vec3 sideCol = texture2D(uEngLiveryAtlas, sideUv).rgb;
        vec3 topCol = texture2D(uEngLiveryAtlas, topUv).rgb;
        diffuseColor.rgb = mix(sideCol, topCol, topWeight);
      `
      : mode === "front-wing"
        ? `
        float zMin = ${ENG_FRONT_WING_BOUNDS.zMin.toFixed(3)};
        float zMax = ${ENG_FRONT_WING_BOUNDS.zMax.toFixed(3)};
        float zSpan = ${(ENG_FRONT_WING_BOUNDS.zMax - ENG_FRONT_WING_BOUNDS.zMin).toFixed(3)};
        float yMin = ${ENG_FRONT_WING_BOUNDS.yMin.toFixed(3)};
        float ySpan = ${(ENG_FRONT_WING_BOUNDS.yMax - ENG_FRONT_WING_BOUNDS.yMin).toFixed(3)};
        float xHalf = ${ENG_FRONT_WING_BOUNDS.xHalf.toFixed(3)};

        float uTop = clamp((vEngCarPos.x + xHalf) / (2.0 * xHalf), 0.002, 0.998);
        float vTop = clamp((vEngCarPos.z - zMin) / zSpan, 0.002, 0.998);
        vec2 topUv = vec2(uTop / 3.0, vTop);

        float isLeft = vEngCarPos.x <= 0.0 ? 1.0 : 0.0;
        float uEp = isLeft > 0.5
          ? clamp((vEngCarPos.z - zMin) / zSpan, 0.002, 0.998)
          : clamp((zMax - vEngCarPos.z) / zSpan, 0.002, 0.998);
        float vEp = clamp(1.0 - (vEngCarPos.y - yMin) / ySpan, 0.002, 0.998);
        vec2 epUv = vec2(((isLeft > 0.5 ? 1.0 : 2.0) + uEp) / 3.0, vEp);

        float isEndplate = smoothstep(0.80, 0.90, abs(vEngCarPos.x)) * smoothstep(0.32, 0.64, abs(vEngCarNormal.x));
        diffuseColor.rgb = mix(texture2D(uEngLiveryAtlas, topUv).rgb, texture2D(uEngLiveryAtlas, epUv).rgb, isEndplate);
      `
        : `
        float zMin = ${ENG_REAR_WING_BOUNDS.zMin.toFixed(3)};
        float zMax = ${ENG_REAR_WING_BOUNDS.zMax.toFixed(3)};
        float zSpan = ${(ENG_REAR_WING_BOUNDS.zMax - ENG_REAR_WING_BOUNDS.zMin).toFixed(3)};
        float yMin = ${ENG_REAR_WING_BOUNDS.yMin.toFixed(3)};
        float ySpan = ${(ENG_REAR_WING_BOUNDS.yMax - ENG_REAR_WING_BOUNDS.yMin).toFixed(3)};

        // Readable left-to-right from both front-3/4 (-Z) and rear (+Z) views
        float uRear = vEngCarNormal.z > 0.0
          ? clamp((vEngCarPos.x + 0.46) / 0.92, 0.002, 0.998)
          : clamp((0.46 - vEngCarPos.x) / 0.92, 0.002, 0.998);
        float vRear = clamp(1.0 - (vEngCarPos.y - yMin) / ySpan, 0.002, 0.998);
        vec2 rearUv = vec2(uRear / 3.0, vRear);

        float isLeft = vEngCarPos.x <= 0.0 ? 1.0 : 0.0;
        float uEp = isLeft > 0.5
          ? clamp((vEngCarPos.z - zMin) / zSpan, 0.002, 0.998)
          : clamp((zMax - vEngCarPos.z) / zSpan, 0.002, 0.998);
        vec2 epUv = vec2(((isLeft > 0.5 ? 1.0 : 2.0) + uEp) / 3.0, vRear);

        float isEndplate = smoothstep(0.44, 0.50, abs(vEngCarPos.x)) * smoothstep(0.32, 0.62, abs(vEngCarNormal.x));
        diffuseColor.rgb = mix(texture2D(uEngLiveryAtlas, rearUv).rgb, texture2D(uEngLiveryAtlas, epUv).rgb, isEndplate);
      `;

  material.map = null;
  material.color.set("#ffffff");
  material.roughness = mode === "body" ? 0.34 : 0.38;
  material.metalness = mode === "body" ? 0.32 : 0.24;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEngLiveryAtlas = { value: atlasTexture };
    shader.uniforms.uPartBaseOffset = { value: offsetCopy };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uPartBaseOffset;\nvarying vec3 vEngCarPos;\nvarying vec3 vEngCarNormal;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvEngCarPos = position + uPartBaseOffset;\nvEngCarNormal = normalize(normal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vEngCarPos;\nvarying vec3 vEngCarNormal;\nuniform sampler2D uEngLiveryAtlas;",
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>\n${fragmentLogic}`,
      );
  };
  material.customProgramCacheKey = () => `peds-eng-concept-a-livery-v1-${mode}`;
  material.needsUpdate = true;
}

/**
 * Applies the Concept A — Storm Midnight Stealth PODIUM EFFET DE SOL livery
 * to a cloned material on one of the 47 FP-04 RB engineering parts.
 * Returns `true` when the material was re-branded.
 */
export function applyEngineeringPodiumLiveryToMaterial(
  material: THREE.MeshStandardMaterial,
  partBaseOffset: THREE.Vector3,
  bundle: EngineeringPodiumLiveryBundle,
): boolean {
  const name = material.name;

  if (name === "main_body_texture") {
    bindEngineeringCarSpaceShader(material, "body", bundle.bodyAtlas, partBaseOffset);
    return true;
  }
  if (name === "front_wing_texture") {
    bindEngineeringCarSpaceShader(
      material,
      "front-wing",
      bundle.frontWingAtlas,
      partBaseOffset,
    );
    return true;
  }
  if (name === "rear_wing_texture") {
    bindEngineeringCarSpaceShader(
      material,
      "rear-wing",
      bundle.rearWingAtlas,
      partBaseOffset,
    );
    return true;
  }
  if (name === "floor_texture") {
    material.map = bundle.floorTexture;
    material.color.set("#ffffff");
    material.roughness = 0.48;
    material.metalness = 0.22;
    material.needsUpdate = true;
    return true;
  }
  if (name === "wheel_covers_texture" || name === "wheel_covers_texture.001") {
    material.map = bundle.wheelCoverTexture;
    material.color.set("#ffffff");
    material.roughness = 0.36;
    material.metalness = 0.34;
    material.needsUpdate = true;
    return true;
  }
  if (name === "Paint_wheel_cover") {
    material.map = null;
    material.color.set(ENG_LIVERY_PALETTE.midnightBase);
    material.roughness = 0.32;
    material.metalness = 0.38;
    material.needsUpdate = true;
    return true;
  }
  if (name === "reflex_yellow") {
    material.map = null;
    material.color.set(ENG_LIVERY_PALETTE.aeroCyan);
    material.emissive.set(ENG_LIVERY_PALETTE.aeroCyan);
    material.emissiveIntensity = 0.28;
    material.roughness = 0.25;
    material.needsUpdate = true;
    return true;
  }
  if (name === "audi_red") {
    material.map = null;
    material.color.set(ENG_LIVERY_PALETTE.crimsonCore);
    material.roughness = 0.32;
    material.metalness = 0.25;
    material.needsUpdate = true;
    return true;
  }
  if (name === "audi_white") {
    material.map = null;
    material.color.set(ENG_LIVERY_PALETTE.silverMuted);
    material.roughness = 0.34;
    material.metalness = 0.45;
    material.needsUpdate = true;
    return true;
  }
  if (name === "mirrors_texture" || name === "winglets_texture") {
    material.map = null;
    material.color.set(ENG_LIVERY_PALETTE.midnightHighlight);
    material.roughness = 0.34;
    material.metalness = 0.32;
    material.needsUpdate = true;
    return true;
  }
  if (name === "ferrari-logo-png-transparent") {
    material.map = null;
    material.color.set(ENG_LIVERY_PALETTE.midnightBase);
    material.roughness = 0.38;
    material.metalness = 0.4;
    material.needsUpdate = true;
    return true;
  }
  return false;
}
