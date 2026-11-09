import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  Gauge,
  Info,
  Layers,
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CircuitData } from '../../types/circuit';
import { sampleSvgPathPoints } from '../../utils/circuitGpsHelper';
import { CIRCUIT_COORDINATES, CircuitGeoCoords } from './circuitCoordinates';

export type { CircuitGeoCoords };

interface CircuitRealWorldMapProps {
  circuit: CircuitData;
  lang: 'vi' | 'en';
  heightClass?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Self-contained circuit atlas with no satellite or street-tile requests. */
export const CircuitRealWorldMap: React.FC<CircuitRealWorldMapProps> = ({
  circuit,
  lang,
  heightClass = 'h-[300px] sm:h-[340px]',
  className = '',
}) => {
  const isVi = lang === 'vi';
  const [layer, setLayer] = useState<'aero' | 'technical'>('aero');
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [activeTurn, setActiveTurn] = useState<number | null>(null);

  const coords: CircuitGeoCoords = useMemo(
    () =>
      CIRCUIT_COORDINATES[circuit.id] || {
        lat: -37.8497,
        lng: 144.968,
        zoom: 15,
      },
    [circuit.id],
  );

  const points = useMemo(() => sampleSvgPathPoints(circuit.svgPath, 5), [circuit.svgPath]);
  const turnMarkers = useMemo(() => {
    const total = circuit.telemetry.turns.total;
    return Array.from({ length: total }, (_, index) => {
      const pointIndex = Math.floor((((index + 1) * 0.95) / total) * points.length) % points.length;
      return { number: index + 1, point: points[pointIndex] ?? [250, 180] };
    });
  }, [circuit.telemetry.turns.total, points]);
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  return (
    <div
      className={`relative rounded-2xl bg-studio-950 border border-studio-800/80 overflow-hidden flex flex-col shadow-2xl ${className}`}
      data-offline-circuit-atlas={circuit.id}
    >
      <div
        className={`relative w-full ${heightClass} overflow-hidden bg-[#070a10]`}
        aria-label={
          isVi
            ? `Bản đồ vector ngoại tuyến ${circuit.circuitName}`
            : `${circuit.circuitName} offline vector atlas`
        }
      >
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                layer === 'aero'
                  ? 'radial-gradient(circle at 50% 45%, rgba(0,240,255,0.16), transparent 48%), linear-gradient(rgba(106,130,153,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(106,130,153,0.11) 1px, transparent 1px)'
                  : 'radial-gradient(circle at 48% 46%, rgba(255,48,40,0.13), transparent 46%), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: 'auto, 24px 24px, 24px 24px',
            }}
          />

          <svg
            viewBox={circuit.viewBox}
            className="absolute inset-[12%] h-[76%] w-[76%] mx-auto overflow-visible"
            role="img"
            aria-labelledby={`atlas-${circuit.id}-title`}
          >
            <title id={`atlas-${circuit.id}-title`}>{circuit.circuitName}</title>
            <path
              d={circuit.svgPath}
              fill="none"
              stroke={layer === 'aero' ? '#00f0ff' : '#ff3028'}
              strokeWidth="34"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.14"
            />
            <path
              d={circuit.svgPath}
              fill="none"
              stroke="#f5f7fa"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={circuit.svgPath}
              fill="none"
              stroke="#111827"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={circuit.svgPath}
              fill="none"
              stroke={layer === 'aero' ? '#00f0ff' : '#ff3028'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {turnMarkers.map(({ number, point }) => (
              <g
                key={number}
                transform={`translate(${point[0]} ${point[1]})`}
                role="button"
                tabIndex={0}
                aria-label={`Turn ${number}`}
                onClick={() => setActiveTurn((current) => (current === number ? null : number))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveTurn((current) => (current === number ? null : number));
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <circle
                  r={activeTurn === number ? 13 : 10}
                  fill={activeTurn === number ? '#ff3028' : '#f8fafc'}
                  stroke="#070a10"
                  strokeWidth="3"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={activeTurn === number ? '#ffffff' : '#111827'}
                  fontSize="9"
                  fontWeight="900"
                >
                  {number}
                </text>
              </g>
            ))}
            <g transform={`translate(${circuit.startFinish.x} ${circuit.startFinish.y})`}>
              <rect
                x="-7"
                y="-7"
                width="14"
                height="14"
                rx="2"
                fill="#ffffff"
                stroke="#ff3028"
                strokeWidth="3"
              />
            </g>
          </svg>
        </div>

        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2">
          <div className="flex items-center bg-studio-950/90 backdrop-blur-md p-1 rounded-xl border border-studio-800 shadow-lg">
            <button
              type="button"
              onClick={() => setLayer('aero')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${layer === 'aero' ? 'bg-cyan-500 text-black' : 'text-studio-400 hover:text-white hover:bg-studio-800/60'}`}
            >
              <Gauge className="w-3 h-3" />
              <span>{isVi ? 'Luồng Khí' : 'Aero'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLayer('technical')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${layer === 'technical' ? 'bg-f1red text-white' : 'text-studio-400 hover:text-white hover:bg-studio-800/60'}`}
            >
              <Layers className="w-3 h-3" />
              <span>{isVi ? 'Kỹ Thuật' : 'Technical'}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowLegend((current) => !current)}
            className="p-1.5 rounded-xl bg-studio-950/90 hover:bg-studio-800 text-studio-300 border border-studio-800 shadow-lg backdrop-blur-md text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span className="hidden sm:inline font-mono">{isVi ? 'Chú Thích' : 'Legend'}</span>
          </button>
        </div>

        {showLegend && (
          <div className="absolute bottom-3 left-2.5 z-10 bg-studio-950/92 backdrop-blur-md p-2.5 rounded-xl border border-studio-800 shadow-xl max-w-[280px]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-studio-400 mb-1.5">
              {isVi ? 'Atlas ngoại tuyến EDS' : 'EDS offline atlas'}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-studio-300">
              <span>{circuit.telemetry.circuitLengthKm} km</span>
              <span>
                {circuit.telemetry.turns.total} {isVi ? 'khúc cua' : 'turns'}
              </span>
              <span>{circuit.telemetry.drsZonesCount} DRS</span>
              <span>{circuit.telemetry.direction}</span>
            </div>
            {activeTurn !== null && (
              <div className="mt-2 pt-2 border-t border-studio-800 text-[10px] font-bold text-white">
                Turn {activeTurn} ·{' '}
                {circuit.corners?.find((corner) => corner.number === activeTurn)?.[
                  isVi ? 'nameVi' : 'nameEn'
                ] ?? (isVi ? 'Điểm kỹ thuật' : 'Technical point')}
              </div>
            )}
          </div>
        )}

        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-2 rounded-xl bg-studio-950/90 hover:bg-studio-800 text-amber-400 border border-studio-800 shadow-lg cursor-pointer"
            title={isVi ? 'Đặt lại khung nhìn' : 'Reset view'}
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
          <div className="flex flex-col rounded-xl bg-studio-950/90 border border-studio-800 shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setZoom((value) => clamp(value + 0.15, 0.85, 1.75))}
              className="p-2 hover:bg-studio-800 text-studio-300 border-b border-studio-800 cursor-pointer"
              title={isVi ? 'Phóng to' : 'Zoom in'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((value) => clamp(value - 0.15, 0.85, 1.75))}
              className="p-2 hover:bg-studio-800 text-studio-300 cursor-pointer"
              title={isVi ? 'Thu nhỏ' : 'Zoom out'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 bg-studio-900/80 border-t border-studio-800 flex items-center justify-between gap-3 text-[10px] font-mono">
        <span className="flex items-center gap-1.5 text-studio-400 min-w-0">
          <MapPin className="w-3 h-3 text-f1red shrink-0" />
          <span className="truncate">
            {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}° ·{' '}
            {isVi ? 'không tải tile ngoài' : 'no external tiles'}
          </span>
        </span>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-studio-300 hover:text-white"
        >
          <span>{isVi ? 'Mở tọa độ' : 'Open coordinates'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
