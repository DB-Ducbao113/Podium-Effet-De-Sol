import React, { useEffect, useMemo } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { HotspotItem } from '../../data/showroom/hotspotsData';
import { EDS_HOTSPOTS } from '../../data/showroom/edsHotspots';
import { DEFAULT_EDS_LIVERY_ID, EDSLiveryId, getEDSLivery } from '../../data/showroom/edsLiveries';

interface F1Car3DModelProps {
  activeHotspot: HotspotItem | null;
  onSelectHotspot: (hotspot: HotspotItem) => void;
  lang: 'vi' | 'en';
  showHotspots?: boolean;
  edsLiveryId?: EDSLiveryId;
  hotspots?: HotspotItem[];
  reviewG02?: boolean;
}

const EDSModelMesh: React.FC<{ liveryId: EDSLiveryId; reviewG02: boolean }> = ({
  liveryId,
  reviewG02,
}) => {
  const { scene } = useGLTF(
    import.meta.env.DEV && reviewG02 ? '/models/eds-g02.glb' : '/models/eds-g01.glb',
  );
  const livery = getEDSLivery(liveryId);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const createMaterial = (
      category: string,
      color: THREE.ColorRepresentation,
      roughness: number,
      metalness: number,
      clearcoat: number,
    ) =>
      new THREE.MeshPhysicalMaterial({
        name: `EDS_RUNTIME_${livery.id}_${category}`,
        color,
        roughness,
        metalness,
        clearcoat,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.55,
      });

    const materials = {
      tire: createMaterial('tire', '#07090b', 0.78, 0.02, 0.08),
      rim: createMaterial('rim', livery.secondary, Math.max(livery.roughness, 0.26), 0.72, 0.35),
      mechanical: createMaterial(
        'mechanical',
        livery.secondary,
        Math.max(livery.roughness, 0.38),
        livery.metalness,
        livery.clearcoat * 0.45,
      ),
      accent: createMaterial(
        'accent',
        livery.accent,
        livery.roughness,
        livery.metalness,
        livery.clearcoat,
      ),
      body: createMaterial(
        'body',
        livery.primary,
        livery.roughness,
        livery.metalness,
        livery.clearcoat,
      ),
      carbon: createMaterial('carbon', '#0c1115', 0.63, 0.08, 0.12),
      cockpit: createMaterial('cockpit', '#080c10', 0.72, 0.1, 0.08),
      intake: createMaterial('intake', '#05090c', 0.85, 0.04, 0),
      seam: createMaterial('seam', '#05080b', 0.68, 0.04, 0),
    };

    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const name = child.name.toLowerCase();
      const material = reviewG02
        ? name.endsWith('_tire')
          ? materials.tire
          : name.endsWith('_rim')
            ? materials.rim
            : name.endsWith('_metal')
              ? materials.mechanical
              : name.endsWith('_carbon')
                ? materials.carbon
                : name.endsWith('_cockpit')
                  ? materials.cockpit
                  : name.endsWith('_intake')
                    ? materials.intake
                    : name.endsWith('_seam')
                      ? materials.seam
                      : name.endsWith('_accent')
                        ? materials.accent
                        : materials.body
        : name.includes('tire')
          ? materials.tire
          : name.includes('rim')
            ? materials.rim
            : name.includes('floor') ||
                name.includes('cockpit') ||
                name.includes('suspension') ||
                name.includes('brake') ||
                name.includes('fence') ||
                name.includes('diffuser')
              ? materials.mechanical
              : name.includes('wing') || name.includes('halo') || name.includes('cooling')
                ? materials.accent
                : materials.body;
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = material;
    });

    return () => Object.values(materials).forEach((material) => material.dispose());
  }, [clonedScene, livery, reviewG02]);

  return <primitive object={clonedScene} position={[0, 0, 0]} />;
};

export const F1Car3DModel: React.FC<F1Car3DModelProps> = ({
  activeHotspot,
  onSelectHotspot,
  lang,
  showHotspots = false,
  edsLiveryId = DEFAULT_EDS_LIVERY_ID,
  hotspots = EDS_HOTSPOTS,
  reviewG02 = false,
}) => (
  <group position={[0, 0, 0]}>
    <EDSModelMesh liveryId={edsLiveryId} reviewG02={reviewG02} />
    {(showHotspots || activeHotspot !== null) &&
      hotspots.map((hotspot, index) => {
        const isSelected = activeHotspot?.id === hotspot.id;
        return (
          <group key={hotspot.id} position={hotspot.position}>
            <Html center zIndexRange={[100, 0]}>
              <div className="relative flex items-center justify-center">
                <span
                  className={`absolute w-7 h-7 rounded-full animate-ping pointer-events-none ${isSelected ? 'bg-f1red/60' : 'bg-sky-400/40'}`}
                  style={{ animationDuration: '2.5s' }}
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectHotspot(hotspot);
                  }}
                  className={`group relative flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none ${isSelected ? 'scale-115 z-30' : 'hover:scale-110'}`}
                  aria-label={lang === 'vi' ? hotspot.nameVi : hotspot.nameEn}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[11px] font-black shadow-lg transition-all border ${isSelected ? 'bg-f1red text-white border-white ring-2 ring-f1red/50 shadow-f1red/40' : 'bg-studio-900/90 text-white border-studio-500 hover:border-white hover:bg-f1red shadow-black/80'}`}
                  >
                    {index + 1}
                  </span>
                </button>
              </div>
            </Html>
          </group>
        );
      })}
  </group>
);

useGLTF.preload('/models/eds-g01.glb');
