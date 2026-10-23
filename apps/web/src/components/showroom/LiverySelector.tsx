import React from 'react';
import { TeamId } from '../../types';
import { TEAMS_DATA } from '../../data/teams';
import { Palette, Check } from 'lucide-react';
import { ConstructorLogo } from '../common/ConstructorLogo';

interface LiverySelectorProps {
  selectedTeamId: TeamId;
  onSelectTeam: (teamId: TeamId) => void;
  lang: 'vi' | 'en';
}

const TEAMS_LIST: { id: TeamId; name: string }[] = [
  { id: 'mclaren', name: 'McLaren' },
  { id: 'ferrari', name: 'Ferrari' },
  { id: 'redbull', name: 'Red Bull' },
  { id: 'mercedes', name: 'Mercedes' },
  { id: 'astonmartin', name: 'Aston Martin' },
  { id: 'alpine', name: 'Alpine' },
  { id: 'racingbulls', name: 'Racing Bulls' },
  { id: 'haas', name: 'Haas' },
  { id: 'williams', name: 'Williams' },
  { id: 'audi', name: 'Audi' },
  { id: 'cadillac', name: 'Cadillac' },
];

export const LiverySelector: React.FC<LiverySelectorProps> = React.memo(
  ({ selectedTeamId, onSelectTeam, lang }) => {
    return (
      <div className="flex items-center gap-2 pt-1 border-t border-studio-850/80">
        {/* Category Prefix Tag */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-studio-400 shrink-0 pr-1">
          <Palette className="w-3.5 h-3.5 text-f1red" />
          <span>{lang === 'vi' ? 'Tem xe:' : 'Liveries:'}</span>
        </div>

        {/* Horizontal Scrollable Constructor Cards */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 custom-scrollbar w-full">
          {TEAMS_LIST.map(({ id, name }) => {
            const team = TEAMS_DATA[id];
            const isSelected = selectedTeamId === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectTeam(id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 border cursor-pointer select-none ${
                  isSelected
                    ? 'bg-studio-900 text-white shadow-lg ring-1 ring-white/40'
                    : 'bg-studio-950/80 text-studio-400 border-studio-800/80 hover:bg-studio-900 hover:text-white hover:border-studio-700'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: team.accentColor || team.primaryColor,
                        boxShadow: `0 4px 14px ${team.primaryColor}24`,
                      }
                    : undefined
                }
              >
                {/* Official Team Logo Emblem */}
                <ConstructorLogo teamId={id} size="sm" className="w-4 h-4 shrink-0" />

                {/* Color swatch circle with split accent */}
                <span
                  className="w-3 h-3 rounded-full border border-black/50 shrink-0 relative overflow-hidden"
                  style={{ backgroundColor: team.primaryColor }}
                >
                  <span
                    className="absolute inset-y-0 right-0 w-1/2"
                    style={{ backgroundColor: team.accentColor || team.primaryColor }}
                  />
                </span>

                <span
                  className={isSelected ? 'text-white font-black' : 'text-studio-300 font-semibold'}
                >
                  {name}
                </span>

                {isSelected && (
                  <Check
                    className="w-3.5 h-3.5 ml-0.5"
                    style={{ color: team.accentColor || '#34d399' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
