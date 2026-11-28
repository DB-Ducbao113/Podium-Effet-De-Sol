import React from "react";
import {
  LIQUID_GLASS_PRESETS,
  buildLiquidBezelMapDataUri,
} from "./liquidGlassRefraction";

const PRESET_MAPS = LIQUID_GLASS_PRESETS.map((preset) => ({
  ...preset,
  mapUri: buildLiquidBezelMapDataUri({
    bezelXPercent: preset.bezelXPercent,
    bezelYPercent: preset.bezelYPercent,
  }),
}));

/**
 * Global inline SVG optical refraction filters for True Liquid Glass surfaces.
 * Uses feDisplacementMap with convex bezel normal maps + subtle RGB chromatic
 * edge dispersion while keeping the interior optical center distortion-free.
 * Must stay rendered (width/height 0, never display:none) so Chromium resolves url(#id).
 */
export const LiquidGlassFilterDefs: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="peds-liquid-glass-svg-defs"
    data-testid="peds-liquid-glass-defs"
  >
    <defs>
      {PRESET_MAPS.map((preset) => (
        <filter
          key={preset.id}
          id={preset.id}
          x="-2%"
          y="-2%"
          width="104%"
          height="104%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={preset.mapUri}
            preserveAspectRatio="none"
            x="0"
            y="0"
            width="100%"
            height="100%"
            result="bezelMap"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="bezelMap"
            scale={preset.scaleR}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispR"
          />
          <feColorMatrix
            in="dispR"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="chR"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="bezelMap"
            scale={preset.scaleG}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispG"
          />
          <feColorMatrix
            in="dispG"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="chG"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="bezelMap"
            scale={preset.scaleB}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispB"
          />
          <feColorMatrix
            in="dispB"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="chB"
          />
          <feBlend in="chR" in2="chG" mode="screen" result="rg" />
          <feBlend in="rg" in2="chB" mode="screen" />
        </filter>
      ))}
    </defs>
  </svg>
);
