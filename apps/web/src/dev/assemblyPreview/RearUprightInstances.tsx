import { useEffect, useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import { layoutFourCorners } from './fourCornerLayout';
import type { OwnerMeasuredFit } from './ownerMeasuredFit';
import {
  REAR_UPRIGHT_PART,
  type RearUprightSource,
} from './rearUprightSource';

type Props = {
  source: RearUprightSource;
  fit: OwnerMeasuredFit;
  onError: (message: string) => void;
  onLoaded: (message: string) => void;
};

function disposeSource(scene: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      for (const m of Array.isArray(object.material) ? object.material : [object.material])
        materials.add(m);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

/** Original P2.9 STEP-derived carrier, positioned at both separate Model B rear
 * wheel centres. No front-upright reflection, fake rear wishbones, or mesh-scale.
 * Geometry is local and SHA-verified; mechanical mating remains HOLD.
 */
export default function RearUprightInstances({ source, fit, onError, onLoaded }: Props) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  useEffect(() => {
    let live = true;
    let owned: THREE.Group | null = null;
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void MeshoptDecoder.ready.then(() =>
      loader.parseAsync(source.glbBytes.slice(0), ''),
    ).then(gltf => {
      owned = gltf.scene;
      const meshNames: string[] = [];
      owned.traverse(object => {
        if (object instanceof THREE.Mesh) meshNames.push(object.name);
      });
      if (!live) {
        disposeSource(owned);
        return;
      }
      if (meshNames.length !== 1 || meshNames[0] !== REAR_UPRIGHT_PART) {
        disposeSource(owned);
        owned = null;
        onError('P2.9 source must contain exactly the original rear upright CAD mesh.');
        return;
      }
      setScene(owned);
      onLoaded('P29 REAR UPRIGHT RENDERED / BOTH REAR STATIONS / MECHANICAL G2 HOLD');
    }).catch(error => {
      if (live) onError('P2.9 source GLB parse failed: ' + String(error));
    });
    return () => {
      live = false;
      setScene(null);
      if (owned) disposeSource(owned);
    };
  }, [source, onError, onLoaded]);

  const mounts = useMemo(
    () => layoutFourCorners(fit).filter(mount => mount.station === 'rear'),
    [fit],
  );
  const cloned = useMemo(
    () => scene ? mounts.map(mount => ({ mount, view: scene.clone(true) })) : [],
    [scene, mounts],
  );
  return <>
    {cloned.map(({ mount, view }) =>
      <group key={mount.id}
        name={'p29-proposal-'+mount.id}
        position={mount.translationM}
        rotation={[0, mount.rotationYRad, 0]}
        scale={1}>
        <group position={fit.originalP28WheelCenterM}>
          <primitive object={view} />
        </group>
      </group>
    )}
  </>;
}
