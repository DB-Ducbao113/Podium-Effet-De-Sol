import React from 'react';

export interface GarageLightingProps {
  qualityTier: 'desktop' | 'mobile';
  accentColor: string;
}

/**
 * Physical overhead pit-garage technical illumination.
 * Uses bay-aligned ceiling area-equivalent lights and pit-lane entrance bounce
 * without turntable spot cones or stadium effects.
 */
export const GarageLighting: React.FC<GarageLightingProps> = ({
  qualityTier,
  accentColor,
}) => {
  const shadowSize = qualityTier === 'desktop' ? 2048 : 1024;

  return (
    <group name="GARAGE_LIGHTING_RIG">
      {/* Neutral cool-daylight pit garage ambient fill (overhead diffuser bounce) */}
      <hemisphereLight args={['#EEF2F7', '#252B33', 0.85]} />

      {/* Bay 1 primary ceiling light bank (key illumination from overhead truss) */}
      <directionalLight
        position={[-3.4, 4.7, 2.2]}
        intensity={2.2}
        color="#F8FAFC"
        castShadow
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
      />

      {/* Bay 2 secondary ceiling light bank */}
      <directionalLight
        position={[3.4, 4.7, 2.0]}
        intensity={1.35}
        color="#F1F5F9"
      />

      {/* Pit-lane open shutter daylight bounce from +Z */}
      <directionalLight
        position={[0.5, 2.4, 8.5]}
        intensity={1.1}
        color="#DCE7F3"
      />

      {/* Localized bay task fill lights mounted under overhead gantry */}
      <pointLight
        position={[-3.4, 4.1, 0.2]}
        intensity={7.5}
        distance={11}
        decay={1.6}
        color="#FFFFFF"
      />
      <pointLight
        position={[3.4, 4.1, 0.2]}
        intensity={5.5}
        distance={11}
        decay={1.6}
        color="#F4F7FA"
      />
      {/* Subtle wall wash accent behind telemetry island */}
      <pointLight
        position={[0, 3.6, -4.4]}
        intensity={3.5}
        distance={9}
        decay={1.8}
        color={accentColor}
      />
    </group>
  );
};

