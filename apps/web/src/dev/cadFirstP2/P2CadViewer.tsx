import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import P2ExplodeRig from './P2ExplodeRig';

export type P2CadScene = {
  model: THREE.Group;
  name: string;
  meshCount: number;
  triangles: number;
  components: readonly { id: string; name: string; triangles: number }[];
};

function FrameCAD({ scene, selectedPart, explode }: {
  scene: P2CadScene;
  selectedPart: string | null;
  explode: number;
}) {
  const { camera, invalidate } = useThree();
  const framing = useMemo(() => {
    const node = selectedPart
      ? scene.model.getObjectByName(selectedPart) ?? scene.model
      : scene.model;
    const box = new THREE.Box3().setFromObject(node);
    if (box.isEmpty()) return null;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    return { center, radius: Math.max(size.length() / 2, 0.002) };
  }, [scene, selectedPart]);

  useEffect(() => {
    if (!framing || !(camera instanceof THREE.PerspectiveCamera)) return;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(halfFov) * Math.max(camera.aspect, 0.2));
    const fit = Math.max(0.002, Math.min(Math.sin(halfFov), Math.sin(horizontal)));
    const distance = Math.max(0.008, (framing.radius / fit) * 1.5) * (1 + explode * 1.2);
    camera.near = Math.max(0.00001, distance / 5000);
    camera.far = Math.max(10, distance * 100);
    camera.position.copy(framing.center).add(
      new THREE.Vector3(1.2, 0.85, 1.45).normalize().multiplyScalar(distance),
    );
    camera.lookAt(framing.center);
    camera.updateProjectionMatrix();
    invalidate();
  }, [framing, camera, invalidate, explode]);

  return framing ? (
    <OrbitControls
      key={selectedPart ?? 'all'}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      target={framing.center.toArray() as [number, number, number]}
    />
  ) : null;
}

export default function P2CadViewer({
  scene, selectedPart, isolate, explode, section, sectionOffsetMm,
}: {
  scene: P2CadScene;
  selectedPart: string | null;
  isolate: boolean;
  explode: number;
  section: boolean;
  sectionOffsetMm: number;
}) {
  useEffect(() => {
    // Reversible, strictly visual isolation: no vertex edits or CAD surgery.
    scene.model.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.visible = !isolate || !selectedPart || node.name === selectedPart;
      }
    });
    return () => {
      scene.model.traverse((node) => {
        if (node instanceof THREE.Mesh) node.visible = true;
      });
    };
  }, [scene, isolate, selectedPart]);

  useEffect(() => {
    if (!section) return;
    // Cross-section is visual GPU clipping, not a new machined CAD section.
    // Each material clone is restored and disposed when the mode changes.
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -sectionOffsetMm / 1000);
    const snapshots: Array<{
      mesh: THREE.Mesh;
      original: THREE.Material | THREE.Material[];
      copies: THREE.Material[];
    }> = [];
    scene.model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const original = node.material;
      const sources = Array.isArray(original) ? original : [original];
      const copies = sources.map((mat) => {
        const copy = mat.clone();
        copy.clippingPlanes = [plane];
        copy.clipIntersection = false;
        copy.needsUpdate = true;
        return copy;
      });
      node.material = Array.isArray(original) ? copies : copies[0];
      snapshots.push({ mesh: node, original, copies });
    });
    return () => {
      snapshots.forEach(({ mesh, original, copies }) => {
        mesh.material = original;
        copies.forEach((copy) => copy.dispose());
      });
    };
  }, [scene, section, sectionOffsetMm]);

  useEffect(() => {
    const model = scene.model;
    return () => {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const copies = Array.isArray(object.material) ? object.material : [object.material];
        copies.forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    };
  }, [scene]);

  return (
    <Canvas
      frameloop="demand"
      camera={{ fov: 36, near: 0.00001, far: 100, position: [0.05, 0.05, 0.05] }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <color attach="background" args={['#101923']} />
      <ambientLight intensity={1.25} />
      <hemisphereLight args={['#e7f3ff', '#1a2939', 2.1]} />
      <directionalLight position={[3, 6, 8]} intensity={3.5} color="#f6faff" />
      <directionalLight position={[-4, 2, -5]} intensity={2.2} color="#ffbb9e" />
      <directionalLight position={[-2, 5, 4]} intensity={2.1} color="#aecfff" />
      <primitive object={scene.model} />
      <P2ExplodeRig model={scene.model} progress={explode} />
      <FrameCAD scene={scene} selectedPart={selectedPart} explode={explode} />
    </Canvas>
  );
}
