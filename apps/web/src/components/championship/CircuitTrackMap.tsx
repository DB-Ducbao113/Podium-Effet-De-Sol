import React, { useState } from 'react';
import { CircuitData } from '../../types/circuit';
import { getCircuitByRound, findCircuitByName } from '../../data/championship/circuitsData';
import { useNavigationStore } from '../../store/useNavigationStore';
import { CircuitDetailModal } from './CircuitDetailModal';
import { CircuitStreetReview } from './CircuitStreetReview';
import { Maximize2, Trophy, Zap } from 'lucide-react';

interface CircuitTrackMapProps {
  round?: number;
  circuitName?: string;
  circuitData?: CircuitData;
  variant?: 'card' | 'thumbnail';
  className?: string;
  onThumbnailClick?: (circuit: CircuitData) => void;
}

export const CircuitTrackMap: React.FC<CircuitTrackMapProps> = React.memo(
  ({
    round,
    circuitName,
    circuitData: explicitData,
    variant = 'card',
    className = '',
    onThumbnailClick,
  }) => {
    const { lang } = useNavigationStore();
    const isVi = lang === 'vi';
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Resolve circuit data by round, or fuzzy match by circuitName
    const circuit: CircuitData | undefined =
      explicitData ||
      (round ? getCircuitByRound(round) : undefined) ||
      (circuitName ? findCircuitByName(circuitName) : undefined);

    if (!circuit) {
      return null;
    }

    // 1. Thumbnail Variant (High-Contrast F1 Telemetry Preview in calendar row)
    if (variant === 'thumbnail') {
      return (
        <div
          className={`relative group cursor-pointer inline-flex items-center justify-center shrink-0 ${className}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onThumbnailClick) {
              onThumbnailClick(circuit);
            } else {
              setIsModalOpen(true);
            }
          }}
          title={
            isVi
              ? `Bấm để xem review chi tiết các khúc cua ${circuit.circuitName}`
              : `Click to view ${circuit.circuitName} corner review`
          }
        >
          {/* F1 High-Tech Radar Glassmorphism Badge */}
          <div className="relative w-16 h-11 sm:w-22 sm:h-13 rounded-xl bg-gradient-to-br from-[#0c0e16] via-[#131724] to-[#07090e] border border-studio-700/80 group-hover:border-f1red/90 p-1 sm:p-1.5 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_16px_rgba(225,6,0,0.4)] group-hover:scale-105 shrink-0">
            {/* Background Radar Telemetry Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)',
                backgroundSize: '8px 8px',
              }}
            />

            {/* Corner Live Status Beacon */}
            <div className="absolute top-1 left-1 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-f1red opacity-90 group-hover:animate-ping" />
            </div>

            {/* Micro Badge: REVIEW */}
            <span className="absolute bottom-0.5 right-1 text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-studio-400 group-hover:text-f1red transition-colors select-none">
              {isVi ? 'REVIEW' : 'CORNERS'}
            </span>

            {/* High-Visibility Multi-Layer Circuit SVG Silhouette */}
            <svg
              viewBox={circuit.viewBox}
              className="w-full h-full filter drop-shadow-[0_0_5px_rgba(255,24,1,0.55)] transition-transform duration-300 group-hover:scale-105"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Layer 1: Ambient Red Glow */}
              <path
                d={circuit.svgPath}
                fill="none"
                stroke="#ff1801"
                strokeWidth="26"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-30 blur-2xs"
              />

              {/* Layer 2: High-Contrast White Kerb Ribbon */}
              <path
                d={circuit.svgPath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-95"
              />

              {/* Layer 3: Dark Asphalt Track Bed */}
              <path
                d={circuit.svgPath}
                fill="none"
                stroke="#151822"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Layer 4: Vivid Neon F1 Red Racing Line */}
              <path
                d={circuit.svgPath}
                fill="none"
                stroke="#ff1801"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Layer 5: Start / Finish Marker Beacon */}
              <circle
                cx={circuit.startFinish.x}
                cy={circuit.startFinish.y}
                r="14"
                fill="#ff1801"
                className="opacity-60 animate-pulse"
              />
              <circle
                cx={circuit.startFinish.x}
                cy={circuit.startFinish.y}
                r="9"
                fill="#ffffff"
                stroke="#ff1801"
                strokeWidth="3.5"
              />
            </svg>

            {/* Direct Fullscreen Modal Trigger on Hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="absolute top-0.5 right-0.5 p-0.5 sm:p-1 rounded bg-studio-950/85 hover:bg-f1red text-studio-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-studio-700/80 hover:border-f1red"
              title={isVi ? 'Xem review khúc cua' : 'Expand corner review'}
              aria-label="Expand circuit corners review"
            >
              <Maximize2 className="w-2.5 h-2.5" />
            </button>
          </div>

          {isModalOpen && (
            <CircuitDetailModal circuit={circuit} onClose={() => setIsModalOpen(false)} />
          )}
        </div>
      );
    }

    // 2. Card Variant (Full interactive track map inside expanded calendar round)
    return (
      <div
        data-circuit-track-map={circuit.id}
        className={`rounded-xl sm:rounded-2xl bg-studio-950 text-white border border-studio-800 shadow-md overflow-hidden ${className}`}
      >
        <div className="p-3.5 sm:p-5 flex flex-col md:flex-row items-stretch gap-4 sm:gap-6">
          {/* Left Canvas: Streamlined Corner Review Preview */}
          <div className="relative flex-1 rounded-xl overflow-hidden flex flex-col group">
            <CircuitStreetReview circuit={circuit} lang={lang} compact={true} />
          </div>

          {/* Right Info: Circuit Telemetry & Specs */}
          <div className="w-full md:w-[320px] lg:w-[360px] flex flex-col justify-between space-y-3 shrink-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-f1red flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-f1red animate-ping" />
                  {isVi ? 'Review Khúc Cua & Thông Số' : 'Corner Review & Telemetry'}
                </span>
                <span className="text-[10px] text-studio-400 font-bold">
                  {circuit.firstGrandPrixYear > 0 &&
                    (isVi
                      ? `Từ năm ${circuit.firstGrandPrixYear}`
                      : `Since ${circuit.firstGrandPrixYear}`)}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold font-display text-white leading-tight">
                {circuit.circuitName}
              </h4>
              <p className="text-xs text-studio-400 mt-0.5">
                {circuit.city}, {circuit.country} {circuit.flag}
              </p>
            </div>

            {/* Telemetry Micro Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-studio-900/80 border border-studio-800">
                <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                  {isVi ? 'Chiều Dài Vòng' : 'Circuit Length'}
                </span>
                <span className="font-extrabold font-display text-white mt-0.5 block">
                  {circuit.telemetry.circuitLengthKm}{' '}
                  <span className="text-[10px] font-normal text-studio-400">km</span>
                </span>
              </div>

              <div className="p-2 rounded-lg bg-studio-900/80 border border-studio-800">
                <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                  {isVi ? 'Số Khúc Cua' : 'Turns'}
                </span>
                <span className="font-extrabold font-display text-white mt-0.5 block">
                  {circuit.telemetry.turns.total}{' '}
                  <span className="text-[10px] font-normal text-studio-400">
                    ({circuit.telemetry.turns.right}R / {circuit.telemetry.turns.left}L)
                  </span>
                </span>
              </div>

              <div className="p-2 rounded-lg bg-studio-900/80 border border-studio-800">
                <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                  {isVi ? 'Vùng DRS' : 'DRS Zones'}
                </span>
                <span className="font-extrabold font-display text-emerald-400 mt-0.5 block flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current text-emerald-400" />
                  <span>
                    {circuit.telemetry.drsZonesCount}{' '}
                    <span className="text-[10px] font-normal text-studio-400">
                      {isVi ? 'vùng' : 'zones'}
                    </span>
                  </span>
                </span>
              </div>

              <div className="p-2 rounded-lg bg-studio-900/80 border border-studio-800">
                <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                  {isVi ? 'Độ Chênh Cao' : 'Elevation Change'}
                </span>
                <span className="font-extrabold font-display text-white mt-0.5 block">
                  {circuit.telemetry.elevationChangeM}{' '}
                  <span className="text-[10px] font-normal text-studio-400">m</span>
                </span>
              </div>
            </div>

            {/* Lap Record Pill */}
            <div className="p-2.5 rounded-xl bg-studio-900/70 border border-amber-500/30 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="font-bold text-amber-400 uppercase tracking-wider">
                    {isVi ? 'Kỷ lục vòng chạy' : 'Lap Record'}
                  </span>
                  <span className="font-bold text-studio-400">{circuit.lapRecord.year}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-black font-display text-white tracking-tight">
                    {circuit.lapRecord.time}
                  </span>
                  <span className="text-[10px] text-studio-300 truncate">
                    {circuit.lapRecord.driver}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button to Open Full Modal */}
            <button
              data-open-circuit-detail={circuit.id}
              onClick={() => setIsModalOpen(true)}
              className="w-full py-1.5 px-3 rounded-lg bg-studio-800 hover:bg-f1red text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-studio-700 hover:border-f1red"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{isVi ? 'Xem Toàn Bộ Review Khúc Cua' : 'View Full Corner Review'}</span>
            </button>
          </div>
        </div>

        {/* Modal Portal */}
        {isModalOpen && (
          <CircuitDetailModal circuit={circuit} onClose={() => setIsModalOpen(false)} />
        )}
      </div>
    );
  },
);
