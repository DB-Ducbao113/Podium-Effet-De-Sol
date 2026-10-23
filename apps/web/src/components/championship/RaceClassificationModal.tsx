import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DetailedRaceResult } from '../../types';
import { useNavigationStore } from '../../store/useNavigationStore';
import { formatDateStr } from '../../utils/dateUtils';
import { getTeamTextColor } from '../../utils/teamColors';
import { X, Trophy, Zap, Flag, Calendar, MapPin, ShieldCheck, Award } from 'lucide-react';

interface RaceClassificationModalProps {
  race: DetailedRaceResult | null;
  onClose: () => void;
}

export const RaceClassificationModal: React.FC<RaceClassificationModalProps> = ({
  race,
  onClose,
}) => {
  const { lang } = useNavigationStore();
  const isVi = lang === 'vi';

  // Close on Escape key
  useEffect(() => {
    if (!race) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [race, onClose]);

  if (!race) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-studio-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-white animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-f1red via-amber-500 to-f1red" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-f1red bg-f1red/15 px-2.5 py-0.5 rounded-full border border-f1red/30">
                {isVi ? `Vòng ${race.round}` : `Round ${race.round}`} · {race.season}
              </span>
              {race.isSynthesized ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <ShieldCheck className="w-3 h-3" />{' '}
                  {isVi
                    ? 'Dữ liệu suy diễn (Unofficial) — chỉ để hiển thị, không tính BXH'
                    : 'Synthesized data (Unofficial) — display only, excluded from standings'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />{' '}
                  {isVi ? 'Kết Quả Chính Thức' : 'Official Classification'}
                </span>
              )}
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-white tracking-wide">
              {race.grandPrix}
            </h3>

            <div className="flex items-center gap-4 text-xs text-studio-400 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-studio-500" />
                {race.circuit}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-studio-500" />
                {formatDateStr(race.date, lang)}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Flag className="w-3.5 h-3.5 text-studio-500" />
                {race.lapsTotal} {isVi ? 'Vòng' : 'Laps'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-studio-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Winner & Fastest Lap Highlights Bar */}
        <div className="bg-black/40 border-b border-white/10 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {race.winner && (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-studio-400">{isVi ? 'Chiến thắng:' : 'Winner:'}</span>
              <span
                className="font-bold"
                style={{ color: getTeamTextColor(race.winner.team || race.winner.driver, true) }}
              >
                {race.winner.driver}
              </span>
              <span className="text-studio-500 font-mono">({race.winner.team})</span>
              <span className="font-mono text-amber-400 ml-1 font-bold">{race.winner.time}</span>
            </div>
          )}

          {race.fastestLap && (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-studio-400">{isVi ? 'Vòng nhanh nhất:' : 'Fastest Lap:'}</span>
              <span
                className="font-bold"
                style={{
                  color: getTeamTextColor(race.fastestLap.team || race.fastestLap.driver, true),
                }}
              >
                {race.fastestLap.driver}
              </span>
              <span className="font-mono text-purple-300 font-bold ml-1">
                {race.fastestLap.time}
              </span>
            </div>
          )}
        </div>

        {/* 20-Driver Classification Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-studio-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4 w-12 text-center">{isVi ? 'Hạng' : 'Pos'}</th>
                  <th className="py-3 px-3 w-12 text-center">{isVi ? 'Số' : 'No'}</th>
                  <th className="py-3 px-4">{isVi ? 'Tay Đua' : 'Driver'}</th>
                  <th className="py-3 px-4">{isVi ? 'Đội Đua' : 'Constructor'}</th>
                  <th className="py-3 px-3 text-center">{isVi ? 'Số Vòng' : 'Laps'}</th>
                  <th className="py-3 px-4 text-right">
                    {isVi ? 'Thời Gian / Cách Biệt' : 'Time / Gap'}
                  </th>
                  <th className="py-3 px-4 text-right">{isVi ? 'Điểm (PTS)' : 'Points'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {race.entries.map((entry) => {
                  const isPodium = entry.position >= 1 && entry.position <= 3;
                  const isDNF =
                    entry.status.toLowerCase().includes('dnf') ||
                    entry.status.toLowerCase().includes('dns');

                  return (
                    <tr
                      key={`${race.id}-${entry.driverId}`}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isPodium ? 'bg-white/[0.015]' : ''
                      }`}
                    >
                      {/* Position */}
                      <td className="py-3 px-4 text-center font-bold">
                        {entry.position === 1 ? (
                          <span className="inline-flex w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs items-center justify-center shadow">
                            1
                          </span>
                        ) : entry.position === 2 ? (
                          <span className="inline-flex w-6 h-6 rounded-full bg-slate-300 text-black font-black text-xs items-center justify-center">
                            2
                          </span>
                        ) : entry.position === 3 ? (
                          <span className="inline-flex w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs items-center justify-center">
                            3
                          </span>
                        ) : (
                          <span className="font-mono text-studio-400">{entry.position}</span>
                        )}
                      </td>

                      {/* Driver Number */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-studio-400">
                        #{entry.driverNumber}
                      </td>

                      {/* Driver Name */}
                      <td className="py-3 px-4 font-bold flex items-center gap-2">
                        {entry.position === 1 && (
                          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span
                          style={{ color: getTeamTextColor(entry.teamId || entry.teamName, true) }}
                        >
                          {entry.driverName}
                        </span>
                      </td>

                      {/* Constructor */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                          style={{
                            backgroundColor: `${getTeamTextColor(entry.teamId || entry.teamName, true)}18`,
                            borderColor: `${getTeamTextColor(entry.teamId || entry.teamName, true)}55`,
                            color: getTeamTextColor(entry.teamId || entry.teamName, true),
                          }}
                        >
                          {entry.teamName}
                        </span>
                      </td>

                      {/* Laps */}
                      <td className="py-3 px-3 text-center font-mono text-studio-300">
                        {entry.laps}
                      </td>

                      {/* Time / Gap / Status */}
                      <td className="py-3 px-4 text-right font-mono">
                        {isDNF ? (
                          <span className="text-red-400 font-bold uppercase">{entry.status}</span>
                        ) : (
                          <span
                            className={
                              entry.position === 1 ? 'text-amber-400 font-bold' : 'text-studio-300'
                            }
                          >
                            {entry.timeOrGap}
                          </span>
                        )}
                      </td>

                      {/* Points */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {entry.points > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-white/10 text-white">
                            +{entry.points}
                          </span>
                        ) : (
                          <span className="text-studio-500">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-studio-400">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-f1red" />
            <span>FIA Formula 1 World Championship</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
          >
            {isVi ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
export default RaceClassificationModal;
