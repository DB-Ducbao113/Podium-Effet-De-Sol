import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { t } from '../../i18n/translations';
import { TeamId } from '../../types';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { ConstructorLogo } from '../common/ConstructorLogo';
import { getOriginalTeamVisualAsset } from '../../config/originalVisualAssets';

interface PosterCar {
  id: string;
  name: string; // Tên xe
  shortName: string;
  team: string; // Đội đua
  teamId: TeamId;
  watermark: string;
  color: string;
  imageUrl: string;
  drivers: string; // Thành viên đội đua
}

const POSTER_CARS: PosterCar[] = [
  {
    id: 'sf24',
    name: 'Ferrari SF-24',
    shortName: 'SF-24',
    team: 'Scuderia Ferrari HP',
    teamId: 'ferrari',
    watermark: 'FERRARI',
    color: '#dc0000',
    imageUrl: getOriginalTeamVisualAsset('ferrari'),
    drivers: 'Charles Leclerc #16 · Lewis Hamilton #44',
  },
  {
    id: 'mcl38',
    name: 'McLaren MCL38',
    shortName: 'MCL38',
    team: 'McLaren Formula 1 Team',
    teamId: 'mclaren',
    watermark: 'MCLAREN',
    color: '#ff8000',
    imageUrl: getOriginalTeamVisualAsset('mclaren'),
    drivers: 'Lando Norris #4 · Oscar Piastri #81',
  },
  {
    id: 'rb20',
    name: 'Red Bull RB20',
    shortName: 'RB20',
    team: 'Oracle Red Bull Racing',
    teamId: 'redbull',
    watermark: 'RED BULL',
    color: '#050f26',
    imageUrl: getOriginalTeamVisualAsset('redbull'),
    drivers: 'Max Verstappen #1 · Isack Hadjar #6',
  },
  {
    id: 'w15',
    name: 'Mercedes F1 W15',
    shortName: 'W15',
    team: 'Mercedes-AMG Petronas F1 Team',
    teamId: 'mercedes',
    watermark: 'MERCEDES',
    color: '#c8ccce',
    imageUrl: getOriginalTeamVisualAsset('mercedes'),
    drivers: 'George Russell #63 · Kimi Antonelli #12',
  },
  {
    id: 'amr25',
    name: 'Aston Martin AMR25',
    shortName: 'AMR25',
    team: 'Aston Martin Aramco F1 Team',
    teamId: 'astonmartin',
    watermark: 'ASTON MARTIN',
    color: '#00594f',
    imageUrl: getOriginalTeamVisualAsset('astonmartin'),
    drivers: 'Fernando Alonso #14 · Lance Stroll #18',
  },
  {
    id: 'a525',
    name: 'Alpine A525',
    shortName: 'A525',
    team: 'BWT Alpine Formula 1 Team',
    teamId: 'alpine',
    watermark: 'ALPINE',
    color: '#0090ff',
    imageUrl: getOriginalTeamVisualAsset('alpine'),
    drivers: 'Pierre Gasly #10 · Franco Colapinto #43',
  },
  {
    id: 'vcarb02',
    name: 'Racing Bulls VCARB 02',
    shortName: 'VCARB 02',
    team: 'Visa Cash App RB F1 Team',
    teamId: 'racingbulls',
    watermark: 'RACING BULLS',
    color: '#1634cb',
    imageUrl: getOriginalTeamVisualAsset('racingbulls'),
    drivers: 'Liam Lawson #30 · Arvid Lindblad #41',
  },
  {
    id: 'vf25',
    name: 'Haas VF-25',
    shortName: 'VF-25',
    team: 'MoneyGram Haas F1 Team',
    teamId: 'haas',
    watermark: 'HAAS',
    color: '#e5e7eb',
    imageUrl: getOriginalTeamVisualAsset('haas'),
    drivers: 'Esteban Ocon #31 · Oliver Bearman #87',
  },
  {
    id: 'fw47',
    name: 'Williams FW47',
    shortName: 'FW47',
    team: 'Williams Racing',
    teamId: 'williams',
    watermark: 'WILLIAMS',
    color: '#002447',
    imageUrl: getOriginalTeamVisualAsset('williams'),
    drivers: 'Carlos Sainz #55 · Alex Albon #23',
  },
  {
    id: 'c45',
    name: 'Audi F1 (Sauber C45)',
    shortName: 'C45',
    team: 'Audi Formula 1 Team',
    teamId: 'audi',
    watermark: 'AUDI F1',
    color: '#c4c8cc',
    imageUrl: getOriginalTeamVisualAsset('audi'),
    drivers: 'Nico Hülkenberg #27 · Gabriel Bortoleto #5',
  },
  {
    id: 'cadillac-mac26',
    name: 'Cadillac MAC-26',
    shortName: 'CADILLAC',
    team: 'Cadillac Formula 1 Team',
    teamId: 'cadillac',
    watermark: 'CADILLAC',
    color: '#d4af37',
    imageUrl: getOriginalTeamVisualAsset('cadillac'),
    drivers: 'Sergio Pérez #11 · Valtteri Bottas #77',
  },
];

const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) * 0.22;
    const dy = (e.clientY - centerY) * 0.22;
    setOffset({
      x: Math.max(-6, Math.min(6, dx)),
      y: Math.max(-6, Math.min(6, dy)),
    });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={className}
    >
      {children}
    </button>
  );
};

export function FullscreenCarStageHeading({ lang }: { lang: keyof typeof t }) {
  const { heroTitle1, heroTitle2 } = t[lang].home;
  return (
    <h1
      data-testid="car-stage-heading"
      className={`text-2xl sm:text-4xl font-bold uppercase text-white ${lang === 'vi' ? 'font-body leading-[1.3] tracking-normal' : 'font-display leading-[1.2] tracking-normal'}`}
    >
      <span className="block">{heroTitle1}</span> <span className="block">{heroTitle2}</span>
    </h1>
  );
}

export const FullscreenCarStage: React.FC = React.memo(() => {
  const { lang } = useNavigationStore();
  const navigate = useNavigate();
  const strings = t[lang].home;

  // Active expanded car index (default to null: show all 11 teams evenly)
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isAnyActive = activeIndex !== null;

  // Hero Cursor Glow State (A3)
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [heroCursor, setHeroCursor] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setHeroCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  const handleHeroMouseLeave = () => {
    setHeroCursor((prev) => ({ ...prev, visible: false }));
  };

  // 3D Tilt State on active panel (A4)
  const [tilt, setTilt] = useState<{
    rotateX: number;
    rotateY: number;
    glareX: number;
    glareY: number;
  } | null>(null);

  const handleActivePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = ((centerY - y) / centerY) * 5; // max 5 deg
    const rotY = ((x - centerX) / centerX) * 5;
    setTilt({
      rotateX: rotX,
      rotateY: rotY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    });
  };

  const handleActivePanelMouseLeave = () => {
    setTilt(null);
  };

  // Auto-rotate references (Plan 2.2)
  const idleTimeoutRef = useRef<number | null>(null);
  const rotateIntervalRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);

  const startAutoRotate = useCallback(() => {
    if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);
    rotateIntervalRef.current = window.setInterval(() => {
      if (isUserInteractingRef.current) return;
      setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % POSTER_CARS.length));
    }, 5000);
  }, []);

  const stopAutoRotate = useCallback(() => {
    isUserInteractingRef.current = true;
    if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    // After 8s of inactivity, resume auto-rotate
    idleTimeoutRef.current = window.setTimeout(() => {
      isUserInteractingRef.current = false;
      startAutoRotate();
    }, 8000);
  }, [startAutoRotate]);

  useEffect(() => {
    // Initial 8s delay before auto-rotate starts
    idleTimeoutRef.current = window.setTimeout(startAutoRotate, 8000);

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);
    };
  }, [startAutoRotate]);

  return (
    <div
      ref={heroRef}
      onMouseMove={handleHeroMouseMove}
      onMouseLeave={handleHeroMouseLeave}
      className="relative w-full bg-[#050508] text-white pt-6 pb-10 overflow-hidden select-none border-b border-studio-800"
    >
      {/* ── A3. Cursor Glow trên nền Hero Đen ── */}
      {heroCursor.visible && (
        <div
          aria-hidden="true"
          className="absolute pointer-events-none z-[1] transition-opacity duration-200"
          style={{
            top: heroCursor.y - 250,
            left: heroCursor.x - 250,
            width: 500,
            height: 500,
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 45%, transparent 70%)',
          }}
        />
      )}

      {/* ── Ambient Speed-Lines on Dark Hero Background (Plan 2.3) ── */}
      <div className="absolute inset-y-0 right-0 w-2/3 pointer-events-none overflow-hidden z-0 motion-reduce:hidden">
        <div className="absolute top-1/4 right-1/4 w-[2px] h-[35vh] bg-gradient-to-b from-transparent via-white to-transparent transform -rotate-45 animate-speed-drift-1" />
        <div className="absolute top-1/3 right-1/2 w-[1.5px] h-[40vh] bg-gradient-to-b from-transparent via-white to-transparent transform -rotate-45 animate-speed-drift-2" />
        <div className="absolute top-1/2 right-1/6 w-[2px] h-[30vh] bg-gradient-to-b from-transparent via-white to-transparent transform -rotate-45 animate-speed-drift-3" />
      </div>

      {/* ── Top Header Controls & Badges ── */}
      <div className="page-container mb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-widest text-f1red">
            <span className="w-2 h-2 rounded-full bg-f1red animate-pulse" />
            <span>
              {lang === 'vi'
                ? '11 ĐỘI ĐUA 2026 · HÌNH ẢNH LƯU TRỮ'
                : '11 TEAMS FOR 2026 · ARCHIVE IMAGERY'}
            </span>
          </div>

          <FullscreenCarStageHeading lang={lang} />
        </div>

        {/* ── A2. Magnetic Action CTAs ── */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <MagneticButton
            onClick={() => {
              navigate('/showroom');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-f1red text-white text-xs font-bold uppercase tracking-wider hover:bg-f1red/90 shadow-lg hover:shadow-f1red/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Khám Phá Showroom 3D' : 'Explore 3D Showroom'}</span>
          </MagneticButton>

          <MagneticButton
            onClick={() => {
              navigate('/season/2026');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider border border-white/15 backdrop-blur-md cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{strings.viewStandings}</span>
          </MagneticButton>
        </div>
      </div>

      {/* ── 11-Car Interactive Multi-Slice Poster Canvas ── */}
      <div className="page-container relative z-10">
        <div
          onMouseLeave={() => {
            setActiveIndex(null);
            stopAutoRotate();
          }}
          onMouseEnter={stopAutoRotate}
          onTouchStart={stopAutoRotate}
          className="relative w-full h-[560px] sm:h-[640px] lg:h-[700px] rounded-3xl overflow-hidden bg-[#07070b] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-row"
        >
          {POSTER_CARS.map((car, idx) => {
            const isExpanded = idx === activeIndex;

            return (
              <div
                key={car.id}
                onMouseEnter={() => {
                  stopAutoRotate();
                  setActiveIndex(idx);
                }}
                onMouseMove={isExpanded ? handleActivePanelMouseMove : undefined}
                onMouseLeave={() => {
                  if (isExpanded) handleActivePanelMouseLeave();
                }}
                onClick={() => {
                  stopAutoRotate();
                  setActiveIndex(activeIndex === idx ? null : idx);
                }}
                style={{
                  flex: isExpanded ? 12 : 1,
                  transition:
                    isExpanded && tilt
                      ? 'flex 450ms cubic-bezier(0.25, 1, 0.5, 1)'
                      : 'flex 450ms cubic-bezier(0.25, 1, 0.5, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                  transform:
                    isExpanded && tilt
                      ? `perspective(1000px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg)`
                      : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                }}
                className={`relative h-full overflow-hidden cursor-pointer select-none group border-r border-white/10 last:border-r-0 min-w-[28px] sm:min-w-[32px] ${
                  isExpanded ? 'z-20 shadow-2xl' : 'z-10 hover:brightness-125'
                }`}
              >
                {/* ── A4. Glare Beam Overlay on 3D Tilt ── */}
                {isExpanded && tilt && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
                    }}
                  />
                )}
                {/* ── 1. COLLAPSED VIEW (SLICE / RIBBON STATE) ── */}
                <div
                  className={`absolute inset-0 flex flex-col justify-between items-center py-6 px-1 transition-opacity duration-300 pointer-events-none ${
                    isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  {/* Background Sliced Image with Vignette */}
                  <img
                    src={car.imageUrl}
                    alt={`${car.name} editorial profile with an original Podium EDS-G01 study`}
                    className={`absolute inset-0 w-full h-full object-cover object-center filter contrast-125 group-hover:scale-110 transition-all duration-700 ${
                      !isAnyActive
                        ? 'brightness-[0.45] group-hover:brightness-[0.7]'
                        : 'brightness-[0.35]'
                    }`}
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Gradient Overlay & Ambient Tint */}
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-300 group-hover:opacity-75"
                    style={{
                      background: `linear-gradient(to bottom, transparent 20%, ${car.color} 100%)`,
                    }}
                  />
                  <div
                    className={`absolute inset-0 transition-colors ${
                      !isAnyActive
                        ? 'bg-black/35 group-hover:bg-black/10'
                        : 'bg-black/40 group-hover:bg-black/10'
                    }`}
                  />

                  {/* Accent Line Indicator */}
                  <div className="z-10 flex flex-col items-center">
                    <div
                      className={`rounded-full shadow-sm transition-all duration-300 ${
                        !isAnyActive ? 'w-2 h-7 group-hover:h-10' : 'w-1.5 h-8 group-hover:h-12'
                      }`}
                      style={{ backgroundColor: car.color }}
                    />
                  </div>

                  {/* Centered constructor mark replaces the hard-to-read vertical car name */}
                  <div className="z-10 flex flex-col items-center justify-center flex-1 my-auto">
                    <ConstructorLogo
                      teamId={car.teamId}
                      size="lg"
                      className={`rounded-xl border border-white/10 bg-black/25 p-1.5 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-all duration-300 group-hover:border-white/30 group-hover:bg-black/45 ${
                        !isAnyActive
                          ? 'scale-100 opacity-100 group-hover:scale-110'
                          : 'scale-[0.68] opacity-85 group-hover:scale-75 group-hover:opacity-100'
                      }`}
                    />
                  </div>

                  {/* Bottom Indicator & Driver badge when wide */}
                  <div className="z-10 flex flex-col items-center gap-1.5 pb-2">
                    {!isAnyActive && (
                      <span className="text-[10px] font-mono font-bold text-white/70 group-hover:text-white transition-colors">
                        {car.teamId.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-xs ring-2 ring-white/20 transition-transform group-hover:scale-125"
                      style={{ backgroundColor: car.color }}
                    />
                  </div>
                </div>

                {/* ── 2. EXPANDED VIEW (FULL CAR POSTER SHOWCASE) ── */}
                <div
                  className={`absolute inset-0 w-full h-full flex flex-col justify-between p-6 sm:p-10 transition-all duration-500 ${
                    isExpanded
                      ? 'opacity-100 pointer-events-auto delay-75 scale-100'
                      : 'opacity-0 pointer-events-none scale-98'
                  }`}
                >
                  {/* Ambient Livery Radial Glow Behind Active Car */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30 transition-all duration-1000"
                    style={{
                      background: `radial-gradient(ellipse at 50% 50%, ${car.color} 0%, transparent 70%)`,
                    }}
                  />

                  {/* Huge Watermark Background Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                    <span className="font-display text-[12vw] font-black uppercase tracking-widest text-white/[0.04] whitespace-nowrap select-none">
                      {car.watermark}
                    </span>
                  </div>

                  {/* ── MASSIVE UNCROPPED FULL CAR PRESENTATION ── */}
                  <div className="relative z-10 w-full flex-1 flex items-center justify-center my-auto">
                    <div className="relative w-full h-[300px] sm:h-[390px] lg:h-[450px] flex items-center justify-center">
                      {isExpanded && (
                        <img
                          src={car.imageUrl}
                          alt={`${car.name} editorial profile with an original Podium EDS-G01 study`}
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_30px_45px_rgba(0,0,0,0.95)] hover:scale-102 transition-transform duration-500 ease-out animate-ken-burns"
                          loading="eager"
                          decoding="async"
                        />
                      )}

                      {/* Glowing Underfloor Light Floor Reflection */}
                      <div
                        className="absolute -bottom-6 w-3/4 h-12 rounded-full blur-2xl pointer-events-none opacity-50 transition-all duration-700"
                        style={{ backgroundColor: car.color }}
                      />
                    </div>
                  </div>

                  {/* Minimalist Bottom Bar: Chỉ đơn giản là Tên xe, Đội đua, và Thành viên đội đua */}
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 sm:p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="space-y-1">
                      {/* Đội đua */}
                      <div className="flex items-center gap-2">
                        <ConstructorLogo teamId={car.teamId} size="sm" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                          {car.team}
                        </span>
                      </div>

                      {/* Tên xe */}
                      <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
                        {car.name}
                      </h2>

                      {/* Thành viên của đội đua */}
                      <p className="text-xs sm:text-sm font-mono text-studio-300 font-medium pt-1">
                        {car.drivers}
                      </p>
                    </div>

                    {/* Nút vào Showroom 3D */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/showroom?team=${car.teamId}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-studio-950 hover:bg-white/90 text-xs font-black uppercase tracking-wider shadow-xl hover:scale-105 transition-all shrink-0 cursor-pointer"
                    >
                      <span>{lang === 'vi' ? `Xem Showroom 3D` : `View 3D Showroom`}</span>
                      <ArrowRight className="w-4 h-4 text-f1red" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 11 Indicator Dots (Plan 2.2) ── */}
        <div className="flex items-center justify-center gap-2 mt-4 select-none">
          {POSTER_CARS.map((car, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={car.id}
                onClick={() => {
                  stopAutoRotate();
                  setActiveIndex(idx);
                }}
                title={car.name}
                aria-label={`Select ${car.name}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive ? 'w-7 h-2 bg-f1red shadow-xs' : 'w-2 h-2 bg-white/20 hover:bg-white/50'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
