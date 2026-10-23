import React from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { F1_HOTSPOTS, HotspotItem } from '../../data/showroom/hotspotsData';
import { getTeam3DLivery } from '../../data/showroom/teamLiveries';
import { TeamId } from '../../types';

interface Props {
  activeHotspot: HotspotItem | null;
  onSelectHotspot: (hotspot: HotspotItem) => void;
  teamId: TeamId;
  lang: 'vi' | 'en';
  hotspots?: HotspotItem[];
  originalMode?: boolean;
}

export const HotspotSelectorBar: React.FC<Props> = React.memo(
  ({
    activeHotspot,
    onSelectHotspot,
    teamId,
    lang,
    hotspots = F1_HOTSPOTS,
    originalMode = false,
  }) => {
    const livery = getTeam3DLivery(teamId);
    const modelName = originalMode ? 'EDS-G01' : livery.shortCarName;
    return (
      <div className="z-20 w-full border-y border-studio-800/80 bg-studio-950/95 px-3 py-3 shadow-xl backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-f1red/30 bg-f1red/10 text-f1red">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  {hotspots.length} {lang === 'vi' ? 'LINH KIỆN KỸ THUẬT' : 'TECHNICAL COMPONENTS'}
                </span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: originalMode ? '#00f0ff' : livery.bodyColor }}
                />
              </div>
              <h3 className="font-display text-xs font-black uppercase tracking-wide text-white sm:text-sm">
                {lang === 'vi' ? `Soi chi tiết ${modelName}` : `Inspect ${modelName} Parts`}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
            {hotspots.map((hotspot, index) => {
              const selected = activeHotspot?.id === hotspot.id;
              return (
                <button
                  key={hotspot.id}
                  type="button"
                  data-eds-hotspot={hotspot.id}
                  onClick={() => onSelectHotspot(hotspot)}
                  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${selected ? 'border-white/60 bg-gradient-to-r from-f1red to-red-700 text-white shadow-lg shadow-f1red/30' : 'border-studio-800 bg-studio-900/90 text-studio-300 hover:border-studio-700 hover:text-white'}`}
                  aria-label={
                    lang === 'vi' ? `Xem cận cảnh ${hotspot.nameVi}` : `Inspect ${hotspot.nameEn}`
                  }
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-lg text-[10px] font-black ${selected ? 'bg-white text-f1red' : 'bg-studio-800 text-studio-300'}`}
                  >
                    {index + 1}
                  </span>
                  <span className="whitespace-nowrap">
                    {lang === 'vi' ? hotspot.nameVi : hotspot.nameEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);
