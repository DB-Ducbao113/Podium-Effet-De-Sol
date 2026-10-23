import React from 'react';
import { Check, Palette } from 'lucide-react';
import { EDS_LIVERIES, EDS_LIVERY_IDS, EDSLiveryId } from '../../data/showroom/edsLiveries';

interface EDSLiverySelectorProps {
  selectedId: EDSLiveryId;
  onSelect: (id: EDSLiveryId) => void;
  lang: 'vi' | 'en';
}

export const EDSLiverySelector: React.FC<EDSLiverySelectorProps> = React.memo(
  ({ selectedId, onSelect, lang }) => (
    <div className="flex items-center gap-2 pt-1 border-t border-studio-850/80">
      <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-studio-400 shrink-0 pr-1">
        <Palette className="w-3.5 h-3.5 text-cyan-400" />
        <span>{lang === 'vi' ? 'Màu EDS:' : 'EDS liveries:'}</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 custom-scrollbar w-full">
        {EDS_LIVERY_IDS.map((id) => {
          const preset = EDS_LIVERIES[id];
          const selected = id === selectedId;
          return (
            <button
              key={id}
              data-eds-livery={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={selected}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                selected
                  ? 'bg-studio-900 text-white ring-1 ring-white/40'
                  : 'bg-studio-950/80 text-studio-300 border-studio-800/80 hover:bg-studio-900'
              }`}
              style={selected ? { borderColor: preset.accent } : undefined}
            >
              <span
                className="w-4 h-4 rounded-full border border-white/20 relative overflow-hidden"
                style={{ backgroundColor: preset.primary }}
              >
                <span
                  className="absolute inset-y-0 right-0 w-1/2"
                  style={{ backgroundColor: preset.accent }}
                />
              </span>
              <span>{lang === 'vi' ? preset.nameVi : preset.name}</span>
              {selected && <Check className="w-3.5 h-3.5" style={{ color: preset.accent }} />}
            </button>
          );
        })}
      </div>
    </div>
  ),
);
