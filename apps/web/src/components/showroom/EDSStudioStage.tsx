import React, { useEffect, useMemo } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import type { EDSLiveryPreset } from '../../data/showroom/edsLiveries';
import { createEDSBackdropTexture, EDSBackdropPanel } from './EDSStudioBackdropTexture';

interface EDSStudioStageProps {
  lang: 'vi' | 'en';
  livery: EDSLiveryPreset;
}

const panels: Array<{
  id: EDSBackdropPanel;
  position: [number, number, number];
  rotation: [number, number, number];
}> = [
  { id: 'identity', position: [0, 2.6, 5.8], rotation: [0, Math.PI, 0] },
  { id: 'technical', position: [0, 2.6, -5.8], rotation: [0, 0, 0] },
  { id: 'aero', position: [-7.2, 2.6, 0], rotation: [0, Math.PI / 2, 0] },
  { id: 'provenance', position: [7.2, 2.6, 0], rotation: [0, -Math.PI / 2, 0] },
];

export const EDSStudioStage: React.FC<EDSStudioStageProps> = ({ lang, livery }) => {
  const textures = useMemo(
    () => panels.map(({ id }) => createEDSBackdropTexture(id, livery, lang)),
    [lang, livery],
  );

  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures]);

  return (
    <group>
      <ambientLight intensity={1.05} color="#ffffff" />
      <directionalLight
        position={[6, 8, -4.5]}
        intensity={2.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 4, 3.5]} intensity={1.65} color={livery.accent} />
      <pointLight position={[0, 1.6, 4]} intensity={0.45} color="#ffffff" distance={9} />

      {panels.map((panel, index) => (
        <group key={panel.id} position={panel.position} rotation={panel.rotation}>
          <mesh position={[0, 0, -0.06]} receiveShadow>
            <boxGeometry args={[7.9, 4, 0.12]} />
            <meshStandardMaterial color="#252d39" roughness={0.44} metalness={0.68} />
          </mesh>
          <mesh receiveShadow>
            <planeGeometry args={[7.6, 3.7]} />
            <meshStandardMaterial
              map={textures[index]}
              emissive="#ffffff"
              emissiveMap={textures[index]}
              emissiveIntensity={0.32}
              roughness={0.3}
              metalness={0.18}
            />
          </mesh>
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={256}
          mirror={0.55}
          mixBlur={0.6}
          mixStrength={2}
          roughness={0.32}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#2a303b"
          metalness={0.4}
        />
      </mesh>

      <group position={[0, 0.003, 0]}>
        {[-1.8, 1.8].map((x) => (
          <mesh key={`x-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]}>
            <planeGeometry args={[0.02, 7.6]} />
            <meshBasicMaterial color={livery.accent} transparent opacity={0.46} />
          </mesh>
        ))}
        {[-3.8, 3.8].map((z) => (
          <mesh key={`z-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]}>
            <planeGeometry args={[3.62, 0.02]} />
            <meshBasicMaterial color={livery.accent} transparent opacity={0.46} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
