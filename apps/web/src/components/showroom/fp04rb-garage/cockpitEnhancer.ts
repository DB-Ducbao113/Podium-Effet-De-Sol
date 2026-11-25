import * as THREE from "three";
import type { Fp04rbCarInstance } from "./fp04rbLoader";
import type { Team2026Spec } from "./teams2026";
import type { BayRole } from "./liveryComposer";

export const COCKPIT_PRESERVE_EMISSIVE_KEY = "__pedsPreserveEmissive";

const COCKPIT_CARBON_SLOTS = new Set([
  "Carbon Fiber (no UV)",
  "Carbon Fiber (no UV)_rough",
  "Carbon Fiber (no UV)_rough.002",
  "Carbon Fiber (no UV).001",
]);

const COCKPIT_LED_SPECS: Readonly<
  Record<string, { color: string; emissive: string; intensity: number }>
> = {
  "Translucent Plastic_green": {
    color: "#07FF23",
    emissive: "#07FF23",
    intensity: 1.45,
  },
  "Translucent Plastic_blue": {
    color: "#07E3FF",
    emissive: "#07E3FF",
    intensity: 1.45,
  },
  "Translucent Plastic_yellow": {
    color: "#FFA805",
    emissive: "#FFA805",
    intensity: 1.4,
  },
  "Translucent Plastic_red": {
    color: "#FF0609",
    emissive: "#FF0609",
    intensity: 1.45,
  },
};

function createCockpitCarbonWeaveTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#12151B";
  ctx.fillRect(0, 0, size, size);

  const cell = 8;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const ix = x / cell;
      const iy = y / cell;
      const phase = (ix + iy) % 4;
      const bright = phase < 2;
      const grad = ctx.createLinearGradient(x, y, x + cell, y + cell);
      if (bright) {
        grad.addColorStop(0, "#242A35");
        grad.addColorStop(0.5, "#323A48");
        grad.addColorStop(1, "#181C24");
      } else {
        grad.addColorStop(0, "#101319");
        grad.addColorStop(0.5, "#191E28");
        grad.addColorStop(1, "#0B0E13");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, cell - 0.5, cell - 0.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates an Engineering-grade high-contrast 512x256 F1 OLED steering wheel
 * telemetry screen texture synchronized to the active 2026 team and driver number.
 */
export function createCockpitOledTexture(
  team: Team2026Spec,
  bayRole: BayRole,
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  // Logical landscape dashboard dimensions (512 wide x 256 tall).
  // steering_wheel_display_emmiter.002 UVs map u=[0..1] top->bottom and v=[0..1] left->right,
  // so we render into a transposed (256 x 512) backing canvas with flipY = false.
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = h;
  canvas.height = w;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(0, 1, 1, 0, 0, 0);

  const carNo =
    bayRole === "bay-1" ? team.carNumbers.bay1 : team.carNumbers.bay2;
  const driver = bayRole === "bay-1" ? team.drivers.bay1 : team.drivers.bay2;

  // Deep OLED obsidian background
  ctx.fillStyle = "#04070C";
  ctx.fillRect(0, 0, w, h);

  // Subtle screen bezel border
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Top 15-LED virtual RPM bar inside OLED header
  for (let i = 0; i < 15; i += 1) {
    const lx = 26 + i * 31;
    ctx.fillStyle = i < 5 ? "#22C55E" : i < 10 ? "#EF4444" : "#38BDF8";
    ctx.fillRect(lx, 14, 22, 10);
  }

  // Team telemetry header bar
  ctx.fillStyle = "#0E1522";
  ctx.fillRect(14, 32, w - 28, 26);
  ctx.fillStyle = team.accentColor;
  ctx.fillRect(14, 32, 6, 26);
  ctx.fillStyle = "#F8FAFC";
  ctx.font = '700 15px "IBM Plex Mono", Consolas, monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${team.shortCode} · ${driver}`, 28, 45);
  ctx.fillStyle = "#38BDF8";
  ctx.textAlign = "right";
  ctx.fillText("PEDS TELEMETRY · GARAGE", w - 24, 45);

  // Left telemetry column (ERS / DIFF / BBAL / ENG)
  ctx.fillStyle = "#0B111C";
  ctx.fillRect(14, 66, 152, 136);
  ctx.strokeStyle = "rgba(148,163,184,0.22)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 66, 152, 136);

  const leftRows: ReadonlyArray<readonly [string, string, string]> = [
    ["DIFF", "6 · 4", "#F8FAFC"],
    ["BBAL", "58.5%", "#FACC15"],
    ["ERS", "98%", "#22C55E"],
    ["MIX", "STRAT 3", "#38BDF8"],
    ["ENG", "98°C", "#FB923C"],
  ];
  ctx.font = '700 15px "IBM Plex Mono", Consolas, monospace';
  leftRows.forEach(([k, v, col], idx) => {
    const ry = 82 + idx * 25;
    ctx.textAlign = "left";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(k, 24, ry);
    ctx.textAlign = "right";
    ctx.fillStyle = col;
    ctx.fillText(v, 156, ry);
  });

  // Center Gear & Speed display
  ctx.fillStyle = "#0B111C";
  ctx.fillRect(176, 66, 160, 136);
  ctx.strokeStyle = team.accentColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(176, 66, 160, 136);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = '900 84px "Inter", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", 256, 122);

  ctx.fillStyle = "#CBD5E1";
  ctx.font = '700 18px "IBM Plex Mono", Consolas, monospace';
  ctx.fillText(`#${carNo} · 10,850 RPM`, 256, 182);

  // Right telemetry column (DRS / PIT / TYRE TEMPS)
  ctx.fillStyle = "#0B111C";
  ctx.fillRect(346, 66, 152, 136);
  ctx.strokeStyle = "rgba(148,163,184,0.22)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(346, 66, 152, 136);

  // DRS Ready badge
  ctx.fillStyle = "rgba(34, 197, 94, 0.22)";
  ctx.fillRect(356, 76, 132, 26);
  ctx.strokeStyle = "#22C55E";
  ctx.strokeRect(356, 76, 132, 26);
  ctx.fillStyle = "#4ADE80";
  ctx.font = '800 15px "IBM Plex Mono", Consolas, monospace';
  ctx.textAlign = "center";
  ctx.fillText("DRS READY", 422, 90);

  // 4-Corner Tyre Temperatures
  const tyres: ReadonlyArray<readonly [string, string, number, number]> = [
    ["FL", "96°", 388, 128],
    ["FR", "97°", 456, 128],
    ["RL", "94°", 388, 170],
    ["RR", "95°", 456, 170],
  ];
  for (const [label, temp, tx, ty] of tyres) {
    ctx.fillStyle = "#162032";
    ctx.fillRect(tx - 28, ty - 16, 56, 32);
    ctx.fillStyle = "#94A3B8";
    ctx.font = '700 10px "IBM Plex Mono", Consolas, monospace';
    ctx.fillText(label, tx, ty - 7);
    ctx.fillStyle = "#FACC15";
    ctx.font = '800 14px "IBM Plex Mono", Consolas, monospace';
    ctx.fillText(temp, tx, ty + 8);
  }

  // Bottom ERS / Battery deployment bar
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(14, 212, w - 28, 28);
  ctx.fillStyle = team.primaryColor;
  ctx.fillRect(18, 216, Math.round((w - 36) * 0.84), 20);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = '700 13px "IBM Plex Mono", Consolas, monospace';
  ctx.textAlign = "center";
  ctx.fillText("SOC 98% · BALANCED DEPLOY · PIT 80", 256, 227);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Upgrades the Showroom FP-04 RB cockpit materials (`PART_COCKPIT`) to match the
 * Engineering model's fidelity: glowing team-branded OLED display, 15 illuminated
 * shift/status LEDs, 2x2 twill carbon weave, FIA crimson 6-point harness, anodized
 * titanium/gold buckles, machined brass quick-release, matte headrest foam, and
 * readable steering wheel rotary/button decals.
 */
export function enhanceShowroomCockpitMaterials(
  instance: Fp04rbCarInstance,
  team: Team2026Spec,
  bayRole: BayRole,
): number {
  const cockpitNode = instance.partNodes.PART_COCKPIT;
  if (!cockpitNode) return 0;

  const oledTex = createCockpitOledTexture(team, bayRole);
  const carbonTex = createCockpitCarbonWeaveTexture();
  if (oledTex) instance.ownedTextures.push(oledTex);
  if (carbonTex) instance.ownedTextures.push(carbonTex);

  const touched = new Set<THREE.Material>();
  let enhancedCount = 0;

  cockpitNode.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial) || touched.has(mat)) {
        continue;
      }
      touched.add(mat);
      const name = mat.name;

      // 1. Live Glowing F1 OLED Steering Wheel Screen
      if (name === "display_screen.001") {
        if (oledTex) {
          mat.map = oledTex;
          mat.emissiveMap = oledTex;
        }
        mat.color.set("#FFFFFF");
        mat.emissive.set("#FFFFFF");
        mat.emissiveIntensity = 1.35;
        mat.roughness = 0.14;
        mat.metalness = 0.08;
        mat.userData[COCKPIT_PRESERVE_EMISSIVE_KEY] = true;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 2. Crystal-Clear Protective OLED Cover Glass
      if (name === "glass_clear_headlight.001") {
        mat.color.set("#B8D4FF");
        mat.transparent = true;
        mat.opacity = 0.12;
        mat.roughness = 0.06;
        mat.metalness = 0.05;
        mat.depthWrite = false;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 3. Illuminated 15 Shift & Warning LEDs (Green / Blue / Yellow / Red)
      const ledSpec = COCKPIT_LED_SPECS[name];
      if (ledSpec) {
        mat.color.set(ledSpec.color);
        mat.emissive.set(ledSpec.emissive);
        mat.emissiveIntensity = ledSpec.intensity;
        mat.roughness = 0.18;
        mat.metalness = 0.05;
        mat.userData[COCKPIT_PRESERVE_EMISSIVE_KEY] = true;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 4. Steering Wheel Button / Rotary Sticker Decals (crisp illuminated legibility)
      if (name === "steering_wheel_stickers.001") {
        mat.metalness = 0.06;
        mat.roughness = 0.26;
        if (mat.map) {
          mat.emissiveMap = mat.map;
          mat.emissive.set("#FFFFFF");
          mat.emissiveIntensity = 0.34;
          mat.userData[COCKPIT_PRESERVE_EMISSIVE_KEY] = true;
        }
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 5. FIA Racing Crimson 6-Point Safety Harness Webbing
      if (name === "Fabric_seatbelts") {
        mat.color.set("#B80F18");
        mat.roughness = 0.64;
        mat.metalness = 0.06;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 6. Anodized Gold/Amber Harness Cam-Lock Buckle
      if (name === "Anodized Metal_grey") {
        mat.color.set("#CF6605");
        mat.metalness = 0.86;
        mat.roughness = 0.22;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 7. Brushed Titanium Mechanical Hardware (Paddle Holders, QR Shaft, Harness Mounts)
      if (name === "AnodizedMetal_grey" || name === "AnodizedMetal_grey.001") {
        mat.color.set("#4D5B6E");
        mat.metalness = 0.88;
        mat.roughness = 0.23;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 8. Machined Brass Quick-Release Spline & Thumb Rotary Knurls
      if (name === "BMD_Brass.001") {
        mat.color.set("#C88022");
        mat.metalness = 0.9;
        mat.roughness = 0.2;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 9. Fix Matte FIA Headrest Foam (was incorrectly 90% chrome metalness in Showroom GLB)
      if (name === "cockpit_foam_texture") {
        mat.metalness = 0.05;
        mat.roughness = 0.72;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 10. Alcantara Wheel Grips & Molded Seat Liner
      if (name === "BMD_Felt_0018" || name === "Rubber.002") {
        mat.color.set("#161A22");
        mat.metalness = 0.03;
        mat.roughness = 0.84;
        mat.needsUpdate = true;
        enhancedCount += 1;
        continue;
      }

      // 11. Woven 2x2 Carbon Fiber on Steering Chassis, Carbon Paddles, Seat & Survival Tub
      if (
        COCKPIT_CARBON_SLOTS.has(name) ||
        name === "Carbon Fiber (no UV)_rough_steering_wheel.002"
      ) {
        if (carbonTex && !mat.map) {
          mat.map = carbonTex;
          mat.bumpMap = carbonTex;
          mat.bumpScale = 0.004;
        }
        mat.color.set("#D8DFE8");
        mat.metalness = 0.34;
        mat.roughness = 0.3;
        mat.needsUpdate = true;
        enhancedCount += 1;
      }
    }
  });

  return enhancedCount;
}
