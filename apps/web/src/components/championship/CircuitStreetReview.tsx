import React, { useState, useEffect } from 'react';
import { CircuitData } from '../../types/circuit';
import {
  TrackReviewPoint,
  getCircuitReviewPoints,
} from '../../data/championship/circuitReviewPoints';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gauge,
  Navigation,
  Zap,
  Maximize2,
  X,
} from 'lucide-react';

interface CircuitStreetReviewProps {
  circuit: CircuitData;
  lang: 'vi' | 'en';
  compact?: boolean;
}

export const CircuitStreetReview: React.FC<CircuitStreetReviewProps> = ({
  circuit,
  lang,
  compact = false,
}) => {
  const isVi = lang === 'vi';
  const checkpoints = getCircuitReviewPoints(circuit.id);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPhotoExpanded, setIsPhotoExpanded] = useState<boolean>(false);

  // Reset index when circuit changes
  useEffect(() => {
    setActiveIndex(0);
  }, [circuit.id]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % checkpoints.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + checkpoints.length) % checkpoints.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkpoints.length]);

  const activePoint: TrackReviewPoint = checkpoints[activeIndex] || checkpoints[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % checkpoints.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + checkpoints.length) % checkpoints.length);
  };

  // Google Maps Street View viewpoint URL
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${activePoint.lat},${activePoint.lng}`;

  return (
    <div className="relative rounded-2xl bg-studio-950 border border-studio-800/80 overflow-hidden flex flex-col shadow-xl">
      {/* ── Top Bar: Compact Header & Corner Pills ── */}
      <div className="p-2.5 sm:p-3 bg-studio-900/90 border-b border-studio-850 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-f1red/20 text-f1red border border-f1red/40">
              <Camera className="w-3 h-3" />
              <span>TRACK STREET VIEW</span>
            </span>
            <span className="text-xs font-bold font-display text-white">
              {isVi ? 'Review Chi Tiết Từng Khúc Đường' : 'Corner-by-Corner Review'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-studio-400">
            <span className="text-white font-bold">{activeIndex + 1}</span>
            <span>/</span>
            <span>
              {checkpoints.length} {isVi ? 'khúc cua' : 'corners'}
            </span>
          </div>
        </div>

        {/* Streamlined Corner Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {checkpoints.map((pt, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-f1red text-white shadow-xs'
                    : 'bg-studio-950 text-studio-400 hover:text-white hover:bg-studio-850 border border-studio-800'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold ${
                    isActive ? 'bg-white text-f1red' : 'bg-studio-800 text-studio-300'
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{pt.turnLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Corner Showcase ── */}
      <div className="p-3 sm:p-4 bg-studio-950 flex flex-col gap-3">
        {/* Photo Container */}
        <div
          className={`relative rounded-xl overflow-hidden border border-studio-800 bg-studio-900 group ${
            compact ? 'aspect-[16/10]' : 'aspect-[16/9]'
          }`}
        >
          <img
            src={activePoint.imageUrl}
            alt={isVi ? activePoint.nameVi : activePoint.nameEn}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            loading="lazy"
          />

          {/* Dark gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

          {/* Top overlays: Turn label and Action buttons */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-md">
              <Camera className="w-3.5 h-3.5 text-f1red" />
              <span>{activePoint.turnLabel}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <a
                href={streetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-f1red backdrop-blur-md border border-white/20 hover:border-f1red text-white font-mono text-[11px] font-bold flex items-center gap-1 transition-all shadow-md"
                title={isVi ? 'Mở Google Street View 360°' : 'Open Google Street View 360°'}
              >
                <span>Street View</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={() => setIsPhotoExpanded(true)}
                className="p-1.5 rounded-lg bg-black/80 hover:bg-studio-800 backdrop-blur-md border border-white/20 text-white transition-all cursor-pointer shadow-md"
                title={isVi ? 'Phóng to ảnh' : 'Expand full photo'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom badge on photo: Name */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
            <h4 className="text-sm sm:text-base font-black font-display text-white drop-shadow-md">
              {isVi ? activePoint.nameVi : activePoint.nameEn}
            </h4>
          </div>
        </div>

        {/* ── Telemetry Micro Strip ── */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-studio-900/90 border border-studio-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                {isVi ? 'TỐC ĐỘ' : 'SPEED'}
              </span>
              <span className="font-extrabold font-mono text-emerald-400 text-xs truncate block">
                {activePoint.telemetry.speedKmh} km/h
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-studio-900/90 border border-studio-800">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                {isVi ? 'SỐ' : 'GEAR'}
              </span>
              <span className="font-extrabold font-mono text-amber-400 text-xs truncate block">
                Số {activePoint.telemetry.gear}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-studio-900/90 border border-studio-800">
            <div className="w-7 h-7 rounded-lg bg-f1red/15 border border-f1red/30 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-f1red" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                {isVi ? 'LỰC G / PHANH' : 'G-FORCE'}
              </span>
              <span className="font-extrabold font-mono text-white text-xs truncate block">
                {activePoint.telemetry.gForceLateral
                  ? `${activePoint.telemetry.gForceLateral}G`
                  : `${activePoint.telemetry.brakingDistanceM}m`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Corner Description & Racing Tip ── */}
        {!compact && (
          <div className="space-y-2">
            <p className="text-xs text-studio-300 leading-relaxed">
              {isVi ? activePoint.descriptionVi : activePoint.descriptionEn}
            </p>

            <div className="p-2.5 rounded-xl bg-studio-900/80 border border-amber-500/30 flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-studio-300 leading-snug">
                <span className="font-bold text-amber-400 mr-1">
                  {isVi ? 'Mẹo kỹ thuật:' : 'Racing Tip:'}
                </span>
                <span>{isVi ? activePoint.racingTipVi : activePoint.racingTipEn}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Controls: Prev / Next ── */}
      <div className="p-2 sm:p-2.5 bg-studio-900/70 border-t border-studio-850 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 text-studio-300 hover:text-white border border-studio-800 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{isVi ? 'Khúc trước' : 'Previous'}</span>
        </button>

        {/* Checkpoint dots */}
        <div className="flex items-center gap-1">
          {checkpoints.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === activeIndex ? 'w-5 bg-f1red' : 'w-1.5 bg-studio-800 hover:bg-studio-700'
              }`}
              aria-label={`Go to corner ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 text-studio-300 hover:text-white border border-studio-800 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
        >
          <span>{isVi ? 'Khúc kế tiếp' : 'Next'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Fullscreen Photo Lightbox Modal ── */}
      {isPhotoExpanded && (
        <div
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsPhotoExpanded(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full">
              <img
                src={activePoint.imageUrl}
                alt={isVi ? activePoint.nameVi : activePoint.nameEn}
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl border border-studio-800 shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setIsPhotoExpanded(false)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/80 hover:bg-f1red text-white backdrop-blur-md transition-all cursor-pointer"
                title={isVi ? 'Đóng' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between w-full mt-3 px-2 text-white">
              <div className="flex flex-col">
                <span className="text-sm font-bold">
                  {isVi ? activePoint.nameVi : activePoint.nameEn}
                </span>
                <span className="text-xs text-studio-400 font-mono">
                  {circuit.circuitName} • {activePoint.telemetry.speedKmh} km/h • Gear{' '}
                  {activePoint.telemetry.gear}
                </span>
              </div>
              <a
                href={streetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-f1red text-white text-xs font-mono font-bold flex items-center gap-1.5"
              >
                <span>Street View 360°</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
