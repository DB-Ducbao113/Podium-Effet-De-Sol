import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPrefetchedGlbCache,
  prefetchGlbArrayBuffer,
} from "../storm/modelPrefetchCache";
import {
  applyMaterialXrayVisibility,
  clearEngineeringGlbCache,
  configureCspSafeGltfLoader,
  disposeEngineeringInstanceMaterials,
  disposeThreeSceneResources,
  getCachedEngineeringGlbCount,
  loadEngineeringGlbTemplate,
  resolveEngineeringMaterialSide,
  snapshotAuthoredMaterialState,
} from "./engineeringGlbLoader";

describe("Engineering CSP-safe GLB loader & authored material preservation", () => {
  it("replaces ImageBitmapLoader with TextureLoader on GLTFParser registration", () => {
    const loader = new GLTFLoader();
    let capturedCallback:
      | ((parser: {
          options: { manager: THREE.LoadingManager; crossOrigin: string };
          textureLoader: unknown;
        }) => { name: string })
      | null = null;
    const registerSpy = vi
      .spyOn(loader, "register")
      .mockImplementation((cb) => {
        capturedCallback = cb as typeof capturedCallback;
        return loader;
      });

    configureCspSafeGltfLoader(loader);
    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(capturedCallback).not.toBeNull();

    const fakeParser = {
      options: {
        manager: new THREE.LoadingManager(),
        crossOrigin: "anonymous",
      },
      textureLoader: { isImageBitmapLoader: true },
    };
    const plugin = capturedCallback!(fakeParser);
    expect(plugin.name).toBe("PEDS_CSP_SAFE_TEXTURE_LOADER");
    expect(fakeParser.textureLoader).toBeInstanceOf(THREE.TextureLoader);
  });

  it("preserves exact authored alpha-blend transparency for glass (0.10) and texture-alpha decals (1.0) across X-Ray toggles", () => {
    // 1. glass_clear_headlight (alphaMode: BLEND, baseColorFactor[3] = 0.10, no texture)
    const glass = new THREE.MeshPhysicalMaterial({
      name: "glass_clear_headlight",
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      roughness: 0.06,
      metalness: 0.05,
    });
    // 2. ferrari-logo-png-transparent (alphaMode: BLEND, opacity 1.0, WebP alpha texture)
    const logoDecal = new THREE.MeshStandardMaterial({
      name: "ferrari-logo-png-transparent",
      transparent: true,
      opacity: 1,
      depthWrite: false,
      roughness: 0.5,
      metalness: 0,
    });
    // 3. Opaque carbon bodywork
    const carbon = new THREE.MeshPhysicalMaterial({
      name: "main_body_texture",
      transparent: false,
      opacity: 1,
      depthWrite: true,
      clearcoat: 1,
    });

    snapshotAuthoredMaterialState(glass);
    snapshotAuthoredMaterialState(logoDecal);
    snapshotAuthoredMaterialState(carbon);

    // Non-X-Ray pass must NOT corrupt transparent materials into opaque
    applyMaterialXrayVisibility(glass, false);
    applyMaterialXrayVisibility(logoDecal, false);
    applyMaterialXrayVisibility(carbon, false);

    expect(glass.transparent).toBe(true);
    expect(glass.opacity).toBeCloseTo(0.1, 5);
    expect(glass.depthWrite).toBe(false);

    expect(logoDecal.transparent).toBe(true);
    expect(logoDecal.opacity).toBe(1);
    expect(logoDecal.depthWrite).toBe(false);

    expect(carbon.transparent).toBe(false);
    expect(carbon.opacity).toBe(1);
    expect(carbon.depthWrite).toBe(true);

    // X-Ray cutaway enabled
    applyMaterialXrayVisibility(glass, true);
    applyMaterialXrayVisibility(logoDecal, true);
    applyMaterialXrayVisibility(carbon, true);

    expect(glass.opacity).toBeCloseTo(0.1, 5); // never raises glass opacity above authored 0.10
    expect(logoDecal.opacity).toBeCloseTo(0.16, 5);
    expect(carbon.transparent).toBe(true);
    expect(carbon.opacity).toBeCloseTo(0.16, 5);
    expect(carbon.depthWrite).toBe(false);

    // X-Ray cutaway disabled -> exact restoration
    applyMaterialXrayVisibility(glass, false);
    applyMaterialXrayVisibility(logoDecal, false);
    applyMaterialXrayVisibility(carbon, false);

    expect(glass.transparent).toBe(true);
    expect(glass.opacity).toBeCloseTo(0.1, 5);
    expect(logoDecal.transparent).toBe(true);
    expect(logoDecal.opacity).toBe(1);
    expect(carbon.transparent).toBe(false);
    expect(carbon.opacity).toBe(1);
    expect(carbon.depthWrite).toBe(true);
  });

  it("deduplicates and disposes geometries, textures, and both cloned and original materials", () => {
    const tex = new THREE.DataTexture(
      new Uint8Array([255, 255, 255, 255]),
      1,
      1,
    );
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const origMat = new THREE.MeshStandardMaterial({ map: tex });
    const clonedMat = origMat.clone();

    const texSpy = vi.spyOn(tex, "dispose");
    const geoSpy = vi.spyOn(geo, "dispose");
    const origSpy = vi.spyOn(origMat, "dispose");
    const clonedSpy = vi.spyOn(clonedMat, "dispose");

    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, clonedMat));
    group.add(new THREE.Mesh(geo, clonedMat));

    const stats = disposeThreeSceneResources(group, [origMat]);
    expect(stats).toEqual({ geometries: 1, materials: 2, textures: 1 });
    expect(texSpy).toHaveBeenCalledTimes(1);
    expect(geoSpy).toHaveBeenCalledTimes(1);
    expect(origSpy).toHaveBeenCalledTimes(1);
    expect(clonedSpy).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    clearEngineeringGlbCache();
    clearPrefetchedGlbCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("preserves FrontSide backface culling on closed internal parts while allowing DoubleSide on outer shells or authored double-sided materials", () => {
    expect(resolveEngineeringMaterialSide(false, THREE.FrontSide)).toBe(
      THREE.FrontSide,
    );
    expect(resolveEngineeringMaterialSide(true, THREE.FrontSide)).toBe(
      THREE.DoubleSide,
    );
    expect(resolveEngineeringMaterialSide(false, THREE.DoubleSide)).toBe(
      THREE.DoubleSide,
    );
  });

  it("disposes only cloned instance materials without disposing shared template geometry or textures", () => {
    const sharedTex = new THREE.DataTexture(
      new Uint8Array([255, 255, 255, 255]),
      1,
      1,
    );
    const clonedMat = new THREE.MeshStandardMaterial({ map: sharedTex });
    const texSpy = vi.spyOn(sharedTex, "dispose");
    const matSpy = vi.spyOn(clonedMat, "dispose");

    const disposed = disposeEngineeringInstanceMaterials([
      clonedMat,
      clonedMat,
    ]);
    expect(disposed).toBe(1);
    expect(matSpy).toHaveBeenCalledTimes(1);
    expect(texSpy).not.toHaveBeenCalled();
    sharedTex.dispose();
  });

  it("caches parsed Engineering GLB template across revisits and consumes prefetched bytes without duplicate network fetches", async () => {
    const fakeBytes = new Uint8Array([1, 2, 3, 4]).buffer;
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-length": "4" }),
      arrayBuffer: async () => fakeBytes,
    });
    vi.stubGlobal("fetch", fetchSpy);

    const parsedGroup = new THREE.Group();
    const parseSpy = vi
      .spyOn(GLTFLoader.prototype, "parseAsync")
      .mockResolvedValue({ scene: parsedGroup } as never);

    // Pre-warm bytes via route hover prefetcher (no Three.js needed)
    const url = "/models/fp04rb-engineering-v1.glb";
    await prefetchGlbArrayBuffer(url);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // First mount consumes prefetched ArrayBuffer — still only 1 fetch total
    const first = await loadEngineeringGlbTemplate(url);
    expect(first.template).toBe(parsedGroup);
    expect(first.bytes).toBe(4);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(parseSpy).toHaveBeenCalledTimes(1);
    expect(getCachedEngineeringGlbCount()).toBe(1);

    // Return visit hits module cache — 0 additional fetch or parse calls
    const second = await loadEngineeringGlbTemplate(url);
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(parseSpy).toHaveBeenCalledTimes(1);

    // Negative control: pre-aborted signal rejects cleanly
    const ac = new AbortController();
    ac.abort();
    await expect(
      loadEngineeringGlbTemplate("/models/other.glb", { signal: ac.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("enforces unified MeshoptDecoder import, demand frameloop, capped DPR, and async shader precompile", () => {
    const stageSrc = readFileSync(
      "src/components/engineering/EngineeringDisassemblyStage.tsx",
      "utf8",
    );
    const loaderSrc = readFileSync(
      "src/components/engineering/engineeringGlbLoader.ts",
      "utf8",
    );
    const showroomLoaderSrc = readFileSync(
      "src/components/showroom/fp04rb-garage/fp04rbLoader.ts",
      "utf8",
    );
    const crewLoaderSrc = readFileSync(
      "src/components/showroom/fp04rb-garage/pitCrewLoader.ts",
      "utf8",
    );

    // Zero barrel imports from "meshoptimizer" (which pulls 47 kB meshopt_simplifier into client bundle)
    for (const src of [stageSrc, loaderSrc, showroomLoaderSrc, crewLoaderSrc]) {
      expect(src).not.toMatch(/from\s+["']meshoptimizer["']/);
    }
    expect(loaderSrc).toContain(
      "three/examples/jsm/libs/meshopt_decoder.module.js",
    );
    expect(showroomLoaderSrc).toContain(
      "three/examples/jsm/libs/meshopt_decoder.module.js",
    );
    expect(crewLoaderSrc).toContain(
      "three/examples/jsm/libs/meshopt_decoder.module.js",
    );

    // Engineering stage GPU & main-thread discipline
    expect(stageSrc).toContain('frameloop="demand"');
    expect(stageSrc).toContain("dpr={[1, 1.5]}");
    expect(stageSrc).toContain("gl.compileAsync");
  });
});
