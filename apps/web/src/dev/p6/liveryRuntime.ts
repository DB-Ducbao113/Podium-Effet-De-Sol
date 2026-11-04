import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { TeamLivery } from './teamLiveries';
import { artwork, type ArtworkKey } from './officialArtwork';
import { createPaintAtlas, type PrecisionTeam } from './paintAtlas';
import { liveryDefinitions, type SurfaceAnchorMap } from './liveryDefinitions';

type Decal = { mesh: THREE.Mesh; key: ArtworkKey; id: string };
type AtlasRect = { u: number; v: number; w: number; h: number };
type DecalAtlas = { map: THREE.CanvasTexture; rects: Partial<Record<ArtworkKey, AtlasRect>> };
const vector = new THREE.Vector3();

function zoneColor(team: TeamLivery, x: number, y: number, z: number): string {
  if (team.id === 'cadillac') {
    // Debut livery test: white physical left, black physical right. Not the later 2026 look.
    if (z < -1.88 || z > 1.96) return x < 0 ? '#e6e6e2' : '#121416';
    if (x < -0.055) return y > 0.55 && z > 0.55 ? '#e6e6e2' : '#d4d7d5';
    if (x > 0.055) return y > 0.55 && z > 0.55 ? '#16191b' : '#111315';
    return '#929a9d';
  }
  if (team.id === 'mclaren' && z > 0.18 && z < 1.58 && y > .4) return team.secondary;
  if (z < -1.88 || z > 1.96) return team.wing;
  if (z < -0.75 && Math.abs(x) < 0.29) return team.nose;
  if (z > 0.67 && y > 0.54) return team.cover;
  if (Math.abs(x) > 0.32 && z > -0.48 && z < 0.94) {
    if (y > 0.53 && y < 0.59) return team.accent;
    return team.side;
  }
  return team.primary;
}

async function loadArtwork(key: ArtworkKey): Promise<THREE.Texture> {
  const spec = artwork[key];
  const image = new Image();
  image.src = spec.url;
  await image.decode();
  if (!spec.matte && !spec.darkInk && !spec.inkColor && !spec.removeBlackBackground) {
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  if (spec.removeBlackBackground) {
    // The publisher's monochrome badge has an opaque black exterior. Flood
    // only edge-connected black so the enclosed horse remains intact.
    const width = canvas.width, height = canvas.height;
    const seen = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;
    const push = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const index = y * width + x, offset = index * 4;
      if (seen[index] || Math.max(data[offset], data[offset + 1], data[offset + 2]) > 42) return;
      seen[index] = 1; queue[tail++] = index;
    };
    for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
    for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
    while (head < tail) {
      const index = queue[head++], x = index % width, y = Math.floor(index / width);
      data[index * 4 + 3] = 0;
      push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
    }
  }
  const background = spec.matte === 'white' ? [255, 255, 255] : [239, 239, 239];
  const inkBytes = spec.inkColor ? [1, 3, 5].map((offset) => Number.parseInt(spec.inkColor!.slice(offset, offset + 2), 16)) : null;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (spec.matte) {
      const distance = Math.max(Math.abs(data[offset] - background[0]), Math.abs(data[offset + 1] - background[1]), Math.abs(data[offset + 2] - background[2]));
      data[offset + 3] = Math.round(Math.min(1, Math.max(0, (distance - 8) / 35)) * data[offset + 3]);
    }
    if (spec.darkInk) data[offset] = data[offset + 1] = data[offset + 2] = 20;
    if (inkBytes && data[offset + 3] > 0) { data[offset] = inkBytes[0]; data[offset + 1] = inkBytes[1]; data[offset + 2] = inkBytes[2]; }
    if (spec.invertDark && data[offset] < 95 && data[offset + 1] < 95 && data[offset + 2] < 95) data[offset] = data[offset + 1] = data[offset + 2] = 245;
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createLiveryRuntime(model: THREE.Group, scene: THREE.Scene) {
  let body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> | null = null;
  const accents: THREE.MeshStandardMaterial[] = [];
  model.updateMatrixWorld(true);
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return;
    if (object.material.name === 'PEDS_Graphite_Auto_Paint') body = object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    if (object.material.name === 'PEDS_Crimson_Accent' && !accents.includes(object.material)) accents.push(object.material);
  });
  if (!body) throw new Error('Model B body paint mesh not found');
  const paintMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> = body;
  const positions = paintMesh.geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const target = new Float32Array(colors.length);
  const attribute = new THREE.BufferAttribute(colors, 3);
  paintMesh.geometry.setAttribute('color', attribute);
  paintMesh.material.color.set('#ffffff');
  paintMesh.material.vertexColors = true;
  paintMesh.material.needsUpdate = true;
  const decals: Decal[] = [];
  const wheelDetails: THREE.Mesh[] = [];
  const authorOverrides = new Map<string, SurfaceAnchorMap>();
  const undoStack: string[] = [];
  const redoStack: string[] = [];
  const authorStorageKey = 'p6-2026-author-overrides-v1';
  const authorMode = new URLSearchParams(location.search).get('author') === '1';
  let selectedDecalId: string | null = null;
  let boxes: THREE.BoxHelper[] = [];
  try { Object.entries(JSON.parse(localStorage.getItem(authorStorageKey) || '{}') as Record<string, SurfaceAnchorMap>).forEach(([id, anchor]) => authorOverrides.set(id, anchor)); } catch { /* isolated dev state */ }
  const textureCache = new Map<ArtworkKey, Promise<THREE.Texture>>();
  const decalAtlases = new Map<string, Promise<DecalAtlas>>();
  let paintFrom: THREE.CanvasTexture | null = null;
  let paintTo: THREE.CanvasTexture | null = null;
  let paintElapsed = 0;
  let paintDuration = .48;
  let paintFrames = 0;
  let paintFromMcLaren = 0;
  let paintToMcLaren = 0;
  const emptyPaintTexture = new THREE.Texture();
  const paintUniforms = { uPaintAtlasFrom: { value: emptyPaintTexture as THREE.Texture }, uPaintAtlasTo: { value: emptyPaintTexture as THREE.Texture }, uPaintBlend: { value: 1 }, uUsePaintAtlas: { value: 0 }, uDebugUv: { value: 0 }, uFromMcLaren: { value: 0 }, uToMcLaren: { value: 0 } };
  paintMesh.material.onBeforeCompile = (shader) => {
    shader.uniforms.uPaintAtlasFrom = paintUniforms.uPaintAtlasFrom;
    shader.uniforms.uPaintAtlasTo = paintUniforms.uPaintAtlasTo;
    shader.uniforms.uPaintBlend = paintUniforms.uPaintBlend;
    shader.uniforms.uUsePaintAtlas = paintUniforms.uUsePaintAtlas;
    shader.uniforms.uDebugUv = paintUniforms.uDebugUv;
    shader.uniforms.uFromMcLaren = paintUniforms.uFromMcLaren;
    shader.uniforms.uToMcLaren = paintUniforms.uToMcLaren;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPaintPoint;\nvarying vec3 vPaintNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintPoint = (modelMatrix * vec4(position, 1.0)).xyz;\nvPaintNormal = normalize(mat3(modelMatrix) * normal);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPaintPoint;\nvarying vec3 vPaintNormal;\nuniform sampler2D uPaintAtlasFrom;\nuniform sampler2D uPaintAtlasTo;\nuniform float uPaintBlend;\nuniform float uUsePaintAtlas;\nuniform float uDebugUv;\nuniform float uFromMcLaren;\nuniform float uToMcLaren;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (uUsePaintAtlas > 0.5) {
          float depth = clamp((vPaintPoint.z + 2.525) / 5.05, 0.001, 0.999);
          float side = vPaintPoint.x < 0.0 ? 0.0 : 1.0;
          vec2 sideUv = vec2((side + depth) / 3.0, clamp(vPaintPoint.y / 1.1, 0.001, 0.999));
          vec2 topUv = vec2((2.0 + depth) / 3.0, clamp((vPaintPoint.x + 1.1) / 2.2, 0.001, 0.999));
          // Model B's shared paint mesh reaches much farther sideways at the
          // wings and upper sidepods. Use their measured width for the ten
          // remaining teams; preserve McLaren's approved narrow body blend.
          float standardWidth = vPaintPoint.z < -1.82 ? 0.96 : vPaintPoint.z > 1.94 ? 0.80 : 0.56;
          float mclarenWidth = vPaintPoint.z < -1.82 ? 0.96 : 0.24;
          float fromWidth = mix(standardWidth, mclarenWidth, uFromMcLaren);
          float toWidth = mix(standardWidth, mclarenWidth, uToMcLaren);
          float upward = smoothstep(0.91, 0.98, vPaintNormal.y);
          float fromWeight = upward * (1.0 - smoothstep(fromWidth - 0.08, fromWidth, abs(vPaintPoint.x)));
          float toWeight = upward * (1.0 - smoothstep(toWidth - 0.08, toWidth, abs(vPaintPoint.x)));
          vec3 fromPaint = mix(texture2D(uPaintAtlasFrom, sideUv).rgb, texture2D(uPaintAtlasFrom, topUv).rgb, fromWeight);
          vec3 toPaint = mix(texture2D(uPaintAtlasTo, sideUv).rgb, texture2D(uPaintAtlasTo, topUv).rgb, toWeight);
          diffuseColor.rgb = mix(fromPaint, toPaint, uPaintBlend);
          if (uDebugUv > 0.5) {
            vec2 localUv = toWeight > 0.5 ? topUv : sideUv;
            vec2 grid = abs(fract(localUv * vec2(60.0, 20.0)) - 0.5);
            float line = 1.0 - smoothstep(0.455, 0.49, max(grid.x, grid.y));
            vec3 region = toWeight > 0.5 ? vec3(0.12, 0.7, 0.3) : side < 0.5 ? vec3(0.85, 0.2, 0.16) : vec3(0.18, 0.35, 0.9);
            diffuseColor.rgb = mix(region, vec3(1.0), line * 0.55);
          }
        }`);
  };
  paintMesh.material.customProgramCacheKey = () => 'p6-precision-paint-atlas-v3-crossfade';
  paintMesh.material.needsUpdate = true;
  const raycaster = new THREE.Raycaster();
  let currentTeam: string | null = null;
  let animating = false;
  let first = true;
  let disposed = false;

  function texture(key: ArtworkKey) {
    let promise = textureCache.get(key);
    if (!promise) { promise = loadArtwork(key).catch((error) => { textureCache.delete(key); throw error; }); textureCache.set(key, promise); }
    return promise;
  }

  function getDecalAtlas(teamId: string, keys: ArtworkKey[]) {
    let pending = decalAtlases.get(teamId);
    if (pending) return pending;
    pending = Promise.all(keys.map((key) => texture(key))).then((images) => {
      const canvas = document.createElement('canvas');
      const columns = Math.min(4, Math.max(1, keys.length));
      const rows = Math.ceil(keys.length / 4);
      canvas.width = columns * 256; canvas.height = rows * 256;
      const ctx = canvas.getContext('2d')!;
      const rects: Partial<Record<ArtworkKey, AtlasRect>> = {};
      keys.forEach((key, index) => {
        const source = images[index].image as CanvasImageSource & { width: number; height: number };
        const aspect = source.width / source.height;
        const width = Math.min(232, 232 * aspect);
        const height = Math.min(232, 232 / aspect);
        const x = (index % 4) * 256 + (256 - width) / 2;
        const y = Math.floor(index / 4) * 256 + (256 - height) / 2;
        ctx.drawImage(source, x, y, width, height);
        rects[key] = { u: x / canvas.width, v: 1 - (y + height) / canvas.height, w: width / canvas.width, h: height / canvas.height };
      });
      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 4;
      return { map, rects };
    }).catch((error) => { decalAtlases.delete(teamId); throw error; });
    decalAtlases.set(teamId, pending);
    return pending;
  }

  function clearDecals() {
    for (const box of boxes) { scene.remove(box); box.geometry.dispose(); (box.material as THREE.Material).dispose(); }
    boxes = [];
    for (const decal of decals) {
      scene.remove(decal.mesh);
      decal.mesh.geometry.dispose();
      (decal.mesh.material as THREE.Material).dispose();
    }
    decals.length = 0;
  }

  function clearWheelDetails() {
    for (const mesh of wheelDetails) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    wheelDetails.length = 0;
  }

  function addMcLarenWheelDetails() {
    // Measured tire centers from MODEL_B_COMPONENT_BOUNDS.json. These local
    // scene overlays leave the owner's GLB and its tire meshes untouched.
    const centers = [
      { x: -1.02, z: -1.265, side: -1 }, { x: .91, z: -1.265, side: 1 },
      { x: -1.04, z: 2.135, side: -1 }, { x: 1.04, z: 2.135, side: 1 },
    ];
    const tireMesh = model.getObjectByName('PEDS_Model_B_Mesh_10');
    const sidewallCanvas = document.createElement('canvas');
    sidewallCanvas.width = sidewallCanvas.height = 512;
    const sidewall = sidewallCanvas.getContext('2d')!;
    sidewall.fillStyle = '#f1f0e9';
    sidewall.textAlign = 'center';
    sidewall.textBaseline = 'middle';
    sidewall.font = 'bold 48px Arial, sans-serif';
    const curvedLabel = (label: string, centerAngle: number, radius: number) => {
      const advance = .14;
      [...label].forEach((letter, index) => {
        const angle = centerAngle + (index - (label.length - 1) / 2) * advance;
        sidewall.save();
        sidewall.translate(256 + Math.cos(angle) * radius, 256 + Math.sin(angle) * radius);
        sidewall.rotate(angle + Math.PI / 2);
        sidewall.fillText(letter, 0, 0);
        sidewall.restore();
      });
    };
    curvedLabel('P ZERO', Math.PI, 218);
    curvedLabel('PIRELLI', 0, 218);
    for (const center of centers) {
      const geometry = new THREE.TorusGeometry(.223, .017, 8, 112);
      const positions = geometry.getAttribute('position');
      const colors = new Float32Array(positions.count * 3);
      const color = new THREE.Color();
      for (let i = 0; i < positions.count; i++) {
        const angle = (Math.atan2(positions.getY(i), positions.getX(i)) + Math.PI) / (2 * Math.PI);
        color.setHSL((.68 + angle * .93) % 1, .90, .53);
        colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, depthTest: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `mclaren-wheel-band-${center.side < 0 ? 'left' : 'right'}-${center.z < 0 ? 'front' : 'rear'}`;
      mesh.rotation.y = center.side * Math.PI / 2;
      mesh.position.set(center.x, .365, center.z);
      mesh.renderOrder = 3;
      scene.add(mesh);
      wheelDetails.push(mesh);
      // Source-photo tire lettering study, positioned on the measured sidewall.
      const map = new THREE.CanvasTexture(sidewallCanvas);
      map.colorSpace = THREE.SRGBColorSpace;
      if (!(tireMesh instanceof THREE.Mesh)) { map.dispose(); continue; }
      const letteringGeometry = new DecalGeometry(tireMesh, new THREE.Vector3(center.x + center.side * .008,.365,center.z), new THREE.Euler(0, center.side * Math.PI / 2, 0), new THREE.Vector3(.68,.68,.20));
      const label = new THREE.Mesh(letteringGeometry, new THREE.MeshBasicMaterial({map, transparent:true, side:THREE.DoubleSide, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, toneMapped:false}));
      label.name = `mclaren-wheel-lettering-${center.side < 0 ? 'left' : 'right'}-${center.z < 0 ? 'front' : 'rear'}`;
      label.renderOrder = 4;
      scene.add(label);
      wheelDetails.push(label);
    }
  }

  function decal(id: string, key: ArtworkKey, atlas: DecalAtlas, targetMesh: THREE.Mesh, from: THREE.Vector3, direction: THREE.Vector3, orientation: THREE.Euler, size: THREE.Vector3, offset = .004, expectedSide?: 'left' | 'right' | 'top') {
    raycaster.set(from, direction);
    const hit = raycaster.intersectObject(targetMesh, false).find((candidate) => expectedSide === 'top' || !expectedSide || candidate.point.x * (expectedSide === 'left' ? -1 : 1) > .02);
    if (!hit) return;
    const point = hit.point.clone().addScaledVector(direction, -offset);
    let geometry: THREE.BufferGeometry = new DecalGeometry(targetMesh, point, orientation, size);
    if (!geometry.getAttribute('position')?.count) { geometry.dispose(); return; }
    if (expectedSide === 'left' || expectedSide === 'right') {
      // DecalGeometry clips by projector box, not physical car side. On the
      // narrow engine cover a left Gemini triangle reached X>0 and showed up
      // beside the right Gemini. Keep only triangles wholly on the requested
      // side so duplicate artwork cannot bleed through the center line.
      const sign = expectedSide === 'right' ? 1 : -1;
      const position = geometry.getAttribute('position') as THREE.BufferAttribute;
      const sourceUv = geometry.getAttribute('uv') as THREE.BufferAttribute;
      const sourceNormal = geometry.getAttribute('normal') as THREE.BufferAttribute;
      const keptPosition: number[] = [], keptUv: number[] = [], keptNormal: number[] = [];
      for (let i = 0; i < position.count; i += 3) {
        if ([i, i + 1, i + 2].some((j) => position.getX(j) * sign < .005)) continue;
        for (let j = i; j < i + 3; j++) {
          keptPosition.push(position.getX(j), position.getY(j), position.getZ(j));
          keptUv.push(sourceUv.getX(j), sourceUv.getY(j));
          keptNormal.push(sourceNormal.getX(j), sourceNormal.getY(j), sourceNormal.getZ(j));
        }
      }
      geometry.dispose();
      if (!keptPosition.length) return;
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(keptPosition, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(keptUv, 2));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(keptNormal, 3));
    }
    const rect = atlas.rects[key];
    if (!rect) { geometry.dispose(); return; }
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
    for (let index = 0; index < uv.count; index++) uv.setXY(index, rect.u + uv.getX(index) * rect.w, rect.v + uv.getY(index) * rect.h);
    uv.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: atlas.map, transparent: true, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = id;
    mesh.renderOrder = 4;
    scene.add(mesh);
    decals.push({ mesh, key, id });
  }

  function fittedMcLarenDropbox(atlas: DecalAtlas) {
    const rect = atlas.rects.dropbox;
    if (!rect) return;
    // This wing endplate is almost planar, while the triangulated paint mesh
    // folds the wordmark. Anchor a thin applique just outside its measured X
    // bound (0.617) so the word stays intact without changing the source GLB.
    const geometry = new THREE.PlaneGeometry(.39, .08);
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
    for (let index = 0; index < uv.count; index++) uv.setXY(index, rect.u + uv.getX(index) * rect.w, rect.v + uv.getY(index) * rect.h);
    uv.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: atlas.map, transparent:true, depthTest:true, depthWrite:false, side:THREE.DoubleSide, toneMapped:false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'mclaren-dropbox-right';
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(.627, .82, 2.28);
    mesh.renderOrder = 4;
    scene.add(mesh);
    decals.push({ mesh, key:'dropbox', id:mesh.name });
  }

  function fittedMcLarenPirelli(atlas: DecalAtlas) {
    const rect = atlas.rects.pirelliBlack;
    if (!rect) return;
    // The upper flap is nearly flat across its span, but its mesh also
    // contains the curved rear face. A shallow applique keeps the lettering
    // on the measured papaya upper strip instead of folding onto that face.
    const geometry = new THREE.PlaneGeometry(.68, .28);
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
    for (let index = 0; index < uv.count; index++) uv.setXY(index, rect.u + uv.getX(index) * rect.w, rect.v + uv.getY(index) * rect.h);
    uv.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: atlas.map, transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'mclaren-pirelli-wing-top';
    mesh.rotation.x = -2.06;
    mesh.position.set(0, .82, 2.27);
    mesh.renderOrder = 4;
    scene.add(mesh);
    decals.push({ mesh, key: 'pirelliBlack', id: mesh.name });
  }

  function fittedMcLarenRearWordmark(atlas: DecalAtlas) {
    const rect = atlas.rects.mclarenWordmarkWhite;
    if (!rect) return;
    const geometry = new THREE.PlaneGeometry(.68, .075);
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
    for (let index = 0; index < uv.count; index++) uv.setXY(index, rect.u + uv.getX(index) * rect.w, rect.v + uv.getY(index) * rect.h);
    uv.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: atlas.map, transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'mclaren-wordmark-wing-rear';
    mesh.position.set(0, .91, 2.51);
    mesh.renderOrder = 4;
    scene.add(mesh);
    decals.push({ mesh, key: 'mclarenWordmarkWhite', id: mesh.name });
  }

  function fittedMcLarenLowerGroq(atlas: DecalAtlas) {
    const rect = atlas.rects.groqWhite;
    if (!rect) return;
    const geometry = new THREE.PlaneGeometry(.24, .07);
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
    for (let index = 0; index < uv.count; index++) uv.setXY(index, rect.u + uv.getX(index) * rect.w, rect.v + uv.getY(index) * rect.h);
    uv.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: atlas.map, transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'mclaren-groq-underwing-rear';
    mesh.position.set(.28, .58, 2.53);
    mesh.renderOrder = 4;
    scene.add(mesh);
    decals.push({ mesh, key: 'groqWhite', id: mesh.name });
  }

  function fittedWingMark(id: string, key: ArtworkKey, anchor: SurfaceAnchorMap, atlas: DecalAtlas) {
    const rect = atlas.rects[key];
    if (!rect) return;
    // Model B's main wing has a curved rear face, so a decal projector folds
    // wordmarks across two flaps. Use the measured outer surface as a thin
    // local review applique; the original GLB remains unchanged.
    const geometry = new THREE.PlaneGeometry(anchor.width, anchor.height);
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
    for (let index = 0; index < uv.count; index++) uv.setXY(index, rect.u + uv.getX(index) * rect.w, rect.v + uv.getY(index) * rect.h);
    uv.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: atlas.map, transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material);
    if (anchor.side === 'left' || anchor.side === 'right') mesh.rotation.y = anchor.side === 'right' ? Math.PI / 2 : -Math.PI / 2;
    mesh.position.set(anchor.side === 'rear' ? anchor.x ?? 0 : anchor.side === 'right' ? .627 : -.627, anchor.y, anchor.z);
    mesh.name = id;
    mesh.renderOrder = 4;
    scene.add(mesh);
    decals.push({ mesh, key, id });
  }

  function conformingSideMark(id: string, key: ArtworkKey, anchor: SurfaceAnchorMap, atlas: DecalAtlas, target: THREE.Mesh) {
    const rect = atlas.rects[key];
    if (!rect || (anchor.side !== 'left' && anchor.side !== 'right')) return;
    const sign = anchor.side === 'right' ? 1 : -1;
    const columns = 24, rows = 8;
    const points: number[] = [], uvs: number[] = [], valid: boolean[] = [], triangles: number[] = [];
    // Drape a regular logo UV grid over the outer paint triangles. Sampling
    // the actual mesh preserves letter continuity across Model B's body folds.
    for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
      const u = column / columns, v = row / rows;
      const z = anchor.z + (sign > 0 ? .5 - u : u - .5) * anchor.width;
      const y = anchor.y + (v - .5) * anchor.height;
      raycaster.set(new THREE.Vector3(sign * 2, y, z), new THREE.Vector3(-sign, 0, 0));
      const hit = raycaster.intersectObject(target, false).find((candidate) => candidate.point.x * sign > .02);
      valid.push(Boolean(hit));
      points.push(hit ? hit.point.x + sign * .007 : 0, y, z);
      uvs.push(rect.u + u * rect.w, rect.v + v * rect.h);
    }
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
      if (valid[a] && valid[b] && valid[c] && valid[d]) triangles.push(a,c,b,b,c,d);
    }
    if (!triangles.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(triangles);
    const material = new THREE.MeshBasicMaterial({ map: atlas.map, transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = id;
    mesh.renderOrder = 4;
    scene.add(mesh);
    decals.push({ mesh, key, id });
  }

  let activeAtlas: DecalAtlas | null = null;
  function renderDecals(team: Pick<TeamLivery, 'id'>, atlas: DecalAtlas) {
    clearDecals();
    for (const entry of liveryDefinitions[team.id as PrecisionTeam].decals) {
      const anchor = authorOverrides.get(entry.id) ?? entry.anchor;
      const sign = anchor.side === 'left' ? -1 : 1;
      if (anchor.visible === false) continue;
      const from = anchor.side === 'top' ? new THREE.Vector3(anchor.x ?? 0, 2, anchor.z) : anchor.side === 'rear' ? new THREE.Vector3(anchor.x ?? 0, anchor.y, 3) : new THREE.Vector3(sign * 2, anchor.y, anchor.z);
      const direction = anchor.side === 'top' ? new THREE.Vector3(0, -1, 0) : anchor.side === 'rear' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(-sign, 0, 0);
      const orientation = anchor.side === 'top' ? new THREE.Euler(-Math.PI / 2, 0, anchor.rotation) : anchor.side === 'rear' ? new THREE.Euler(0, 0, anchor.rotation) : new THREE.Euler(0, sign * Math.PI / 2, anchor.rotation);
      const targetMesh = anchor.meshName ? model.getObjectByName(anchor.meshName) : paintMesh;
      if (!(targetMesh instanceof THREE.Mesh)) continue;
      if (team.id === 'mclaren' && entry.id === 'mclaren-dropbox-right' && !authorOverrides.has(entry.id)) { fittedMcLarenDropbox(atlas); continue; }
      if (team.id === 'mclaren' && entry.id === 'mclaren-pirelli-wing-top' && !authorOverrides.has(entry.id)) { fittedMcLarenPirelli(atlas); continue; }
      if (team.id === 'mclaren' && entry.id === 'mclaren-wordmark-wing-rear' && !authorOverrides.has(entry.id)) { fittedMcLarenRearWordmark(atlas); continue; }
      if (team.id === 'mclaren' && entry.id === 'mclaren-groq-underwing-rear' && !authorOverrides.has(entry.id)) { fittedMcLarenLowerGroq(atlas); continue; }
      if ((entry.id.endsWith('-rear-wing-main') || entry.id.endsWith('-wing-endplate-right')) && !authorOverrides.has(entry.id)) { fittedWingMark(entry.id, entry.artwork, anchor, atlas); continue; }
      if ((entry.id.startsWith('williams-atlassian-') || entry.id.startsWith('cadillac-twg-')) && !authorOverrides.has(entry.id)) { conformingSideMark(entry.id, entry.artwork, anchor, atlas, targetMesh); continue; }
      decal(entry.id, entry.artwork, atlas, targetMesh, from, direction, orientation, new THREE.Vector3(anchor.width, anchor.height, anchor.depth), anchor.offset, anchor.side !== 'rear' ? anchor.side : undefined);
    }
    if (authorMode && selectedDecalId) {
      for (const item of decals.filter((decal) => decal.id === selectedDecalId)) {
        const box = new THREE.BoxHelper(item.mesh, 0xf5c74c);
        box.renderOrder = 6;
        scene.add(box);
        boxes.push(box);
      }
    }
  }

  let requestId = 0;
  function blendedPaintSnapshot(from: THREE.CanvasTexture, to: THREE.CanvasTexture, blend: number) {
    const canvas = document.createElement('canvas');
    canvas.width = (to.image as HTMLCanvasElement).width;
    canvas.height = (to.image as HTMLCanvasElement).height;
    const context = canvas.getContext('2d')!;
    context.drawImage(from.image as HTMLCanvasElement, 0, 0);
    context.globalAlpha = blend;
    context.drawImage(to.image as HTMLCanvasElement, 0, 0);
    const snapshot = new THREE.CanvasTexture(canvas);
    snapshot.colorSpace = THREE.SRGBColorSpace;
    snapshot.anisotropy = 4;
    return snapshot;
  }

  function beginPaintTransition(precision: PrecisionTeam, reduced: boolean) {
    const next = createPaintAtlas(precision);
    if (!paintTo) {
      paintFrom = next;
      paintTo = next;
      paintFromMcLaren = precision === 'mclaren' ? 1 : 0;
      paintToMcLaren = paintFromMcLaren;
      paintUniforms.uPaintBlend.value = 1;
    } else {
      const prior = paintFrom && paintFrom !== paintTo && paintElapsed < paintDuration
        ? blendedPaintSnapshot(paintFrom, paintTo, paintUniforms.uPaintBlend.value)
        : paintTo;
      if (paintFrom && paintFrom !== prior) paintFrom.dispose();
      if (paintTo !== prior) paintTo.dispose();
      paintFrom = prior;
      paintTo = next;
      paintFromMcLaren = paintElapsed < paintDuration
        ? THREE.MathUtils.lerp(paintFromMcLaren, paintToMcLaren, paintUniforms.uPaintBlend.value)
        : paintToMcLaren;
      paintToMcLaren = precision === 'mclaren' ? 1 : 0;
      paintElapsed = 0;
      paintFrames = 0;
      paintDuration = reduced ? .2 : .48;
      paintUniforms.uPaintBlend.value = 0;
    }
    paintUniforms.uPaintAtlasFrom.value = paintFrom;
    paintUniforms.uPaintAtlasTo.value = paintTo;
    paintUniforms.uUsePaintAtlas.value = 1;
    paintUniforms.uFromMcLaren.value = paintFromMcLaren;
    paintUniforms.uToMcLaren.value = paintToMcLaren;
  }

  async function setTeam(team: TeamLivery, reduced: boolean) {
    if (currentTeam === team.id) { requestId++; return true; }
    const request = ++requestId;
    const definition = liveryDefinitions[team.id as PrecisionTeam];
    const precision = team.id as PrecisionTeam;
    beginPaintTransition(precision, reduced);
    currentTeam = team.id;
    clearDecals();
    clearWheelDetails();
    if (precision === 'mclaren') addMcLarenWheelDetails();
    const color = new THREE.Color();
    const cache = new Map<string, THREE.Color>();
    for (let index = 0; index < positions.count; index++) {
      vector.fromBufferAttribute(positions, index);
      paintMesh.localToWorld(vector);
      const hex = zoneColor(team, vector.x, vector.y, vector.z);
      const selected = cache.get(hex) ?? color.set(hex).clone();
      cache.set(hex, selected);
      target[index * 3] = selected.r;
      target[index * 3 + 1] = selected.g;
      target[index * 3 + 2] = selected.b;
    }
    if (first) { colors.set(target); attribute.needsUpdate = true; animating = false; first = false; }
    else animating = true;
    for (const accent of accents) accent.color.set(team.accent);
    const keys = [...new Set(definition.decals.map((entry) => entry.artwork))];
    const atlas = await getDecalAtlas(team.id, keys);
    if (disposed || request !== requestId) return false;
    if (activeAtlas && activeAtlas !== atlas) activeAtlas.map.dispose();
    activeAtlas = atlas;
    if (!selectedDecalId || !definition.decals.some((entry) => entry.id === selectedDecalId)) selectedDecalId = definition.decals[0]?.id ?? null;
    renderDecals(team, atlas);
    for (const [id, pending] of decalAtlases) if (id !== team.id) { void pending.then((item) => { if (item !== activeAtlas) item.map.dispose(); }); decalAtlases.delete(id); }
    for (const pending of textureCache.values()) void pending.then((item) => item.dispose());
    textureCache.clear();
    return true;
  }

  function entries() { return currentTeam ? liveryDefinitions[currentTeam as PrecisionTeam].decals : []; }
  function anchor(id: string) { const entry = entries().find((item) => item.id === id); return entry ? { ...(authorOverrides.get(id) ?? entry.anchor) } : null; }
  function snapshot() { return JSON.stringify(Object.fromEntries(authorOverrides)); }
  function restore(serialized: string) {
    authorOverrides.clear();
    for (const [id, value] of Object.entries(JSON.parse(serialized) as Record<string, SurfaceAnchorMap>)) authorOverrides.set(id, value);
    localStorage.setItem(authorStorageKey, snapshot());
    if (currentTeam && activeAtlas) renderDecals({ id: currentTeam }, activeAtlas);
  }
  function updateAnchor(id: string, patch: Partial<SurfaceAnchorMap>, record = true) {
    if (!authorMode) return false;
    const before = anchor(id);
    if (!before || (before.locked && patch.locked !== false)) return false;
    if (record) { undoStack.push(snapshot()); if (undoStack.length > 80) undoStack.shift(); redoStack.length = 0; }
    authorOverrides.set(id, { ...before, ...patch });
    localStorage.setItem(authorStorageKey, snapshot());
    if (currentTeam && activeAtlas) renderDecals({ id: currentTeam }, activeAtlas);
    return true;
  }
  function placeAt(id: string, clientX: number, clientY: number, camera: THREE.Camera, element: HTMLElement, record = true) {
    if (!authorMode || !anchor(id)) return false;
    const bounds = element.getBoundingClientRect();
    const pointer = new THREE.Vector2(((clientX - bounds.left) / bounds.width) * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const targets: THREE.Mesh[] = [];
    model.traverse((object) => { if (object instanceof THREE.Mesh) targets.push(object); });
    const hit = raycaster.intersectObjects(targets, false)[0];
    if (!hit) return false;
    const normal = hit.face?.normal.clone().transformDirection(hit.object.matrixWorld) ?? new THREE.Vector3(0, 1, 0);
    const side = Math.abs(normal.y) > .68 ? 'top' : hit.point.x < 0 ? 'left' : 'right';
    return updateAnchor(id, { side, meshName: hit.object.name, x: hit.point.x, y: hit.point.y, z: hit.point.z }, record);
  }
  function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()!); }
  function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()!); }
  const author = {
    entries: () => entries().map((item) => ({ ...item, anchor: anchor(item.id) })),
    selected: () => selectedDecalId,
    select: (id: string) => { if (!authorMode || !anchor(id)) return; selectedDecalId = id; if (currentTeam && activeAtlas) renderDecals({ id: currentTeam }, activeAtlas); },
    updateAnchor, placeAt, undo, redo,
    exportConfig: () => JSON.stringify({ version: 1, overrides: Object.fromEntries(authorOverrides) }, null, 2),
    importConfig: (input: string) => { const parsed = JSON.parse(input) as { version: number; overrides: Record<string, SurfaceAnchorMap> }; if (parsed.version !== 1 || !parsed.overrides) throw new Error('Invalid P6 authoring file'); undoStack.push(snapshot()); restore(JSON.stringify(parsed.overrides)); },
    diagnostics: (enabled: boolean) => { if (authorMode) paintUniforms.uDebugUv.value = enabled ? 1 : 0; },
    meshReport: () => { const rows: { name: string; material: string; vertices: number; uv: boolean }[] = []; model.traverse((object) => { if (object instanceof THREE.Mesh) rows.push({ name: object.name, material: Array.isArray(object.material) ? 'multi' : object.material.name, vertices: object.geometry.getAttribute('position')?.count ?? 0, uv: !!object.geometry.getAttribute('uv') }); }); return rows; },
    atlasPreview: () => activeAtlas?.map.image instanceof HTMLCanvasElement ? activeAtlas.map.image.toDataURL('image/png') : '',
  };

  function frame(delta: number, surface: number, team: TeamLivery, reduced: boolean) {
    if (paintFrom && paintTo && paintFrom !== paintTo) {
      if (paintFrames++ > 0) paintElapsed = Math.min(paintDuration, paintElapsed + Math.min(delta, .12));
      const progress = paintElapsed / paintDuration;
      paintUniforms.uPaintBlend.value = 1 - Math.pow(1 - progress, 3);
      if (progress >= 1) {
        paintFrom.dispose();
        paintFrom = paintTo;
        paintUniforms.uPaintAtlasFrom.value = paintTo;
      }
    }
    if (animating) {
      const factor = reduced ? 1 : 1 - Math.exp(-delta * 7);
      let remaining = 0;
      for (let index = 0; index < colors.length; index++) {
        const next = colors[index] + (target[index] - colors[index]) * factor;
        remaining = Math.max(remaining, Math.abs(target[index] - next));
        colors[index] = next;
      }
      attribute.needsUpdate = true;
      if (remaining < .003) { colors.set(target); attribute.needsUpdate = true; animating = false; }
    }
    paintMesh.material.roughness = THREE.MathUtils.lerp(paintMesh.material.roughness, surface, reduced ? 1 : 1 - Math.exp(-delta * 6));
    paintMesh.material.metalness = team.finish === 'gloss' ? .32 : .25;
  }

  return { setTeam, frame, author, dispose: () => { disposed = true; clearDecals(); clearWheelDetails(); for (const pending of textureCache.values()) void pending.then((item) => item.dispose()); for (const pending of decalAtlases.values()) void pending.then((item) => item.map.dispose()); paintFrom?.dispose(); if (paintTo !== paintFrom) paintTo?.dispose(); emptyPaintTexture.dispose(); textureCache.clear(); decalAtlases.clear(); }, getDebug: () => ({ team: currentTeam, decalCount: decals.length, decalIds: decals.map((item) => item.id), decalKeys: decals.map((item) => item.key), decalVertices: decals.map((item) => item.mesh.geometry.getAttribute('position').count), wheelDetails: wheelDetails.map((item) => item.name), bodyVertices: positions.count, paintAtlas: paintUniforms.uUsePaintAtlas.value === 1, paintBlend: paintUniforms.uPaintBlend.value, paintAtlasSize: paintUniforms.uUsePaintAtlas.value === 1 ? [1536, 512] : null }) };
}
