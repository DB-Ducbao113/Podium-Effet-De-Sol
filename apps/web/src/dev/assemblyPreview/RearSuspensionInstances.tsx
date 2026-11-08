import { useEffect, useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import { layoutFourCorners } from './fourCornerLayout';
import type { OwnerMeasuredFit } from './ownerMeasuredFit';
import {
  REAR_SUSPENSION_PARTS, type RearSuspensionSource,
} from './rearSuspensionSource';

type Props = {
  source: RearSuspensionSource;
  fit: OwnerMeasuredFit;
  onError: (message: string) => void;
  onLoaded: (message: string) => void;
};
function disposeSource(scene: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material])
      materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

/** Exact project-authored 11-solid rear static CAD proposal placed at both
 * original Model B rear wheel centres. No reflection, mesh scale, fake
 * suspension dynamics, or modifications to original P2.8/Model B geometry.
 * This source CONTAINS P2.9 upright: do not also mount RearUprightInstances.
 */
export default function RearSuspensionInstances({
  source, fit, onError, onLoaded,
}: Props) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  useEffect(() => {
    let live = true;
    let original: THREE.Group | null = null;
    setScene(null);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void MeshoptDecoder.ready
      .then(() => loader.parseAsync(source.glbBytes.slice(0), ''))
      .then(gltf => {
        original = gltf.scene;
        const nodes: string[] = [];
        original.traverse(obj => {
          if (obj instanceof THREE.Mesh) nodes.push(obj.name);
        });
        if (!live) {
          disposeSource(original);
          return;
        }
        const expected = new Set<string>(REAR_SUSPENSION_PARTS);
        if (nodes.length !== 11 ||
            new Set(nodes).size !== 11 ||
            nodes.some(name => !expected.has(name))) {
          disposeSource(original);
          original = null;
          onError('P2.10 GLB must contain exactly 11 separately authored CAD meshes');
          return;
        }
        setScene(original);
        onLoaded('P210 REAR SUSPENSION MESHES PARSED / 11 CAD PARTS / TWO REAR STATIONS / G2 HOLD');
      }).catch(err => {
        if (live) onError('P2.10 original GLB parse failed: '+String(err));
      });
    return () => {
      live=false;
      setScene(null);
      if (original) disposeSource(original);
    };
  }, [source, onError, onLoaded]);
  const mounts = useMemo(
    () => layoutFourCorners(fit).filter(mount => mount.station === 'rear'),
    [fit],
  );
  const nodes = useMemo(
    () => scene ? mounts.map(mount => ({mount, clone: scene.clone(true)})) : [],
    [scene, mounts],
  );
  return <>
    {nodes.map(({mount,clone})=>
      <group key={mount.id}
        name={'p210-original-rear-suspension-'+mount.id}
        position={mount.translationM}
        rotation={[0,mount.rotationYRad,0]}
        scale={1}>
        <group position={fit.originalP28WheelCenterM}>
          <primitive object={clone}/>
        </group>
      </group>
    )}
  </>;
}
