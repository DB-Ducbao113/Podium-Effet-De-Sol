import React, { useState, useEffect } from 'react';
import { HotspotItem, F1_HOTSPOTS } from '../../data/showroom/hotspotsData';
import { TeamId } from '../../types';
import { getTeam3DLivery } from '../../data/showroom/teamLiveries';
import { getTeamComponentCloseUp } from '../../data/showroom/teamCloseups';
import { ConstructorLogo } from '../common/ConstructorLogo';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  Camera,
} from 'lucide-react';

interface HotspotDetailsModalProps {
  hotspot: HotspotItem | null;
  onClose: () => void;
  onSelectHotspot: (hotspot: HotspotItem) => void;
  teamId?: TeamId;
  lang: 'vi' | 'en';
}

export const HotspotDetailsModal: React.FC<HotspotDetailsModalProps> = React.memo(
  ({ hotspot, onClose, onSelectHotspot, teamId = 'ferrari', lang }) => {
    const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

    // Global Escape key listener to close modal or lightbox
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isLightboxOpen) {
            setIsLightboxOpen(false);
          } else {
            onClose();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, onClose]);

    if (!hotspot) return null;

    const livery = getTeam3DLivery(teamId);
    const closeUpData = getTeamComponentCloseUp(teamId, hotspot.id);
    const currentIndex = F1_HOTSPOTS.findIndex((h) => h.id === hotspot.id);
    const prevHotspot = F1_HOTSPOTS[(currentIndex - 1 + F1_HOTSPOTS.length) % F1_HOTSPOTS.length];
    const nextHotspot = F1_HOTSPOTS[(currentIndex + 1) % F1_HOTSPOTS.length];

    return (
      <>
        {/* ── 1. Interactive Dark Backdrop Overlay: Click outside to dismiss ── */}
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in cursor-pointer"
          onClick={onClose}
          aria-label={lang === 'vi' ? 'Nhấn để đóng bảng chi tiết' : 'Click to close drawer'}
        />

        {/* ── 2. Slide-Over Technical Details Modal Drawer ── */}
        <aside
          className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-studio-950/95 text-white backdrop-blur-2xl border-l border-studio-800 shadow-2xl flex flex-col transition-all duration-300 animate-slide-left overflow-hidden"
          aria-label="F1 Technical Hotspot Visualizer"
        >
          {/* ── Top Bar Header: Synced with Active Team & Obvious Close Button ── */}
          <div className="p-3.5 sm:p-4 border-b border-studio-800/80 flex items-center justify-between gap-3 bg-studio-900/90 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              {/* Team Livery Number Badge */}
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center font-display text-xs font-black text-white shadow-md ring-2 ring-white/20 shrink-0"
                style={{ backgroundColor: livery.bodyColor }}
              >
                {currentIndex + 1}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Official Vector Logo */}
                  <ConstructorLogo teamId={teamId} size="sm" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-studio-400 truncate">
                    {livery.fullName}
                  </span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide text-white leading-tight truncate">
                  {lang === 'vi' ? closeUpData.titleVi : closeUpData.titleEn}
                </h3>
              </div>
            </div>

            {/* High-visibility Close Button with explicit ESC label */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white transition-all border border-studio-700/80 shadow-md shrink-0 cursor-pointer active:scale-95"
              aria-label={
                lang === 'vi'
                  ? 'Đóng bảng chi tiết (hoặc bấm phím ESC)'
                  : 'Close drawer (or press ESC)'
              }
            >
              <span className="text-xs font-bold hidden sm:inline">
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </span>
              <X className="w-4 h-4 text-studio-300 hover:text-white" />
            </button>
          </div>

          {/* ── Direct 1-6 Component Quick-Jump Strip Inside Modal ── */}
          <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-studio-900/50 border-b border-studio-800/80 overflow-x-auto custom-scrollbar shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-studio-400 shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Linh kiện:
            </span>
            {F1_HOTSPOTS.map((h, i) => {
              const isSelected = h.id === hotspot.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onSelectHotspot(h)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-f1red text-white border-f1red shadow-sm'
                      : 'bg-studio-950/60 text-studio-400 border-studio-800 hover:text-white hover:bg-studio-800'
                  }`}
                  aria-label={lang === 'vi' ? h.nameVi : h.nameEn}
                >
                  <span className="font-mono text-[10px] opacity-80">{i + 1}.</span>
                  <span>{lang === 'vi' ? h.nameVi.split(' ')[0] : h.nameEn.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* ── Scrollable Technical Body ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            {/* Authentic Constructor Component Image Display */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-f1red" />
                  {lang === 'vi'
                    ? `Chi Tiết Linh Kiện ${livery.teamName}`
                    : `${livery.teamName} Component View`}
                </span>
                <span className="font-mono text-[10px] text-studio-400 uppercase tracking-widest bg-studio-900 border border-studio-800 px-2 py-0.5 rounded">
                  {livery.carModelName}
                </span>
              </div>

              {/* Main Visual Display: Dedicated Team Component Close-up with Constructor Logo Badge */}
              <div className="relative rounded-2xl overflow-hidden border border-studio-700/60 shadow-xl group bg-black/90 aspect-video flex items-center justify-center">
                <img
                  src={closeUpData.imageUrl}
                  alt={lang === 'vi' ? closeUpData.titleVi : closeUpData.titleEn}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                  onClick={() => setIsLightboxOpen(true)}
                  loading="lazy"
                />

                {/* Ambient Grid Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-studio-950 via-transparent to-black/40 opacity-80 pointer-events-none" />

                {/* Top Left: Official Constructor Logo Badge (e.g. McLaren Speedmark) */}
                <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                  <ConstructorLogo teamId={teamId} badgeMode={true} size="sm" lang={lang} />
                </div>

                {/* Top Right HUD: Part Code Tag + Expand Lightbox Button */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {closeUpData.partCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1.5 rounded-md bg-studio-900/85 hover:bg-studio-800 text-studio-200 hover:text-white border border-white/15 backdrop-blur-md transition-colors cursor-pointer"
                    aria-label={
                      lang === 'vi' ? 'Phóng to xem cận cảnh sắc nét' : 'Expand full macro view'
                    }
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Info HUD: Team Component Title */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-studio-300 font-medium z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-studio-950/90 backdrop-blur-md border border-studio-700/70 text-[11px] font-bold text-white max-w-[70%]">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: livery.bodyColor }}
                    />
                    <span className="truncate">
                      {closeUpData.partCode} · {livery.shortCarName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="text-[11px] text-studio-300 hover:text-white font-mono flex items-center gap-1 bg-studio-900/80 px-2.5 py-1 rounded border border-studio-700/50 cursor-pointer shadow-sm"
                  >
                    <ZoomIn className="w-3 h-3 text-f1red" />
                    <span>{lang === 'vi' ? 'Phóng to' : 'Zoom In'}</span>
                  </button>
                </div>
              </div>

              {/* Label & Active Model Tag */}
              <div className="flex items-center justify-between text-[11px] px-1 text-studio-400">
                <span className="font-medium text-studio-300 truncate max-w-[75%]">
                  {lang === 'vi' ? closeUpData.titleVi : closeUpData.titleEn}
                </span>
                <span className="font-mono text-[10px] text-f1red font-bold shrink-0">
                  {livery.shortCarName} · 3D REFERENCE
                </span>
              </div>
            </div>

            {/* ── Bespoke Engineering Analysis for Active Team ── */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-studio-900/90 to-studio-950 border border-studio-800 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-studio-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: livery.bodyColor }}
                  />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    {livery.teamName} · {lang === 'vi' ? 'Phân Tích Cận Cảnh' : 'Macro Analysis'}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                  {closeUpData.partCode}
                </span>
              </div>

              {/* Bespoke Concept Explanation */}
              <p className="text-xs text-studio-300 leading-relaxed font-normal">
                {lang === 'vi' ? closeUpData.conceptVi : closeUpData.conceptEn}
              </p>
            </div>

            {/* Key Highlights Bullet Points for this Team's Component */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'vi' ? 'Đặc Tính Nổi Bật Của Mẫu Xe Này' : 'Constructor Design Features'}
              </h4>
              <ul className="space-y-2">
                {(lang === 'vi' ? closeUpData.highlightsVi : closeUpData.highlightsEn).map(
                  (item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-sm text-studio-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-f1red shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Key Technical Specifications Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'vi' ? 'Thông Số Kỹ Thuật (FIA Regulation)' : 'Technical Specifications'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {closeUpData.specs.map((spec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-studio-900/60 border border-studio-800/80 space-y-1"
                  >
                    <span className="text-[10px] uppercase font-bold text-studio-400 block truncate">
                      {lang === 'vi' ? spec.labelVi : spec.labelEn}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white block">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom Navigation Controls with Integrated CLOSE Button ── */}
          <div className="p-3.5 sm:p-4 border-t border-studio-800/80 bg-studio-900/90 flex items-center justify-between gap-2 sm:gap-3 sticky bottom-0 z-10 shadow-lg">
            <button
              type="button"
              onClick={() => onSelectHotspot(prevHotspot)}
              className="flex-1 py-2.5 px-2.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-xs font-bold text-studio-200 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
              aria-label={lang === 'vi' ? 'Xem linh kiện trước' : 'Previous component'}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{lang === 'vi' ? 'Trước' : 'Prev'}</span>
            </button>

            {/* Direct Close Button in Bottom Bar */}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-studio-800 hover:bg-studio-700 text-xs font-bold text-studio-300 hover:text-white border border-studio-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              aria-label={lang === 'vi' ? 'Đóng cửa sổ này (ESC)' : 'Close this panel (ESC)'}
            >
              <X className="w-4 h-4 text-studio-400" />
              <span>{lang === 'vi' ? 'Đóng' : 'Close'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectHotspot(nextHotspot)}
              className="flex-1 py-2.5 px-2.5 rounded-xl bg-f1red hover:bg-f1red/90 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1 shadow-md shadow-f1red/20 cursor-pointer"
              aria-label={lang === 'vi' ? 'Xem linh kiện tiếp' : 'Next component'}
            >
              <span className="hidden sm:inline">{lang === 'vi' ? 'Tiếp' : 'Next'}</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </aside>

        {/* ── 3. High-Definition Fullscreen Lightbox Modal with Official Team Logo ── */}
        {isLightboxOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Lightbox Header Bar with Official Constructor Logo */}
            <div
              className="flex items-center justify-between gap-4 pb-4 border-b border-studio-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <ConstructorLogo teamId={teamId} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                      {closeUpData.partCode}
                    </span>
                    <span className="text-xs text-studio-300 font-mono">{livery.fullName}</span>
                  </div>
                  <h2 className="text-base sm:text-xl font-display font-black uppercase text-white mt-0.5">
                    {lang === 'vi' ? closeUpData.titleVi : closeUpData.titleEn}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-studio-800/90 hover:bg-studio-700 text-white transition-colors cursor-pointer border border-studio-700 shadow-md font-bold text-xs"
                  aria-label={
                    lang === 'vi' ? 'Đóng chế độ phóng to (ESC)' : 'Close full view (ESC)'
                  }
                >
                  <span>{lang === 'vi' ? 'Đóng (ESC)' : 'Close (ESC)'}</span>
                  <X className="w-5 h-5 text-studio-400" />
                </button>
              </div>
            </div>

            {/* Lightbox Center Image Viewport */}
            <div
              className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-zoom-out"
              onClick={() => setIsLightboxOpen(false)}
            >
              <div
                className="relative max-w-6xl max-h-full rounded-2xl overflow-hidden border border-studio-700/60 shadow-2xl bg-studio-950"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={closeUpData.imageUrl}
                  alt={lang === 'vi' ? closeUpData.titleVi : closeUpData.titleEn}
                  className="max-h-[75vh] w-auto object-contain mx-auto select-none"
                />

                {/* Watermark badge on image */}
                <div className="absolute top-4 left-4 pointer-events-none">
                  <ConstructorLogo teamId={teamId} badgeMode={true} size="sm" lang={lang} />
                </div>
              </div>
            </div>

            {/* Lightbox Footer Bar: Telemetry specs & team details */}
            <div
              className="pt-3 border-t border-studio-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-studio-400"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <span>
                  Đội đua: <strong className="text-white">{livery.fullName}</strong>
                </span>
                <span>
                  Linh kiện: <strong className="text-white">{closeUpData.partCode}</strong>
                </span>
                <span>
                  Mẫu xe: <strong className="text-white">{livery.carModelName}</strong>
                </span>
              </div>
              <div className="text-[11px] font-mono text-studio-500">
                NHẤN PHÍM ESC HOẶC CLICK VÙNG NGOÀI ĐỂ ĐÓNG
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);
