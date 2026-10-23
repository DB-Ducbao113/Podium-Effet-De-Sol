import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { TeamId } from '../../types';
import { TEAMS_DATA } from '../../data/teams';
import { getTeam3DLivery } from '../../data/showroom/teamLiveries';
import { ConstructorLogo } from '../common/ConstructorLogo';
import { CameraPreset } from './CameraController';

interface SchematicComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: TeamId;
  lang: 'vi' | 'en';
  onFocusPart?: (preset: CameraPreset) => void;
}

export const SchematicComparisonModal: React.FC<SchematicComparisonModalProps> = ({
  isOpen,
  onClose,
  teamId,
  lang,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const team = useMemo(() => TEAMS_DATA[teamId] || TEAMS_DATA.ferrari, [teamId]);
  const livery = useMemo(() => getTeam3DLivery(teamId), [teamId]);

  // Reset zoom whenever team changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
    }
  }, [isOpen, teamId]);

  // Prevent background scrolling and support Escape key
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-studio-950 border border-studio-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl max-h-[94vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-studio-800/80 bg-studio-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <ConstructorLogo teamId={teamId} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-f1red/20 text-f1red border border-f1red/30">
                  {lang === 'vi' ? 'BẢN VẼ KỸ THUẬT CAD 2D' : '2D CAD SCHEMATIC'}
                </span>
                <span className="text-xs font-mono text-studio-400 font-bold">
                  {livery.schematicCode}
                </span>
              </div>
              <h2 className="font-display text-base sm:text-lg font-black uppercase tracking-wide text-white flex items-center gap-2 mt-0.5">
                <span>{lang === 'vi' ? livery.schematicTitleVi : livery.schematicTitleEn}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2 rounded-xl bg-studio-800/80 hover:bg-studio-700 text-studio-300 hover:text-white transition-colors cursor-pointer"
              title={
                isFullscreen
                  ? lang === 'vi'
                    ? 'Thu nhỏ cửa sổ'
                    : 'Exit Fullscreen'
                  : lang === 'vi'
                    ? 'Phóng to toàn màn hình'
                    : 'Fullscreen'
              }
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-studio-800/80 hover:bg-red-600/30 text-studio-300 hover:text-red-400 transition-colors cursor-pointer"
              title={lang === 'vi' ? 'Đóng cửa sổ' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Zoom & View Controls Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-studio-950/90 border-b border-studio-800/60 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-studio-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {lang === 'vi'
                ? 'Sơ đồ CAD khí động học 2D chính hãng chuẩn 8K (Chiếu cạnh & Chiếu trên tỉ lệ 1:1)'
                : 'Authentic 8K 2D CAD Aerodynamic Flow Schematic (Side Elevation & Top-Down Plan View 1:1)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setZoomLevel((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))))
              }
              className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-200 transition-colors cursor-pointer"
              title={lang === 'vi' ? 'Thu nhỏ' : 'Zoom Out'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-studio-900 border border-studio-800 min-w-[52px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}
              className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-200 transition-colors cursor-pointer"
              title={lang === 'vi' ? 'Phóng to' : 'Zoom In'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-studio-800 hover:bg-studio-700 text-[11px] font-bold text-studio-200 transition-colors cursor-pointer"
              title={lang === 'vi' ? 'Đặt lại kích thước chuẩn' : 'Reset Zoom'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>100%</span>
            </button>
          </div>
        </div>

        {/* ── Main Schematic Image Display Area ── */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 flex items-center justify-center bg-[#05070b]">
          <div
            className={`relative rounded-2xl border border-studio-800 bg-[#06080c] overflow-hidden flex items-center justify-center w-full shadow-2xl transition-all duration-200 ${
              isFullscreen ? 'h-full min-h-[500px]' : 'min-h-[460px] max-h-[70vh]'
            }`}
          >
            <div
              className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center p-2"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={livery.schematicImage}
                alt={lang === 'vi' ? livery.schematicTitleVi : livery.schematicTitleEn}
                className="max-h-[68vh] w-auto object-contain rounded-xl shadow-2xl select-none"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Technical Watermark Tag */}
            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-studio-400 select-none pointer-events-none">
              {team.name.toUpperCase()} · 2026 TECHNICAL SPECIFICATION · 1:1 CAD SCALE
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 py-3 border-t border-studio-800/80 bg-studio-950 flex flex-wrap items-center justify-between gap-3 text-xs text-studio-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {lang === 'vi'
                ? `${team.name} · Động cơ: ${livery.powerUnit} · Khối lượng: 798kg (FIA Min Weight)`
                : `${team.name} · PU: ${livery.powerUnit} · Mass: 798kg (FIA Min Weight)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-white font-bold transition-colors cursor-pointer"
            >
              {lang === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};
