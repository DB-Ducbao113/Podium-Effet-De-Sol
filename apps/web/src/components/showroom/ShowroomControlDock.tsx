import React, { useState, useEffect } from 'react';
import { useMobileHub } from '../../hooks/useMobileHub';
import { CameraPreset } from './CameraController';
import {
  RotateCcw,
  Play,
  Pause,
  Eye,
  Crosshair,
  Shield,
  Zap,
  Box,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Award,
  Users,
  Trophy,
  Compass,
  BookOpen,
  FileText,
} from 'lucide-react';

export type StudioLightingMode = 'studio';

interface ShowroomControlDockProps {
  cameraPreset: CameraPreset | null;
  onSelectPreset: (preset: CameraPreset) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  enableWheelZoom?: boolean;
  onToggleWheelZoom?: () => void;
  onZoom?: (direction: 'in' | 'out') => void;
  onResetView: () => void;
  lang: 'vi' | 'en';
  // Deprecated/kept optional for backward compatibility
  lightingMode?: StudioLightingMode;
  onChangeLightingMode?: (mode: StudioLightingMode) => void;
  showSponsors?: boolean;
  onToggleSponsors?: () => void;
  // Interactive Hotspots
  showHotspots?: boolean;
  onToggleHotspots?: () => void;
  // 2D Schematic Blueprint Comparison
  onOpenSchematic?: () => void;
}

// 4 Panoramic Wall Tour Steps
const TOUR_STEPS: {
  id: CameraPreset;
  labelVi: string;
  labelEn: string;
  tag: string;
}[] = [
  { id: 'pano_branding', labelVi: 'Vách Logo', labelEn: 'Launch Wall', tag: '1/4' },
  { id: 'pano_drivers', labelVi: 'Vách Tay Đua', labelEn: 'Drivers Wall', tag: '2/4' },
  { id: 'pano_technical', labelVi: 'Vách Kỹ Thuật', labelEn: 'Tech Specs', tag: '3/4' },
  { id: 'pano_achievements', labelVi: 'Vách Thành Tích', labelEn: 'Records Wall', tag: '4/4' },
];

/**
 * ShowroomControlDock — Streamlined, Ultra-Compact 3D Control Center
 *
 * Systematized into 3 focused Camera Angle tabs:
 * 1. [Toàn Cảnh]: 4 illuminated exhibition walls + 360° orbit with auto-tour
 * 2. [Đọc Bảng]: Eye-level direct perspective for crystal-clear wall reading
 * 3. [Chi Tiết Xe]: Aerodynamic vehicle component focus (Front, Cockpit, Rear, Top)
 *
 * Combined with a compact 2-button Interactive Utilities dock:
 * - Hotspots (Engineering points), Auto-Rotate 360°
 * (Engine sound removed per user request for minimalist focus)
 */
export const ShowroomControlDock: React.FC<ShowroomControlDockProps> = React.memo(
  ({
    cameraPreset,
    onSelectPreset,
    autoRotate,
    onToggleAutoRotate,
    onResetView,
    lang,
    showHotspots = false,
    onToggleHotspots,
    onOpenSchematic,
  }) => {
    const mobile = useMobileHub();
    const [isExpanded, setIsExpanded] = useState<boolean>(() => !mobile);

    useEffect(() => {
      if (mobile) setIsExpanded(false);
    }, [mobile]);
    const [presetCategory, setPresetCategory] = useState<'pano' | 'direct' | 'car'>('pano');
    const [isTouring, setIsTouring] = useState<boolean>(false);

    const currentTourIdx = TOUR_STEPS.findIndex((s) => s.id === cameraPreset);

    // Auto-Tour review effect
    useEffect(() => {
      if (!isTouring) return;
      const interval = setInterval(() => {
        const nextIdx = currentTourIdx >= 0 ? (currentTourIdx + 1) % TOUR_STEPS.length : 0;
        onSelectPreset(TOUR_STEPS[nextIdx].id);
      }, 5500);
      return () => clearInterval(interval);
    }, [isTouring, currentTourIdx, onSelectPreset]);

    const handleNextTour = () => {
      const nextIdx = currentTourIdx >= 0 ? (currentTourIdx + 1) % TOUR_STEPS.length : 0;
      onSelectPreset(TOUR_STEPS[nextIdx].id);
    };

    const handlePrevTour = () => {
      const prevIdx =
        currentTourIdx >= 0
          ? (currentTourIdx - 1 + TOUR_STEPS.length) % TOUR_STEPS.length
          : TOUR_STEPS.length - 1;
      onSelectPreset(TOUR_STEPS[prevIdx].id);
    };

    const handleToggleTour = () => {
      if (isTouring) {
        setIsTouring(false);
      } else {
        setIsTouring(true);
        if (currentTourIdx < 0) {
          onSelectPreset(TOUR_STEPS[0].id);
        }
      }
    };

    // 1. Panoramic Wall Angles
    const PANO_PRESETS: {
      id: CameraPreset;
      labelVi: string;
      labelEn: string;
      tag: string;
      icon: React.ReactNode;
      isWide?: boolean;
    }[] = [
      {
        id: 'pano_branding',
        labelVi: 'Vách Logo',
        labelEn: 'Launch Wall',
        tag: 'LOGO',
        icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
      },
      {
        id: 'pano_drivers',
        labelVi: 'Vách Tay Đua',
        labelEn: 'Drivers Wall',
        tag: 'TAY ĐUA',
        icon: <Users className="w-3.5 h-3.5 text-sky-400" />,
      },
      {
        id: 'pano_technical',
        labelVi: 'Vách Kỹ Thuật',
        labelEn: 'Tech Specs',
        tag: 'KỸ THUẬT',
        icon: <Crosshair className="w-3.5 h-3.5 text-emerald-400" />,
      },
      {
        id: 'pano_achievements',
        labelVi: 'Vách Thành Tích',
        labelEn: 'Records Wall',
        tag: 'KỶ LỤC',
        icon: <Trophy className="w-3.5 h-3.5 text-yellow-400" />,
      },
      {
        id: 'overview',
        labelVi: 'Toàn Cảnh Xe & Sàn 360°',
        labelEn: '360° Stage Overview',
        tag: 'ORBIT',
        icon: <Eye className="w-3.5 h-3.5 text-purple-400" />,
        isWide: true,
      },
    ];

    // 2. Direct Reading Angles (eye-level)
    const DIRECT_PRESETS: {
      id: CameraPreset;
      labelVi: string;
      labelEn: string;
      tag: string;
      icon: React.ReactNode;
    }[] = [
      {
        id: 'branding',
        labelVi: 'Đọc Vách Logo',
        labelEn: 'Read Launch Wall',
        tag: 'LOGO',
        icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
      },
      {
        id: 'drivers',
        labelVi: 'Đọc Vách Tay Đua',
        labelEn: 'Read Drivers Wall',
        tag: 'TAY ĐUA',
        icon: <Users className="w-3.5 h-3.5 text-sky-400" />,
      },
      {
        id: 'technical',
        labelVi: 'Đọc Vách Kỹ Thuật',
        labelEn: 'Read Tech Specs',
        tag: 'KỸ THUẬT',
        icon: <Crosshair className="w-3.5 h-3.5 text-emerald-400" />,
      },
      {
        id: 'achievements',
        labelVi: 'Đọc Bảng Thành Tích',
        labelEn: 'Read Records Wall',
        tag: 'KỶ LỤC',
        icon: <Trophy className="w-3.5 h-3.5 text-yellow-400" />,
      },
    ];

    // 3. Vehicle Aerodynamic Detail Angles
    const CAR_PRESETS: {
      id: CameraPreset;
      labelVi: string;
      labelEn: string;
      tag: string;
      icon: React.ReactNode;
    }[] = [
      {
        id: 'front',
        labelVi: 'Mũi & Cánh Trước',
        labelEn: 'Front Wing & Nose',
        tag: 'FRONT',
        icon: <Crosshair className="w-3.5 h-3.5 text-red-400" />,
      },
      {
        id: 'side',
        labelVi: 'Biên Dạng Bên',
        labelEn: 'Side Silhouette',
        tag: 'SIDE',
        icon: <Box className="w-3.5 h-3.5 text-cyan-400" />,
      },
      {
        id: 'cockpit',
        labelVi: 'Buồng Lái & Halo',
        labelEn: 'Cockpit & Halo',
        tag: 'COCKPIT',
        icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
      },
      {
        id: 'rear',
        labelVi: 'Cánh Đuôi & DRS',
        labelEn: 'Rear Wing & DRS',
        tag: 'REAR',
        icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      },
      {
        id: 'top',
        labelVi: 'Bình Đồ Từ Trên',
        labelEn: 'Top-Down Aero',
        tag: 'TOP',
        icon: <Box className="w-3.5 h-3.5 text-purple-400" />,
      },
    ];

    return (
      <div className="flex flex-col items-end pointer-events-auto">
        {/* ── Main Compact Floating Control Dock ── */}
        <div className="rounded-2xl bg-studio-950/92 backdrop-blur-2xl border border-studio-800 shadow-2xl p-2 sm:p-2.5 text-white w-[290px] sm:w-[320px] transition-all">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-1.5 border-b border-studio-800/80 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-f1red animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-studio-200 flex items-center gap-1">
                <Settings2 className="w-3.5 h-3.5 text-f1red" />
                {lang === 'vi' ? 'Điều Khiển 3D' : '3D Controls'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Quick Reset View Button */}
              <button
                type="button"
                onClick={onResetView}
                className="p-1 rounded-md text-studio-400 hover:text-white hover:bg-studio-800 transition-colors cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                title={lang === 'vi' ? 'Đặt lại góc nhìn mặc định' : 'Reset view'}
                aria-label="Reset view"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Minimize / Expand Toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-md text-studio-400 hover:text-white hover:bg-studio-800 transition-colors cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                title={
                  isExpanded
                    ? lang === 'vi'
                      ? 'Thu gọn'
                      : 'Collapse'
                    : lang === 'vi'
                      ? 'Mở rộng'
                      : 'Expand'
                }
                aria-label="Toggle expand"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-2.5 animate-fade-in">
              {/* ── 1. Systematic 3-Tab Camera Selector ── */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-1 bg-studio-900/90 p-1 rounded-xl border border-studio-800">
                  {/* Tab 1: Panoramas */}
                  <button
                    type="button"
                    onClick={() => {
                      setPresetCategory('pano');
                      if (cameraPreset && !PANO_PRESETS.some((p) => p.id === cameraPreset)) {
                        onSelectPreset('pano_branding');
                      }
                    }}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                      presetCategory === 'pano'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md font-black'
                        : 'text-studio-400 hover:text-white hover:bg-studio-800/60'
                    }`}
                  >
                    <Compass className="w-3 h-3 shrink-0" />
                    <span className="truncate">{lang === 'vi' ? 'Toàn Cảnh' : 'Panoramas'}</span>
                  </button>

                  {/* Tab 2: Read Boards */}
                  <button
                    type="button"
                    onClick={() => {
                      setPresetCategory('direct');
                      if (cameraPreset && !DIRECT_PRESETS.some((p) => p.id === cameraPreset)) {
                        onSelectPreset('branding');
                      }
                    }}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                      presetCategory === 'direct'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md font-black'
                        : 'text-studio-400 hover:text-white hover:bg-studio-800/60'
                    }`}
                  >
                    <BookOpen className="w-3 h-3 shrink-0" />
                    <span className="truncate">{lang === 'vi' ? 'Đọc Bảng' : 'Read Boards'}</span>
                  </button>

                  {/* Tab 3: Car Aero */}
                  <button
                    type="button"
                    data-camera-category="car"
                    onClick={() => {
                      setPresetCategory('car');
                      if (cameraPreset && !CAR_PRESETS.some((p) => p.id === cameraPreset)) {
                        onSelectPreset('front');
                      }
                    }}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                      presetCategory === 'car'
                        ? 'bg-gradient-to-r from-red-500 to-f1red text-white shadow-md font-black'
                        : 'text-studio-400 hover:text-white hover:bg-studio-800/60'
                    }`}
                  >
                    <Box className="w-3 h-3 shrink-0" />
                    <span className="truncate">{lang === 'vi' ? 'Chi Tiết Xe' : 'Car Aero'}</span>
                  </button>
                </div>

                {/* ── Auto-Tour Bar (Exclusive to Toàn Cảnh tab) ── */}
                {presetCategory === 'pano' && (
                  <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-studio-900/90 border border-studio-800">
                    <button
                      type="button"
                      onClick={handlePrevTour}
                      className="p-1 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition-colors cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                      title={lang === 'vi' ? 'Vách trước' : 'Previous wall'}
                      aria-label="Previous wall"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleTour}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isTouring
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-md'
                          : 'bg-studio-800 text-white border-studio-700 hover:bg-studio-700'
                      }`}
                    >
                      {isTouring ? (
                        <>
                          <Pause className="w-3 h-3 text-black animate-pulse" />
                          <span>{lang === 'vi' ? 'Dừng Tour Duyệt' : 'Pause Tour'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-amber-400" />
                          <span>{lang === 'vi' ? 'Tour Duyệt 4 Vách' : 'Review 4 Walls'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextTour}
                      className="p-1 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition-colors cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                      title={lang === 'vi' ? 'Vách kế tiếp' : 'Next wall'}
                      aria-label="Next wall"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Direct Reading Tip */}
                {presetCategory === 'direct' && (
                  <p className="text-[9px] text-sky-400/90 font-medium px-1 flex items-center gap-1">
                    <span>✦</span>
                    <span>
                      {lang === 'vi'
                        ? 'Góc nhìn thẳng trực diện ngang tầm mắt để đọc chữ sắc nét'
                        : 'Direct eye-level perspective for sharp text reading'}
                    </span>
                  </p>
                )}

                {/* ── Preset Buttons Grid ── */}
                <div className="grid grid-cols-2 gap-1.5">
                  {(presetCategory === 'pano'
                    ? PANO_PRESETS
                    : presetCategory === 'direct'
                      ? DIRECT_PRESETS
                      : CAR_PRESETS
                  ).map((p) => {
                    const isActive = cameraPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        data-camera-preset={p.id}
                        onClick={() => {
                          if (isTouring) setIsTouring(false);
                          onSelectPreset(p.id);
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-xl transition-all cursor-pointer border text-left ${
                          (p as any).isWide ? 'col-span-2' : ''
                        } ${
                          isActive
                            ? 'bg-studio-900 border-amber-500 shadow-md shadow-amber-500/20 text-white'
                            : 'bg-studio-900/70 border-studio-800/80 hover:bg-studio-850 hover:border-studio-700 text-studio-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          {p.icon}
                          <span className="font-bold text-[10px] sm:text-[11px] truncate">
                            {lang === 'vi' ? p.labelVi : p.labelEn}
                          </span>
                        </div>
                        <span
                          className={`text-[8px] font-mono px-1 py-0.5 rounded font-black shrink-0 ${
                            isActive ? 'bg-amber-500 text-black' : 'bg-studio-800 text-studio-400'
                          }`}
                        >
                          {p.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 2. Streamlined Interactive Utilities Row ── */}
              <div className="pt-2 border-t border-studio-800/80">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-studio-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {lang === 'vi' ? 'Tiện Ích Tương Tác:' : 'Interactive Tools:'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* 1. Hotspots Toggle */}
                  {onToggleHotspots && (
                    <button
                      type="button"
                      onClick={onToggleHotspots}
                      className={`p-1.5 rounded-xl border flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                        showHotspots
                          ? 'bg-f1red/20 text-red-200 border-f1red/70 shadow-sm'
                          : 'bg-studio-900/70 text-studio-400 border-studio-800 hover:text-white hover:bg-studio-800'
                      }`}
                      title={
                        lang === 'vi'
                          ? 'Bật/Tắt 6 điểm kỹ thuật trên thân xe'
                          : 'Toggle 6 engineering hotspots'
                      }
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Crosshair
                          className={`w-3.5 h-3.5 shrink-0 ${showHotspots ? 'text-f1red' : 'text-studio-400'}`}
                        />
                        <span className="truncate">
                          {lang === 'vi' ? 'Điểm Kỹ Thuật' : 'Hotspots'}
                        </span>
                      </div>
                      <span
                        className={`text-[8px] font-black uppercase px-1 py-0.5 rounded shrink-0 ${
                          showHotspots ? 'bg-f1red text-white' : 'bg-studio-800 text-studio-400'
                        }`}
                      >
                        {showHotspots
                          ? lang === 'vi'
                            ? 'BẬT'
                            : 'ON'
                          : lang === 'vi'
                            ? 'ẨN'
                            : 'OFF'}
                      </span>
                    </button>
                  )}

                  {/* 2. Auto-Rotate 360 Toggle */}
                  <button
                    type="button"
                    onClick={onToggleAutoRotate}
                    className={`p-1.5 rounded-xl border flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                      autoRotate
                        ? 'bg-sky-950/80 text-sky-200 border-sky-500/70 shadow-sm'
                        : 'bg-studio-900/70 text-studio-400 border-studio-800 hover:text-white hover:bg-studio-800'
                    }`}
                    title={lang === 'vi' ? 'Tự động xoay xe 360 độ' : 'Toggle 360 auto-rotation'}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {autoRotate ? (
                        <Pause className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                      ) : (
                        <Play className="w-3.5 h-3.5 shrink-0 text-studio-400" />
                      )}
                      <span className="truncate">
                        {lang === 'vi' ? 'Tự Xoay Xe' : 'Auto-Rotate'}
                      </span>
                    </div>
                    <span
                      className={`text-[8px] font-black uppercase px-1 py-0.5 rounded shrink-0 ${
                        autoRotate ? 'bg-sky-500 text-black' : 'bg-studio-800 text-studio-400'
                      }`}
                    >
                      {autoRotate
                        ? lang === 'vi'
                          ? 'CHẠY'
                          : 'ON'
                        : lang === 'vi'
                          ? 'DỪNG'
                          : 'OFF'}
                    </span>
                  </button>

                  {/* 3. Original 2D Blueprint Comparison */}
                  {onOpenSchematic && (
                    <button
                      type="button"
                      data-eds-schematic-open
                      onClick={onOpenSchematic}
                      className="col-span-2 p-1.5 rounded-xl border bg-gradient-to-r from-red-950/70 via-studio-900 to-amber-950/50 hover:from-red-900/80 hover:to-amber-900/60 border-amber-500/50 text-amber-300 hover:text-white flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                      title={
                        lang === 'vi'
                          ? 'Xem bản vẽ CAD 2D gốc và đối chiếu từng bộ phận'
                          : 'View original 2D CAD blueprint and compare components'
                      }
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span className="truncate">
                          {lang === 'vi' ? 'So Sánh Bản Gốc 2D' : 'Compare 2D Blueprint'}
                        </span>
                      </div>
                      <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-amber-500 text-black shrink-0">
                        8K CAD
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);
