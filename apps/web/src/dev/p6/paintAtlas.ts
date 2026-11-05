import { STANDARD_2026_PAINT } from './standard2026Paint';
import * as THREE from 'three';

export type PrecisionTeam = 'ferrari' | 'mclaren' | 'cadillac' | 'mercedes' | 'redbull' | 'racingbulls' | 'astonmartin' | 'alpine' | 'williams' | 'haas' | 'audi';

// Three orthographic paint masks share one texture: physical left, physical right,
// and upward-facing surfaces. Coordinates are Model B world units, not GLB UVs.
// This keeps boundaries continuous across the single shared paint primitive.
const panel = 512;
const front = -2.525;
const length = 5.05;
const z = (value: number) => ((value - front) / length) * panel;
const sideY = (value: number) => (1 - value / 1.1) * panel;
const topX = (value: number) => (1 - (value + 1.1) / 2.2) * panel;

function fill(ctx: CanvasRenderingContext2D, column: number, color: string, points: [number, number][], top = false) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([depth, vertical], index) => {
    const x = column * panel + z(depth);
    const y = top ? topX(vertical) : sideY(vertical);
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

export function createPaintAtlas(team: PrecisionTeam): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = panel * 3;
  canvas.height = panel;
  const ctx = canvas.getContext('2d')!;
  const sides = [0, 1];
  const paint = STANDARD_2026_PAINT[team];
  if (team === 'ferrari') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // Keep the white on the upper engine cover. The lower sidepod has
      // disconnected contours in Model B, which tear a projected diagonal.
      fill(ctx, column, paint.secondary, [[.14, .85], [.33, .79], [1.48, .75], [1.72, .84], [1.72, 1.1], [.14, 1.1]]);
      fill(ctx, column, paint.dark, [[-2.525, 0], [-1.94, 0], [-1.94, 1.1], [-2.525, 1.1]]);
      fill(ctx, column, paint.dark, [[1.95, 0], [2.525, 0], [2.525, 1.1], [1.95, 1.1]]);
      fill(ctx, column, paint.detail, [[1.98,.75],[2.525,.75],[2.525,1.1],[1.98,1.1]]);
    }
    // SF-26: white surrounds the cockpit; the rear engine-cover shoulders
    // return to rosso. The source top view does not show a white rear pod.
    fill(ctx, 2, paint.secondary, [[-.82,-.19],[-.32,-.38],[.42,-.41],[.86,-.23],[.86,.23],[.42,.41],[-.32,.38],[-.82,.19]], true);
    fill(ctx, 2, paint.dark, [[-2.525, -1.1], [-1.94, -1.1], [-1.94, 1.1], [-2.525, 1.1]], true);
    fill(ctx, 2, paint.dark, [[1.95, -1.1], [2.525, -1.1], [2.525, 1.1], [1.95, 1.1]], true);
    fill(ctx, 2, paint.detail, [[1.98,-.73],[2.525,-.73],[2.525,.73],[1.98,.73]], true);
  } else if (team === 'mclaren') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // MCL40 right profile: the sidepod is predominantly anthracite below
      // its orange upper shoulder; an orange wedge returns ahead of the rear tire.
      fill(ctx, column, paint.secondary, [[-.84, .10], [1.72, .10], [1.72, .53], [1.25, .58], [.92, .62], [.47, .63], [-.20, .55], [-.84, .30]]);
      fill(ctx, column, paint.secondary, [[.06, .68], [.43, .53], [1.42, .51], [1.72, .77], [1.72, 1.1], [.06, 1.1]]);
      fill(ctx, column, paint.primary, [[1.07, .10], [1.72, .10], [1.72, .40], [1.42, .40]]);
      fill(ctx, column, paint.primary, [[-.66, .53], [-.08, .57], [.18, .63], [.36, .66], [.22, .73], [-.33, .69]]);
      fill(ctx, column, paint.accent, [[.43, .82], [.96, .83], [1.10, .96], [.45, .96]]);
      fill(ctx, column, paint.detail, [[-1.18, .32], [-.82, .34], [-.82, .48], [-1.18, .46]]);
      fill(ctx, column, paint.secondary, [[-2.525, 0], [-1.95, 0], [-1.95, 1.1], [-2.525, 1.1]]);
      fill(ctx, column, paint.secondary, [[1.98, 0], [2.525, 0], [2.525, .57], [1.98, .57]]);
    }
    fill(ctx, 2, paint.secondary, [[.16, -.38], [1.46, -.44], [1.75, -.18], [1.75, .18], [1.46, .44], [.16, .38]], true);
    fill(ctx, 2, paint.primary, [[-.78, -.36], [.15, -.35], [.30, -.25], [.30, .25], [.15, .35], [-.78, .36]], true);
    fill(ctx, 2, paint.accent, [[.42, -.20], [.96, -.22], [1.10, -.14], [1.10, .14], [.96, .22], [.42, .20]], true);
    fill(ctx, 2, paint.secondary, [[-2.525, -1.1], [-1.95, -1.1], [-1.95, 1.1], [-2.525, 1.1]], true);
    // Model B front-wing top uses the outboard bands; retain the black center and flap tips.
    fill(ctx, 2, paint.primary, [[-2.42,-.88],[-1.97,-.79],[-1.97,-.38],[-2.42,-.47]], true);
    fill(ctx, 2, paint.primary, [[-2.42,.47],[-1.97,.38],[-1.97,.79],[-2.42,.88]], true);
    fill(ctx, 2, paint.secondary, [[1.98, -.36], [2.525, -.36], [2.525, .36], [1.98, .36]], true);
  } else if (team === 'mercedes') {
    ctx.fillStyle = paint.secondary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      fill(ctx, column, paint.primary, [[-1.91,.40],[-1.28,.30],[-.65,.39],[.05,.62],[.77,.72],[1.65,.74],[1.82,.80],[1.82,1.1],[-1.91,1.1]]);
      fill(ctx, column, paint.accent, [[-1.36,.41],[-.84,.43],[-.36,.58],[.23,.69],[.76,.73],[.76,.77],[.15,.73],[-.47,.62],[-1.12,.47]]);
      fill(ctx, column, paint.dark, [[-2.525,0],[-1.92,0],[-1.92,1.1],[-2.525,1.1]]);
    }
    // W17 silver nose and sidepod shoulders frame a predominantly black
    // cockpit/engine-cover spine in the inspected top photograph.
    fill(ctx, 2, paint.primary, [[-1.85,-.22],[-.75,-.28],[-.32,-.31],[-.32,.31],[-.75,.28],[-1.85,.22]], true);
    fill(ctx, 2, paint.primary, [[-.40,-.32],[.42,-.46],[.82,-.43],[.55,-.21],[-.40,-.20]], true);
    fill(ctx, 2, paint.primary, [[-.40,.20],[.55,.21],[.82,.43],[.42,.46],[-.40,.32]], true);
    fill(ctx, 2, paint.accent, [[-.52,-.34],[.44,-.48],[.92,-.43],[.92,-.40],[.42,-.44],[-.52,-.30]], true);
    fill(ctx, 2, paint.accent, [[-.52,.30],[.42,.44],[.92,.40],[.92,.43],[.44,.48],[-.52,.34]], true);
  } else if (team === 'redbull') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // The inspected RB22 profile keeps the upper cover blue beneath the
      // red/yellow bull graphic; the prototype's white wedge was incorrect.
      fill(ctx, column, paint.secondary, [[-2.525,0],[-1.94,0],[-1.94,1.1],[-2.525,1.1]]);
      fill(ctx, column, paint.dark, [[1.94,0],[2.525,0],[2.525,1.1],[1.94,1.1]]);
    }
    fill(ctx, 2, paint.dark, [[-2.525,-1.1],[-1.94,-1.1],[-1.94,1.1],[-2.525,1.1]], true);
    fill(ctx, 2, paint.dark, [[1.94,-1.1],[2.525,-1.1],[2.525,1.1],[1.94,1.1]], true);
  } else if (team === 'racingbulls') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      fill(ctx, column, paint.secondary, [[-1.89,.37],[-1.10,.40],[-.59,.52],[.06,.71],[.76,.71],[1.62,.75],[1.78,.79],[1.78,.88],[.69,.85],[-.09,.78],[-.68,.60],[-1.89,.53]]);
      fill(ctx, column, paint.detail, [[-1.85,.10],[-.75,.11],[-.2,.22],[.82,.29],[1.71,.32],[1.71,.47],[.73,.42],[-.27,.34],[-.85,.19],[-1.85,.19]]);
      fill(ctx, column, paint.secondary, [[-2.525,0],[-1.95,0],[-1.95,1.1],[-2.525,1.1]]);
      fill(ctx, column, paint.dark, [[1.95,0],[2.525,0],[2.525,1.1],[1.95,1.1]]);
    }
    fill(ctx, 2, paint.secondary, [[-1.8,-.35],[-.95,-.35],[-.4,-.24],[.2,-.3],[1.72,-.38],[1.72,-.32],[.24,-.22],[-.4,-.17],[-.99,-.29],[-1.8,-.29]], true);
    fill(ctx, 2, paint.dark, [[1.95,-1.1],[2.525,-1.1],[2.525,1.1],[1.95,1.1]], true);
    fill(ctx, 2, paint.dark, [[-2.525,-1.1],[-1.95,-1.1],[-1.95,-.40],[-2.525,-.40]], true);
    fill(ctx, 2, paint.dark, [[-2.525,.40],[-1.95,.40],[-1.95,1.1],[-2.525,1.1]], true);
  } else if (team === 'astonmartin') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      fill(ctx, column, paint.dark, [[-1.95,.03],[-.62,.04],[.26,.12],[1.71,.12],[1.83,.25],[1.83,.42],[.24,.36],[-.58,.28],[-1.95,.20]]);
      fill(ctx, column, paint.accent, [[-1.88,.30],[-.71,.32],[.20,.46],[1.72,.49],[1.72,.515],[.20,.49],[-.72,.35],[-1.88,.33]]);
      fill(ctx, column, paint.dark, [[1.95,0],[2.525,0],[2.525,1.1],[1.95,1.1]]);
    }
    fill(ctx, 2, paint.dark, [[-2.525,-1.1],[-1.94,-1.1],[-1.94,1.1],[-2.525,1.1]], true);
    fill(ctx, 2, paint.dark, [[-.10,-.16],[1.54,-.18],[1.78,-.12],[1.78,.12],[1.54,.18],[-.10,.16]], true);
    fill(ctx, 2, paint.accent, [[-.65,-.43],[.65,-.51],[1.68,-.38],[1.68,-.35],[.65,-.48],[-.65,-.40]], true);
    fill(ctx, 2, paint.accent, [[-.65,.40],[.65,.48],[1.68,.35],[1.68,.38],[.65,.51],[-.65,.43]], true);
    fill(ctx, 2, paint.dark, [[1.95,-1.1],[2.525,-1.1],[2.525,1.1],[1.95,1.1]], true);
  } else if (team === 'alpine') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // 2026 top/side reference: blue engine cover and sidepod carry the
      // large BWT/eni graphics; pink is concentrated at nose, halo and wing.
      fill(ctx, column, paint.secondary, [[-1.96,.37],[-.95,.36],[-.45,.48],[.12,.64],[.28,.70],[-.18,.84],[-.72,.65],[-1.50,.56],[-1.96,.54]]);
      fill(ctx, column, paint.dark, [[-1.84,.04],[-.68,.04],[.15,.1],[1.65,.14],[1.72,.27],[.13,.22],[-.76,.15],[-1.84,.13]]);
      fill(ctx, column, paint.secondary, [[1.96,0],[2.525,0],[2.525,1.1],[1.96,1.1]]);
    }
    fill(ctx, 2, paint.secondary, [[-1.95,-.21],[-.55,-.24],[.08,-.30],[.24,-.22],[.24,.22],[.08,.30],[-.55,.24],[-1.95,.21]], true);
    fill(ctx, 2, paint.secondary, [[1.96,-1.1],[2.525,-1.1],[2.525,1.1],[1.96,1.1]], true);
    fill(ctx, 2, paint.secondary, [[-2.525,-1.1],[-1.95,-1.1],[-1.95,1.1],[-2.525,1.1]], true);
    fill(ctx, 2, paint.dark, [[-2.525,-1.1],[-1.95,-1.1],[-1.95,-.47],[-2.525,-.47]], true);
    fill(ctx, 2, paint.dark, [[-2.525,.47],[-1.95,.47],[-1.95,1.1],[-2.525,1.1]], true);
  } else if (team === 'williams') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // The 2026 right profile has a blue upper side, a cyan Barclays pod,
      // and white only on the lower rear Komatsu panel.
      fill(ctx, column, paint.secondary, [[.48,.08],[1.76,.08],[1.76,.39],[.95,.37],[.48,.28]]);
      fill(ctx, column, paint.detail, [[-.82,.22],[-.20,.25],[.55,.32],[.97,.40],[.97,.59],[.20,.55],[-.50,.43],[-.82,.32]]);
      fill(ctx, column, paint.dark, [[-1.88,.04],[-.78,.04],[-.78,.21],[-1.88,.22]]);
    }
    // FW48 front wing is carbon/white around a blue nose, with the dark
    // portion carrying the Atlassian artwork in the inspected top view.
    fill(ctx, 2, paint.dark, [[-2.525,-1.1],[-1.94,-1.1],[-1.94,1.1],[-2.525,1.1]], true);
    fill(ctx, 2, paint.secondary, [[-2.46,-.86],[-2.13,-.79],[-2.13,-.49],[-2.46,-.52]], true);
    fill(ctx, 2, paint.secondary, [[-2.46,.52],[-2.13,.49],[-2.13,.79],[-2.46,.86]], true);
  } else if (team === 'haas') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      fill(ctx, column, paint.dark, [[-1.91,.20],[-.73,.24],[.08,.38],[.83,.46],[1.73,.48],[1.73,.60],[.75,.55],[.05,.48],[-.72,.34],[-1.91,.28]]);
      // The right-side VF-26 source has a broad rising red sweep behind the
      // cockpit, not the thin red sliver used by the previous prototype.
      fill(ctx, column, paint.accent, [[-.08,.67],[.42,.69],[1.02,.76],[1.48,.88],[1.72,.98],[1.72,1.1],[.92,1.1],[.32,.84]]);
      fill(ctx, column, paint.dark, [[.54,.86],[1.40,.98],[1.62,1.1],[1.31,1.1],[.46,.94]]);
      fill(ctx, column, paint.accent, [[-1.78,.16],[-1.28,.18],[-.85,.29],[-1.2,.29],[-1.78,.22]]);
      fill(ctx, column, paint.dark, [[1.96,.58],[2.525,.58],[2.525,1.1],[1.96,1.1]]);
    }
    fill(ctx, 2, paint.dark, [[.50,-.29],[1.67,-.31],[1.67,-.17],[1.67,.17],[1.67,.31],[.50,.29]], true);
    fill(ctx, 2, paint.dark, [[-2.525,-1.1],[-1.94,-1.1],[-1.94,1.1],[-2.525,1.1]], true);
    fill(ctx, 2, paint.primary, [[-2.48,-.68],[-2.08,-.56],[-2.08,-.28],[-2.48,-.43]], true);
    fill(ctx, 2, paint.primary, [[-2.48,.43],[-2.08,.28],[-2.08,.56],[-2.48,.68]], true);
    fill(ctx, 2, paint.accent, [[-2.22,-.73],[-2.13,-.68],[-2.13,-.44],[-2.22,-.49]], true);
    fill(ctx, 2, paint.accent, [[-2.22,.49],[-2.13,.44],[-2.13,.68],[-2.22,.73]], true);
    fill(ctx, 2, paint.dark, [[-.93,-.11],[-.20,-.17],[.23,-.14],[.23,.14],[-.20,.17],[-.93,.11]], true);
    fill(ctx, 2, paint.dark, [[1.96,-1.1],[2.525,-1.1],[2.525,1.1],[1.96,1.1]], true);
    fill(ctx, 2, paint.primary, [[2.02,-.78],[2.15,-.78],[2.48,-.34],[2.35,-.34]], true);
    fill(ctx, 2, paint.primary, [[2.02,.34],[2.15,.34],[2.48,.78],[2.35,.78]], true);
    fill(ctx, 2, paint.accent, [[2.03,-.28],[2.13,-.28],[2.48,.15],[2.38,.15]], true);
    fill(ctx, 2, paint.accent, [[2.03,.28],[2.13,.28],[2.48,-.15],[2.38,-.15]], true);
  } else if (team === 'audi') {
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, canvas.width, panel);
    for (const column of sides) {
      // The inspected right-profile photograph has titanium ahead of the
      // cockpit, a broad red rear sidepod, and carbon above and behind it.
      fill(ctx, column, paint.dark, [[.10,.55],[.85,.58],[1.72,.55],[1.72,1.1],[.10,1.1]]);
      fill(ctx, column, paint.accent, [[.68,.18],[1.78,.18],[1.78,.47],[1.08,.54],[.68,.40]]);
      fill(ctx, column, paint.dark, [[-.48,.04],[1.74,.04],[1.74,.13],[.25,.13],[-.48,.11]]);
      fill(ctx, column, paint.dark, [[-2.525,0],[-1.95,0],[-1.95,1.1],[-2.525,1.1]]);
      fill(ctx, column, paint.dark, [[1.88,0],[2.525,0],[2.525,1.1],[1.88,1.1]]);
    }
    fill(ctx, 2, paint.dark, [[.08,-.21],[1.82,-.34],[1.82,.34],[.08,.21]], true);
    fill(ctx, 2, paint.accent, [[.18,-.43],[.90,-.42],[1.32,-.19],[1.32,-.15],[.70,-.29],[.18,-.31]], true);
    fill(ctx, 2, paint.accent, [[.18,.31],[.70,.29],[1.32,.15],[1.32,.19],[.90,.42],[.18,.43]], true);
    fill(ctx, 2, paint.dark, [[1.95,-1.1],[2.525,-1.1],[2.525,1.1],[1.95,1.1]], true);
    fill(ctx, 2, paint.dark, [[-2.525,-1.1],[-1.95,-1.1],[-1.95,-.54],[-2.525,-.54]], true);
    fill(ctx, 2, paint.dark, [[-2.525,.54],[-1.95,.54],[-1.95,1.1],[-2.525,1.1]], true);
  } else {
    // Cadillac's February 2026 standard launch is intentionally asymmetric.
    // Physical left is light, physical right is dark; the Belgium revision is
    // NOT the canonical season-default for this local study.
    ctx.fillStyle = paint.dark; ctx.fillRect(0, 0, canvas.width, panel);
    ctx.fillStyle = paint.primary; ctx.fillRect(0, 0, panel, panel);
    fill(ctx, 0, paint.detail, [[-.78,.18],[-.22,.22],[.20,.18],[.58,.25],[1.56,.22],[1.56,.39],[.58,.43],[.20,.36],[-.22,.40],[-.78,.33]]);
    fill(ctx, 1, paint.secondary, [[-.78,.18],[-.22,.22],[.20,.18],[.58,.25],[1.56,.22],[1.56,.39],[.58,.43],[.20,.36],[-.22,.40],[-.78,.33]]);
    // topX mirrors model-space X: physical left occupies the right atlas half.
    ctx.fillStyle = paint.dark; ctx.fillRect(panel * 2, 0, panel, panel);
    ctx.fillStyle = paint.primary; ctx.fillRect(panel * 2 + panel / 2, 0, panel / 2, panel);
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
