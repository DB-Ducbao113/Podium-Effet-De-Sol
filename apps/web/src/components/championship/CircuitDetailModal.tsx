import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CircuitData } from '../../types/circuit';
import { X, Trophy, MapPin, Activity, Zap, Camera } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { CircuitStreetReview } from './CircuitStreetReview';
import { CircuitRealWorldMap } from './CircuitRealWorldMap';

interface CircuitDetailModalProps {
  circuit: CircuitData;
  onClose: () => void;
}

export const CircuitDetailModal: React.FC<CircuitDetailModalProps> = ({ circuit, onClose }) => {
  const { lang } = useNavigationStore();
  const isVi = lang === 'vi';

  // Prevent background scrolling and support Escape key
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="circuit-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[94vh] overflow-y-auto bg-studio-950 text-white rounded-2xl border border-studio-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 bg-studio-950/95 backdrop-blur-sm border-b border-studio-850">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl" title={circuit.country}>
              {circuit.flag}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-f1red text-white">
                  {isVi ? `Vòng ${circuit.round}` : `Round ${circuit.round}`}
                </span>
                <span className="text-xs text-studio-400 font-medium">
                  {circuit.city}, {circuit.country}
                </span>
              </div>
              <h2
                id="circuit-modal-title"
                className="text-base sm:text-xl font-black font-display text-white mt-0.5"
              >
                {circuit.circuitName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-studio-400 hover:text-white hover:bg-studio-800 transition-colors cursor-pointer"
            aria-label={isVi ? 'Đóng' : 'Close'}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Modal Body: Responsive 2-column layout on desktop (lg:) so map and stats fit without scrolling */}
        <div className="p-4 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (7 cols): Map + Essential Telemetry Grid */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Corner Review Section Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-f1red/20 text-f1red border border-f1red/40 flex items-center gap-1.5 shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Review Khúc Cua' : 'Corner Review'}</span>
                </span>
                <span className="text-xs text-studio-400 font-medium hidden sm:inline">
                  {isVi
                    ? 'Góc cua · Tốc độ apex · Mẹo kỹ thuật'
                    : 'Apex speed · Gear · Racing tips'}
                </span>
              </div>

              <span className="text-[10px] font-mono text-studio-500 uppercase tracking-wider">
                {circuit.circuitName}
              </span>
            </div>

            {/* Streamlined Corner Review */}
            <CircuitStreetReview circuit={circuit} lang={lang} />

            <CircuitRealWorldMap circuit={circuit} lang={lang} />

            {/* Quick Telemetry Grid (4 cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-studio-900/80 border border-studio-800">
                <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                  {isVi ? 'Chiều Dài Vòng' : 'Circuit Length'}
                </span>
                <span className="text-base font-black font-display text-white mt-0.5 block">
                  {circuit.telemetry.circuitLengthKm}{' '}
                  <span className="text-[11px] font-normal text-studio-400">km</span>
                </span>
                <span className="text-[10px] text-studio-500 block mt-0.5">
                  {isVi
                    ? `${circuit.telemetry.lapsCount} vòng đua`
                    : `${circuit.telemetry.lapsCount} laps`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-studio-900/80 border border-studio-800">
                <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                  {isVi ? 'Tổng Cự Ly Đua' : 'Race Distance'}
                </span>
                <span className="text-base font-black font-display text-white mt-0.5 block">
                  {circuit.telemetry.raceDistanceKm}{' '}
                  <span className="text-[11px] font-normal text-studio-400">km</span>
                </span>
                <span className="text-[10px] text-studio-500 block mt-0.5">
                  {isVi ? `Chặng chính` : `Grand Prix`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-studio-900/80 border border-studio-800">
                <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                  {isVi ? 'Số Khúc Cua' : 'Total Turns'}
                </span>
                <span className="text-base font-black font-display text-white mt-0.5 block">
                  {circuit.telemetry.turns.total}{' '}
                  <span className="text-[11px] font-normal text-studio-400">
                    ({circuit.telemetry.turns.right}R / {circuit.telemetry.turns.left}L)
                  </span>
                </span>
                <span className="text-[10px] text-studio-500 block mt-0.5">
                  {isVi
                    ? `${circuit.telemetry.turns.right} phải · ${circuit.telemetry.turns.left} trái`
                    : `${circuit.telemetry.turns.right}R · ${circuit.telemetry.turns.left}L`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-studio-900/80 border border-studio-800">
                <span className="text-[9px] uppercase font-bold text-studio-400 block tracking-wider">
                  {isVi ? 'Vùng DRS' : 'DRS Zones'}
                </span>
                <span className="text-base font-black font-display text-emerald-400 mt-0.5 block flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>
                    {circuit.telemetry.drsZonesCount}{' '}
                    <span className="text-[11px] font-normal text-studio-400">
                      {isVi ? 'vùng' : 'zones'}
                    </span>
                  </span>
                </span>
                <span className="text-[10px] text-studio-500 block mt-0.5">
                  {isVi ? 'Tăng tốc vượt xe' : 'Overtaking aid'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Lap Record + DRS Zones + Key Characteristics */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Lap Record Card */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-studio-900 to-studio-900 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">
                    {isVi ? 'Kỷ Lục Vòng Nhanh Nhất (Lap Record)' : 'Official Race Lap Record'}
                  </span>
                  <span className="text-lg font-black font-display text-white block tracking-tight">
                    {circuit.lapRecord.time}
                  </span>
                  <p className="text-[11px] text-studio-300">
                    {circuit.lapRecord.driver}{' '}
                    <span className="text-studio-400 font-medium">({circuit.lapRecord.team})</span>{' '}
                    · <span className="text-amber-300 font-bold">{circuit.lapRecord.year}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-studio-400 block">
                  {isVi ? 'Ra mắt F1' : 'Debut'}
                </span>
                <span className="text-sm font-bold text-white">{circuit.firstGrandPrixYear}</span>
              </div>
            </div>

            {/* DRS Zones */}
            {circuit.drsZones.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>
                    {isVi
                      ? `Các Khu Vực DRS (${circuit.drsZones.length} Vùng)`
                      : `DRS Activation Zones (${circuit.drsZones.length} Zones)`}
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {circuit.drsZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="p-2.5 rounded-lg bg-studio-900/70 border border-studio-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-emerald-400 block text-[11px]">
                          {isVi ? zone.nameVi : zone.nameEn}
                        </span>
                        <span className="text-studio-400 text-[10px] block mt-0.5">
                          {zone.activationPoint}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase shrink-0">
                        DRS {zone.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Circuit Features */}
            <div className="space-y-2 pt-1 border-t border-studio-850">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-f1red" />
                <span>
                  {isVi ? 'Đặc Tính Kỹ Thuật Đáng Chú Ý' : 'Key Engineering Characteristics'}
                </span>
              </h3>
              <ul className="space-y-1.5">
                {(isVi ? circuit.keyFeaturesVi : circuit.keyFeaturesEn).map((feature, idx) => (
                  <li
                    key={idx}
                    className="p-2 rounded-lg bg-studio-900/40 border border-studio-800/80 text-[11px] text-studio-300 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-f1red shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-studio-950 border-t border-studio-850 flex items-center justify-between shrink-0">
          <span className="text-xs text-studio-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-f1red" />
            <span className="truncate max-w-[280px] sm:max-w-none">{circuit.officialName}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isVi ? 'Đóng Bản Đồ' : 'Close Map'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};
