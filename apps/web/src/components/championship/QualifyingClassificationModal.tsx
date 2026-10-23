import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GrandPrixQualifyingData, QualifyingSessionResult } from '../../types/qualifying';
import { useNavigationStore } from '../../store/useNavigationStore';
import { X, Award, MapPin, Calendar, Zap, Trophy, ShieldCheck } from 'lucide-react';
import { getTeamTextColor } from '../../utils/teamColors';

interface QualifyingModalProps {
  qualifyingData: GrandPrixQualifyingData | null;
  initialSessionKey?: 'qualifying' | 'sprintQualifying' | 'sprint';
  onClose: () => void;
}

export const QualifyingClassificationModal: React.FC<QualifyingModalProps> = ({
  qualifyingData,
  initialSessionKey = 'qualifying',
  onClose,
}) => {
  const { lang } = useNavigationStore();
  const isVi = lang === 'vi';

  const [activeSessionKey, setActiveSessionKey] = useState<
    'qualifying' | 'sprintQualifying' | 'sprint'
  >(initialSessionKey);
  const [prevInitialKey, setPrevInitialKey] = useState(initialSessionKey);

  if (initialSessionKey !== prevInitialKey) {
    setPrevInitialKey(initialSessionKey);
    setActiveSessionKey(initialSessionKey);
  }

  useEffect(() => {
    if (!qualifyingData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [qualifyingData, onClose]);

  if (!qualifyingData) return null;

  const currentSession: QualifyingSessionResult | undefined =
    qualifyingData.sessions[activeSessionKey] ||
    qualifyingData.sessions.qualifying ||
    qualifyingData.sessions.sprintQualifying ||
    qualifyingData.sessions.sprint;

  const availableSessionKeys = (['qualifying', 'sprintQualifying', 'sprint'] as const).filter(
    (key) => Boolean(qualifyingData.sessions[key]),
  );

  const isSprintRace = activeSessionKey === 'sprint';

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
        <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                {isVi ? `Chặng ${qualifyingData.round}` : `Round ${qualifyingData.round}`} ·{' '}
                {qualifyingData.season}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {isSprintRace ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {isVi ? 'Kết Quả Cuộc Đua Sprint' : 'Sprint Race Classification'}
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    {isVi ? 'Bảng Xếp Hạng Phân Hạng' : 'Qualifying Classification'}
                  </>
                )}
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-white tracking-wide">
              {qualifyingData.grandPrix}
            </h3>

            <div className="flex items-center gap-4 text-xs text-studio-400 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-studio-500" />
                {qualifyingData.circuit}
              </span>
              {currentSession && (
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-studio-500" />
                  {currentSession.dateStr}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-studio-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions Tab Bar */}
        {availableSessionKeys.length > 1 && (
          <div className="bg-black/50 border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
            {availableSessionKeys.map((key) => {
              const sess = qualifyingData.sessions[key];
              if (!sess) return null;
              const isActive = activeSessionKey === key;
              const label =
                key === 'qualifying'
                  ? isVi
                    ? 'Đua phân hạng (Qualifying)'
                    : 'Qualifying'
                  : key === 'sprintQualifying'
                    ? isVi
                      ? 'Phân hạng Sprint (SQ)'
                      : 'Sprint Qualifying'
                    : isVi
                      ? 'Đua Sprint'
                      : 'Sprint Race';

              return (
                <button
                  key={key}
                  onClick={() => setActiveSessionKey(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md font-black'
                      : 'bg-white/5 text-studio-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {key === 'sprint' ? (
                    <Zap className="w-3.5 h-3.5" />
                  ) : (
                    <Award className="w-3.5 h-3.5" />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Pole Sitter / Winner Hero Bar */}
        {currentSession?.poleDriver && (
          <div className="bg-black/40 border-b border-white/10 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {isSprintRace ? (
                  <Trophy className="w-4 h-4 text-amber-400" />
                ) : (
                  <Award className="w-4 h-4 text-purple-300" />
                )}
              </span>
              <span className="text-studio-300">
                {isSprintRace
                  ? isVi
                    ? 'Tay đua về nhất Sprint:'
                    : 'Sprint Winner:'
                  : isVi
                    ? 'Giành Vị Trí Pole (P1):'
                    : 'Pole Position (P1):'}
              </span>
              <span
                className="font-extrabold text-sm"
                style={{
                  color: getTeamTextColor(
                    currentSession.poleDriver.team || currentSession.poleDriver.driver,
                    true,
                  ),
                }}
              >
                {currentSession.poleDriver.driver}
              </span>
              <span className="text-studio-400 font-mono text-[11px]">
                ({currentSession.poleDriver.team})
              </span>
              <span className="font-mono text-amber-300 font-bold ml-1.5 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                {currentSession.poleDriver.time}
              </span>
            </div>

            <div className="flex items-center gap-3 text-studio-400 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                {isVi ? 'Kết quả chính thức' : 'Official result'}
              </span>
            </div>
          </div>
        )}

        {/* Drivers Classification Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {currentSession ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-studio-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4 w-12 text-center">{isVi ? 'Hạng' : 'Pos'}</th>
                    <th className="py-3 px-3 w-12 text-center">{isVi ? 'Số' : 'No'}</th>
                    <th className="py-3 px-4">{isVi ? 'Tay Đua' : 'Driver'}</th>
                    <th className="py-3 px-4">{isVi ? 'Đội Đua' : 'Constructor'}</th>
                    {!isSprintRace && (
                      <>
                        <th className="py-3 px-3 text-right font-mono">
                          {activeSessionKey === 'sprintQualifying' ? 'SQ1' : 'Q1'}
                        </th>
                        <th className="py-3 px-3 text-right font-mono">
                          {activeSessionKey === 'sprintQualifying' ? 'SQ2' : 'Q2'}
                        </th>
                        <th className="py-3 px-3 text-right font-mono">
                          {activeSessionKey === 'sprintQualifying' ? 'SQ3' : 'Q3'}
                        </th>
                      </>
                    )}
                    <th className="py-3 px-4 text-right">
                      {isSprintRace
                        ? isVi
                          ? 'Thời gian / Khoảng cách'
                          : 'Time / Gap'
                        : isVi
                          ? 'Vòng tốt nhất'
                          : 'Best Lap'}
                    </th>
                    <th className="py-3 px-4 text-right">
                      {isSprintRace ? (isVi ? 'Điểm' : 'Pts') : isVi ? 'Cách Pole' : 'Gap'}
                    </th>
                    <th className="py-3 px-3 text-center w-16">{isVi ? 'Vòng' : 'Laps'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {currentSession.entries.map((entry) => {
                    const isP1 = entry.position === 1;
                    const isP2 = entry.position === 2;
                    const isP3 = entry.position === 3;
                    const teamColor = getTeamTextColor(entry.teamId || entry.teamName, true);

                    const isQ3Elim = !isSprintRace && entry.position === 10;
                    const isQ2Elim = !isSprintRace && entry.position === 16;

                    return (
                      <React.Fragment key={entry.driverId}>
                        <tr
                          className={`hover:bg-white/[0.04] transition-colors ${
                            isP1 ? 'bg-purple-500/10' : isP2 || isP3 ? 'bg-white/[0.02]' : ''
                          }`}
                        >
                          {/* Position Badge */}
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-mono font-bold text-xs ${
                                isP1
                                  ? 'bg-amber-400 text-black shadow-xs font-black'
                                  : isP2
                                    ? 'bg-slate-300 text-black font-black'
                                    : isP3
                                      ? 'bg-amber-700 text-white font-black'
                                      : 'text-studio-400'
                              }`}
                            >
                              {entry.position}
                            </span>
                          </td>

                          {/* Driver Car Number */}
                          <td className="py-2.5 px-3 text-center font-mono text-studio-400 font-bold">
                            {entry.driverNumber}
                          </td>

                          {/* Driver Name & Code */}
                          <td className="py-2.5 px-4 font-bold">
                            <div className="flex items-center gap-2">
                              <span style={{ color: teamColor }}>{entry.driverName}</span>
                              <span className="text-[10px] font-mono text-studio-400 px-1 py-0.2 rounded bg-white/5 border border-white/10">
                                {entry.driverCode}
                              </span>
                            </div>
                          </td>

                          {/* Team Name */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: teamColor }}
                              />
                              <span
                                className="font-bold truncate max-w-[180px]"
                                style={{ color: teamColor }}
                              >
                                {entry.teamName}
                              </span>
                            </div>
                          </td>

                          {/* Split Q1, Q2, Q3 Times */}
                          {!isSprintRace && (
                            <>
                              <td className="py-2.5 px-3 text-right font-mono text-studio-400 text-[11px]">
                                {entry.q1Time || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-studio-300 text-[11px]">
                                {entry.q2Time || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-purple-300 font-bold text-[11px]">
                                {entry.q3Time || '-'}
                              </td>
                            </>
                          )}

                          {/* Best Lap Time */}
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                            {entry.bestLapTime}
                          </td>

                          {/* Gap or Points */}
                          <td className="py-2.5 px-4 text-right font-mono text-xs">
                            {isSprintRace ? (
                              entry.sprintPoints ? (
                                <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                  +{entry.sprintPoints} PTS
                                </span>
                              ) : (
                                <span className="text-studio-500">0 PTS</span>
                              )
                            ) : (
                              <span
                                className={
                                  isP1
                                    ? 'text-amber-400 font-extrabold tracking-wider'
                                    : 'text-studio-400'
                                }
                              >
                                {entry.gapToPole}
                              </span>
                            )}
                          </td>

                          {/* Laps */}
                          <td className="py-2.5 px-3 text-center font-mono text-studio-400 text-[11px]">
                            {entry.lapsCompleted || '-'}
                          </td>
                        </tr>

                        {/* Cutoff rows */}
                        {isQ3Elim && (
                          <tr>
                            <td
                              colSpan={10}
                              className="py-1 px-4 bg-purple-950/40 text-[10px] text-purple-300 font-bold tracking-wider text-center border-y border-purple-500/20"
                            >
                              {isVi
                                ? '--- Vòng Q3: Top 10 Giành Pole ---'
                                : '--- Q3 Cutoff: Top 10 Shootout ---'}
                            </td>
                          </tr>
                        )}
                        {isQ2Elim && (
                          <tr>
                            <td
                              colSpan={10}
                              className="py-1 px-4 bg-studio-900/40 text-[10px] text-studio-400 font-bold tracking-wider text-center border-y border-white/10"
                            >
                              {isVi
                                ? '--- Bị loại sau Q2 (Hạng 11 - 16) ---'
                                : '--- Eliminated in Q2 (P11 - P16) ---'}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-studio-400 font-medium">
              {isVi
                ? 'Chưa có dữ liệu phân hạng cho chặng này.'
                : 'No qualifying data available for this round.'}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
