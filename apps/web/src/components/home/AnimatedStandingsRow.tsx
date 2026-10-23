import React, { useState } from 'react';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import { TeamId } from '../../types';
import { ConstructorLogo } from '../common/ConstructorLogo';

interface AnimatedStandingsRowProps {
  rank: number;
  name: string;
  subName?: string;
  flag?: string;
  teamId: TeamId;
  teamColor: string;
  points: number;
  wins: number;
  podiums: number;
  inView: boolean;
  lang: 'vi' | 'en';
  onClick: () => void;
  actionButton?: React.ReactNode;
}

export const AnimatedStandingsRow: React.FC<AnimatedStandingsRowProps> = ({
  rank,
  name,
  subName,
  flag,
  teamId,
  teamColor,
  points,
  wins,
  podiums,
  inView,
  lang,
  onClick,
  actionButton,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { value: animatedPoints, isDone } = useAnimatedCounter(points, 1200, inView);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderColor: isHovered ? `${teamColor}90` : `${teamColor}40`,
        boxShadow: isHovered ? `0 10px 25px -5px ${teamColor}33` : undefined,
      }}
      className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-studio-50 border hover:bg-white hover:-translate-y-1 transition-all duration-300 cursor-pointer group select-none relative overflow-hidden"
    >
      {/* ── C2. Team-Color Wipe from Left on Hover ── */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none origin-left transition-all ${
          isHovered ? 'scale-x-100 opacity-15' : 'scale-x-0 opacity-0'
        }`}
        style={{
          backgroundColor: teamColor,
          transitionDuration: '350ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      {/* Left Info: Rank, Name, Team Logo */}
      <div className="flex items-center gap-3 relative z-10 min-w-0">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center font-display font-black text-xs shrink-0 ${
            rank === 1
              ? 'bg-amber-400 text-black shadow-xs ring-2 ring-amber-400/30'
              : rank === 2
                ? 'bg-studio-300 text-studio-900'
                : 'bg-amber-700 text-white'
          }`}
        >
          {rank}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="font-bold text-sm block truncate group-hover:underline"
              style={{ color: teamColor }}
            >
              {name}
            </span>
            {flag && (
              <span className="text-xs" title={flag}>
                {flag}
              </span>
            )}
          </div>

          {subName && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="group-hover:scale-105 transition-transform duration-300 shrink-0">
                <ConstructorLogo teamId={teamId} size="sm" />
              </div>
              <span className="text-xs font-semibold truncate text-studio-600 block">
                {subName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Info: Animated Points & Wins/Podiums */}
      <div className="flex items-center gap-3 shrink-0 relative z-10 pl-2">
        <div className="text-right">
          <span
            className={`font-display font-black text-base text-studio-950 block tabular-nums leading-none ${
              rank === 1 && isDone ? 'animate-champion-flash text-amber-500' : ''
            } ${isHovered ? 'animate-score-flicker' : ''}`}
          >
            {animatedPoints}{' '}
            <span className="text-xs font-sans text-studio-500">
              {lang === 'vi' ? 'ĐIỂM' : 'PTS'}
            </span>
          </span>
          <span className="text-[10px] text-studio-400 block mt-1">
            {wins} {lang === 'vi' ? 'thắng' : 'wins'} · {podiums} podium
          </span>
        </div>

        {actionButton}
      </div>
    </div>
  );
};
