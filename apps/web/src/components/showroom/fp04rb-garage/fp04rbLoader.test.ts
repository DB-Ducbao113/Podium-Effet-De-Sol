import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FP04RB_PAINTABLE_SLOTS,
  FP04RB_PART_MANIFEST,
  FP04RB_REQUIRED_NODES,
  FP04RB_SHOWROOM_URLS,
  clearFp04rbCache,
  cloneFp04rbCarInstance,
  disposeFp04rbInstance,
  getCachedFp04rbCount,
  loadFp04rbShowroomModel,
  type CachedFp04rbAsset,
} from './fp04rbLoader';

function buildSyntheticFp04rbScene(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'FP04RB_CAR_ROOT';

  const makeMesh = (name: string, matName: string) => {
    const geo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
    const mat = new THREE.MeshStandardMaterial({ name: matName });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    return mesh;
  };

  for (const nodeName of FP04RB_REQUIRED_NODES) {
    if (nodeName === 'FP04RB_CAR_ROOT') continue;
    const matName = nodeName.includes('BODY')
      ? 'main_body_texture'
      : nodeName.includes('FRONT_WING')
        ? 'front_wing_texture'
        : nodeName.includes('REAR_WING')
          ? 'rear_wing_texture'
          : 'carbon_satin';
    const child = makeMesh(nodeName, matName);
    if (nodeName.startsWith('WHEEL_PIVOT_')) {
      child.position.set(nodeName.endsWith('L') ? 0.8 : -0.8, 0.35, 1.8);
    }
    root.add(child);
  }
  return root;
}

describe('fp04rbLoader & partManifest integration', () => {
  afterEach(() => {
    clearFp04rbCache();
    vi.restoreAllMocks();
  });

  it('pins desktop and mobile GLB URLs plus P1 manifest wheel removal capability', () => {
    expect(FP04RB_SHOWROOM_URLS).toEqual({
      desktop: '/models/fp04rb-showroom-desktop.glb',
      mobile: '/models/fp04rb-showroom-mobile.glb',
    });
    expect(FP04RB_PART_MANIFEST.model.id).toBe('fp04rb');
    expect(FP04RB_PART_MANIFEST.capabilities.wheelRemoval.supported).toBe(true);
    expect(FP04RB_PAINTABLE_SLOTS).toContain('main_body_texture');
  });

  it('aborts cleanly before network access when signal is already aborted', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const controller = new AbortController();
    controller.abort();

    await expect(
      loadFp04rbShowroomModel('desktop', controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getCachedFp04rbCount()).toBe(0);
  });

  it('clones independent material slots per car bay and disposes only instance-owned resources', () => {
    const template = buildSyntheticFp04rbScene();
    const asset: CachedFp04rbAsset = {
      lod: 'desktop',
      url: FP04RB_SHOWROOM_URLS.desktop,
      template,
      bytes: 5534176,
      fetchMs: 12,
      decodeParseMs: 18,
      triangles: 230242,
      meshCount: 21,
    };

    const bay1 = cloneFp04rbCarInstance(asset);
    const bay2 = cloneFp04rbCarInstance(asset);

    expect(bay1.corners.FL.wheelPivot).not.toBeNull();
    expect(bay1.corners.FL.brakeAssembly).not.toBeNull();
    expect(bay1.corners.FL.extractSign).toBe(1);
    expect(bay1.corners.FR.extractSign).toBe(-1);

    const bay1Body = bay1.paintMaterials.get('main_body_texture')?.[0];
    const bay2Body = bay2.paintMaterials.get('main_body_texture')?.[0];
    expect(bay1Body).toBeDefined();
    expect(bay2Body).toBeDefined();
    expect(bay1Body).not.toBe(bay2Body);

    const dynamicTex = new THREE.DataTexture(new Uint8Array(16), 2, 2);
    const texDispose = vi.spyOn(dynamicTex, 'dispose');
    const matDispose = vi.spyOn(bay1Body!, 'dispose');
    bay1.ownedTextures.push(dynamicTex);

    disposeFp04rbInstance(bay1);
    expect(texDispose).toHaveBeenCalledOnce();
    expect(matDispose).toHaveBeenCalledOnce();
    expect(bay1.ownedMaterials).toHaveLength(0);

    // Bay 2 materials remain intact after Bay 1 instance disposal
    expect(bay2.paintMaterials.get('main_body_texture')?.[0]).toBe(bay2Body);
    disposeFp04rbInstance(bay2);
  });

  it('FAILURE-REPORT-02 regression: wraps GLTFLoader with configureCspSafeGltfLoader in both fp04rbLoader and pitCrewLoader', () => {
    const carLoaderSrc = readFileSync(
      'src/components/showroom/fp04rb-garage/fp04rbLoader.ts',
      'utf8',
    );
    const crewLoaderSrc = readFileSync(
      'src/components/showroom/fp04rb-garage/pitCrewLoader.ts',
      'utf8',
    );
    expect(carLoaderSrc).toContain('configureCspSafeGltfLoader(');
    expect(crewLoaderSrc).toContain('configureCspSafeGltfLoader(');
  });
});
