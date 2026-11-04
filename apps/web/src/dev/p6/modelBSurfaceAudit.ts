import * as THREE from 'three';
import type { SurfaceAnchorMap } from './liveryDefinitions';

/**
 * Runtime surface checks for the prepared (rotated, centred, 5.05-unit) Model B.
 * A raycast hit is NOT proof a logo fits: check coverage, normal spread and
 * stretching over the whole prospective footprint before allocating a decal.
 */
export interface SurfaceProbe {
  accepted: boolean;
  reason: 'ok' | 'missing-surface' | 'clipped' | 'folded' | 'stretched' | 'floating';
  coverage: number;
  normalSpreadDegrees: number;
  stretchRatio: number;
  depthRange: number;
  center: THREE.Vector3 | null;
}

export interface SurfaceLimits {
  minCoverage: number;
  maxNormalDegrees: number;
  maxStretchRatio: number;
  maxDepthRange?: number;
}

export interface SurfacePlacement {
  anchor: SurfaceAnchorMap;
  probe: SurfaceProbe;
  adapted: boolean;
}

export const WORDMARK_LIMITS: Readonly<SurfaceLimits> = Object.freeze({
  minCoverage: 0.90,
  maxNormalDegrees: 15,
  maxStretchRatio: 1.14,
});

export const SYMBOL_LIMITS: Readonly<SurfaceLimits> = Object.freeze({
  minCoverage: 0.84,
  maxNormalDegrees: 28,
  maxStretchRatio: 1.24,
});

/** Only unmistakably icon-only artwork gets the more forgiving curvature limit. */
const SYMBOL_ARTWORK = new Set([
  'ferrari', 'mercedes', 'audi', 'mastercard', 'shell', 'redbullGraphic',
  'haasSidepod', 'cadillacDark', 'cadillac',
]);

export function surfaceLimitsForArtwork(artworkKey: string): Readonly<SurfaceLimits> {
  return SYMBOL_ARTWORK.has(artworkKey) ? SYMBOL_LIMITS : WORDMARK_LIMITS;
}

type Sample = { point: THREE.Vector3; normal: THREE.Vector3 } | null;

function originAndDirection(
  side: SurfaceAnchorMap['side'],
  x: number,
  y: number,
  z: number,
  bounds: THREE.Box3,
): { origin: THREE.Vector3; direction: THREE.Vector3 } {
  if (side === 'left') {
    return { origin: new THREE.Vector3(bounds.min.x - 1, y, z), direction: new THREE.Vector3(1, 0, 0) };
  }
  if (side === 'right') {
    return { origin: new THREE.Vector3(bounds.max.x + 1, y, z), direction: new THREE.Vector3(-1, 0, 0) };
  }
  if (side === 'top') {
    return { origin: new THREE.Vector3(x, bounds.max.y + 1, z), direction: new THREE.Vector3(0, -1, 0) };
  }
  return { origin: new THREE.Vector3(x, y, bounds.max.z + 1), direction: new THREE.Vector3(0, 0, -1) };
}

function samplePosition(anchor: SurfaceAnchorMap, u: number, v: number): [number, number, number] {
  if (anchor.side === 'left' || anchor.side === 'right') {
    return [anchor.x ?? 0, anchor.y + (v - 0.5) * anchor.height, anchor.z + (u - 0.5) * anchor.width];
  }
  if (anchor.side === 'top') {
    return [(anchor.x ?? 0) + (u - 0.5) * anchor.width, anchor.y, anchor.z + (v - 0.5) * anchor.height];
  }
  return [(anchor.x ?? 0) + (u - 0.5) * anchor.width, anchor.y + (v - 0.5) * anchor.height, anchor.z];
}

function depthOf(point: THREE.Vector3, side: SurfaceAnchorMap['side']): number {
  if (side === 'left' || side === 'right') return point.x;
  return side === 'top' ? point.y : point.z;
}

const raycaster = new THREE.Raycaster();

/**
 * Measure the real triangle surface, not its UV bounds or a material-name proxy.
 * This is deliberately a fast 5x5 sample; final visual approval is still needed.
 */
export function probeModelBSurface(
  mesh: THREE.Mesh,
  anchor: SurfaceAnchorMap,
  limits: Readonly<SurfaceLimits> = WORDMARK_LIMITS,
): SurfaceProbe {
  const rejected = (
    reason: SurfaceProbe['reason'],
    coverage = 0,
    normalSpreadDegrees = 0,
    stretchRatio = 1,
    depthRange = 0,
    center: THREE.Vector3 | null = null,
  ): SurfaceProbe => ({ accepted: false, reason, coverage, normalSpreadDegrees, stretchRatio, depthRange, center });

  if (!(anchor.width > 0) || !(anchor.height > 0)) return rejected('missing-surface');
  mesh.updateWorldMatrix(true, false);
  const bounds = new THREE.Box3().setFromObject(mesh);
  if (bounds.isEmpty()) return rejected('missing-surface');

  const columns = 5;
  const rows = 5;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const samples: Sample[] = [];
  let hitCount = 0;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const u = column / (columns - 1);
      const v = row / (rows - 1);
      const [x, y, z] = samplePosition(anchor, u, v);
      const { origin, direction } = originAndDirection(anchor.side, x, y, z, bounds);
      raycaster.set(origin, direction);
      // Side-pod decals must not accidentally hit the opposite physical side.
      const hit = raycaster.intersectObject(mesh, false).find((candidate) => {
        if (anchor.side === 'left') return candidate.point.x < -0.015;
        if (anchor.side === 'right') return candidate.point.x > 0.015;
        return true;
      });
      if (!hit?.face) {
        samples.push(null);
        continue;
      }
      hitCount += 1;
      samples.push({
        point: hit.point.clone(),
        normal: hit.face.normal.clone().applyMatrix3(normalMatrix).normalize(),
      });
    }
  }

  const coverage = hitCount / (columns * rows);
  const center = samples[12]?.point.clone() ?? null;
  if (coverage === 0 || !center) return rejected('missing-surface', coverage, 0, 1, 0, center);

  const centerNormal = samples[12]!.normal;
  let spread = 0;
  let minDepth = Infinity;
  let maxDepth = -Infinity;
  let maxStretch = 1;

  for (let i = 0; i < samples.length; i++) {
    const current = samples[i];
    if (!current) continue;
    const cosine = THREE.MathUtils.clamp(centerNormal.dot(current.normal), -1, 1);
    spread = Math.max(spread, THREE.MathUtils.radToDeg(Math.acos(cosine)));
    const depth = depthOf(current.point, anchor.side);
    minDepth = Math.min(minDepth, depth);
    maxDepth = Math.max(maxDepth, depth);
    for (const [otherIndex, expected] of [
      [i % columns < columns - 1 ? i + 1 : -1, anchor.width / (columns - 1)],
      [i + columns < samples.length ? i + columns : -1, anchor.height / (rows - 1)],
    ] as const) {
      const neighbor = otherIndex >= 0 ? samples[otherIndex] : null;
      if (!neighbor) continue;
      const ratio = current.point.distanceTo(neighbor.point) / expected;
      if (Number.isFinite(ratio) && ratio > 0) maxStretch = Math.max(maxStretch, ratio, 1 / ratio);
    }
  }

  const depthRange = maxDepth - minDepth;
  if (coverage < limits.minCoverage) return rejected('clipped', coverage, spread, maxStretch, depthRange, center);
  if (spread > limits.maxNormalDegrees) return rejected('folded', coverage, spread, maxStretch, depthRange, center);
  if (maxStretch > limits.maxStretchRatio) return rejected('stretched', coverage, spread, maxStretch, depthRange, center);
  if (limits.maxDepthRange !== undefined && depthRange > limits.maxDepthRange) {
    return rejected('floating', coverage, spread, maxStretch, depthRange, center);
  }
  return { accepted: true, reason: 'ok', coverage, normalSpreadDegrees: spread, stretchRatio: maxStretch, depthRange, center };
}

/**
 * Prefer original art placement. Then try uniformly smaller logos and small
 * translations within the same semantic panel, never scale X/Y independently.
 */
export function fitModelBSurface(
  mesh: THREE.Mesh,
  original: SurfaceAnchorMap,
  limits: Readonly<SurfaceLimits> = WORDMARK_LIMITS,
): SurfacePlacement {
  const direct = probeModelBSurface(mesh, original, limits);
  if (direct.accepted) return { anchor: original, probe: direct, adapted: false };

  let best: SurfacePlacement = { anchor: original, probe: direct, adapted: false };
  for (const scale of [0.88, 0.72]) {
    for (const [offsetU, offsetV] of [[0, 0], [-0.12, 0], [0.12, 0], [0, -0.12], [0, 0.12]]) {
      const anchor = { ...original, width: original.width * scale, height: original.height * scale };
      if (original.side === 'left' || original.side === 'right') {
        anchor.z += offsetU * original.width;
        anchor.y += offsetV * original.height;
      } else if (original.side === 'top') {
        anchor.x = (anchor.x ?? 0) + offsetU * original.width;
        anchor.z += offsetV * original.height;
      } else {
        anchor.x = (anchor.x ?? 0) + offsetU * original.width;
        anchor.y += offsetV * original.height;
      }
      const probe = probeModelBSurface(mesh, anchor, limits);
      if (probe.accepted) return { anchor, probe, adapted: true };
      const quality = (item: SurfaceProbe) =>
        item.coverage - item.normalSpreadDegrees / 100 - (item.stretchRatio - 1);
      if (quality(probe) > quality(best.probe)) best = { anchor, probe, adapted: true };
    }
  }
  return best;
}
