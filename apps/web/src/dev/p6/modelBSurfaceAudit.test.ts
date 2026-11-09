import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  fitModelBSurface,
  probeModelBSurface,
  surfaceLimitsForArtwork,
  shouldEnableDetailedSurfaceQa,
  WORDMARK_LIMITS,
} from './modelBSurfaceAudit';
import type { SurfaceAnchorMap } from './liveryDefinitions';

function plane(side: 'right' | 'left' | 'top' | 'rear'): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  );
  if (side === 'right') { mesh.rotation.y = Math.PI / 2; mesh.position.x = 0.65; }
  if (side === 'left') { mesh.rotation.y = -Math.PI / 2; mesh.position.x = -0.65; }
  if (side === 'top') { mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.75; }
  if (side === 'rear') mesh.position.z = 2;
  mesh.updateMatrixWorld(true);
  return mesh;
}

function anchor(side: SurfaceAnchorMap['side']): SurfaceAnchorMap {
  return {
    side, y: side === 'top' ? 0.75 : 0,
    z: side === 'rear' ? 2 : 0,
    x: 0, width: 0.8, height: 0.4, depth: 0.15, rotation: 0, offset: 0.004,
  };
}

describe('Model B surface acceptance', () => {
  it.each(['right', 'left', 'top', 'rear'] as const)(
    'accepts a continuous planar %s panel',
    (side) => {
      const result = probeModelBSurface(plane(side), anchor(side));
      expect(result.accepted).toBe(true);
      expect(result.coverage).toBe(1);
      expect(result.normalSpreadDegrees).toBeLessThan(0.01);
      expect(result.stretchRatio).toBeCloseTo(1, 5);
      expect(result.center).not.toBeNull();
    },
  );

  it('refuses an anchor projected onto the opposite side', () => {
    const result = probeModelBSurface(plane('right'), anchor('left'));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('missing-surface');
  });

  it('refuses missing panel coverage rather than rendering a clipped word', () => {
    const target = plane('right');
    const placement = { ...anchor('right'), z: 4 };
    const result = probeModelBSurface(target, placement);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('missing-surface');
  });

  it('rejects text on a strongly curved sphere', () => {
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 16),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    );
    target.updateMatrixWorld(true);
    const result = probeModelBSurface(
      target,
      { ...anchor('right'), width: 1.2, height: 0.9 },
      WORDMARK_LIMITS,
    );
    expect(result.accepted).toBe(false);
    expect(['folded', 'stretched']).toContain(result.reason);
    expect(result.normalSpreadDegrees).toBeGreaterThan(15);
  });

  it('uniformly shrinks an oversized wordmark without changing its aspect ratio', () => {
    const target = plane('right');
    const original = { ...anchor('right'), width: 2.4 };
    const result = fitModelBSurface(target, original);
    expect(result.probe.accepted).toBe(true);
    expect(result.adapted).toBe(true);
    expect(result.anchor.width / result.anchor.height).toBeCloseTo(
      original.width / original.height,
      5,
    );
    expect(result.anchor.width).toBeLessThan(original.width);
  });

  it('uses stricter surface limits for words than for symbol-only marks', () => {
    expect(surfaceLimitsForArtwork('oracle').maxNormalDegrees).toBeLessThan(
      surfaceLimitsForArtwork('shell').maxNormalDegrees,
    );
  });
  it('does not run costly mesh scans on normal Showroom or author-mode loads', () => {
    expect(shouldEnableDetailedSurfaceQa(true, '')).toBe(false);
    expect(shouldEnableDetailedSurfaceQa(true, '?author=1')).toBe(false);
    expect(shouldEnableDetailedSurfaceQa(true, '?review=model-b')).toBe(false);
    expect(shouldEnableDetailedSurfaceQa(false, '?surfaceQa=1')).toBe(false);
    expect(shouldEnableDetailedSurfaceQa(true, '?surfaceQa=1')).toBe(true);
    expect(shouldEnableDetailedSurfaceQa(true, '?author=1&surfaceQa=1')).toBe(true);
  });

});
