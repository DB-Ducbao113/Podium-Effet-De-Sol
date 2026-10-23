import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GrandPrixPracticeData, PracticeSessionResult } from '../../types/practice';
import { useNavigationStore } from '../../store/useNavigationStore';
import { formatSessionName } from '../../utils/dateUtils';
import { getTeamTextColor } from '../../utils/teamColors';
import { X, Timer, MapPin, Thermometer, Sun } from 'lucide-react';

interface PracticeModalProps {
  practiceData: GrandPrixPracticeData | null;
  initialSessionKey?: 'fp1' | 'fp2' | 'fp3';
  onClose: () => void;
}

export const PracticeClassificationModal: React.FC<PracticeModalProps> = ({
  practiceData,
  initialSessionKey = 'fp1',
  onClose,
}) => {
  const { lang } = useNavigationStore();
  const isVi = lang === 'vi';

  const [activeSessionKey, setActiveSessionKey] = useState<'fp1' | 'fp2' | 'fp3'>(
    initialSessionKey,
  );
  const [prevInitialKey, setPrevInitialKey] = useState(initialSessionKey);

  if (initialSessionKey !== prevInitialKey) {
    setPrevInitialKey(initialSessionKey);
    setActiveSessionKey(initialSessionKey);
  }

  useEffect(() => {
    if (!practiceData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [practiceData, onClose]);

  if (!practiceData) return null;

  const currentSession: PracticeSessionResult | undefined =
    practiceData.sessions[activeSessionKey] ||
    practiceData.sessions.fp1 ||
    practiceData.sessions.fp2 ||
    practiceData.sessions.fp3;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-studio-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-white animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-emerald-400 to-sky-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-500/15 px-2.5 py-0.5 rounded-full border border-sky-500/30">
                {isVi ? `Chặng ${practiceData.round}` : `Round ${practiceData.round}`} ·{' '}
                {practiceData.season}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Timer className="w-3.5 h-3.5" />
                {isVi ? 'Bảng Điểm Tập Thử Practice' : 'Free Practice Classification'}
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-white tracking-wide">
              {practiceData.grandPrix}
            </h3>

            <div className="flex items-center gap-4 text-xs text-studio-400 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-studio-500" />
                {practiceData.circuit}
              </span>
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

        {/* Practice Sessions Selector Tabs */}
        <div className="bg-black/50 border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          {(['fp1', 'fp2', 'fp3'] as const).map((key) => {
            const sess = practiceData.sessions[key];
            if (!sess) return null;
            const isActive = activeSessionKey === key;
            const isFinished = sess.status === 'finished';

            return (
              <button
                key={key}
                onClick={() => setActiveSessionKey(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
                  isActive
                    ? 'bg-sky-500 text-black border-sky-400 shadow-md font-black'
                    : 'bg-white/5 text-studio-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{formatSessionName(sess.sessionName, lang)}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-black/20 text-black font-bold'
                      : isFinished
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-studio-800 text-studio-400'
                  }`}
                >
                  {isFinished ? (isVi ? 'Đã chạy' : 'Finished') : isVi ? 'Sắp tới' : 'Scheduled'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Session Summary Bar (Fastest Lap & Weather) */}
        {currentSession && (
          <div className="bg-black/40 border-b border-white/10 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {currentSession.fastestDriver && (
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-sky-400" />
                <span className="text-studio-400">
                  {isVi ? 'Nhanh nhất phiên:' : 'Fastest in session:'}
                </span>
                <span
                  className="font-bold"
                  style={{
                    color: getTeamTextColor(
                      currentSession.fastestDriver.team || currentSession.fastestDriver.driver,
                      true,
                    ),
                  }}
                >
                  {currentSession.fastestDriver.driver}
                </span>
                <span className="text-studio-500 font-mono">
                  ({currentSession.fastestDriver.team})
                </span>
                <span className="font-mono text-sky-300 font-bold ml-1">
                  {currentSession.fastestDriver.time}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 text-studio-400 font-mono text-[11px]">
              {currentSession.weather && (
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  {currentSession.weather}
                </span>
              )}
              {currentSession.airTempC && (
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                  Air: {currentSession.airTempC}°C
                </span>
              )}
              {currentSession.trackTempC && (
                <span className="text-studio-500">Track: {currentSession.trackTempC}°C</span>
              )}
            </div>
          </div>
        )}

        {/* Driver Classification Table for Practice Session */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {currentSession ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-studio-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4 w-12 text-center">{isVi ? 'Hạng' : 'Pos'}</th>
                    <th className="py-3 px-3 w-12 text-center">{isVi ? 'Số' : 'No'}</th>
                    <th className="py-3 px-4">{isVi ? 'Tay Đua' : 'Driver'}</th>
                    <th className="py-3 px-4">{isVi ? 'Đội Đua' : 'Constructor'}</th>
                    <th className="py-3 px-4 text-right">
                      {isVi ? 'Thời Gian Tốt Nhất' : 'Best Lap Time'}
                    </th>
                    <th className="py-3 px-4 text-right">{isVi ? 'Cách Biệt P1' : 'Gap to P1'}</th>
                    <th className="py-3 px-3 text-center">{isVi ? 'Số Vòng' : 'Laps'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {currentSession.entries.map((entry) => {
                    const isP1 = entry.position === 1;

                    return (
                      <tr
                        key={`${activeSessionKey}-${entry.driverId}`}
                        className={`hover:bg-white/[0.03] transition-colors ${
                          isP1 ? 'bg-sky-500/10' : ''
                        }`}
                      >
                        {/* Position */}
                        <td className="py-3 px-4 text-center font-bold">
                          {isP1 ? (
                            <span className="inline-flex w-6 h-6 rounded-full bg-sky-400 text-black font-black text-xs items-center justify-center shadow">
                              1
                            </span>
                          ) : entry.position <= 3 ? (
                            <span className="inline-flex w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs items-center justify-center">
                              {entry.position}
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
                          <span className="font-mono text-xs text-studio-400 w-8">
                            {entry.driverCode}
                          </span>
                          <span
                            style={{
                              color: getTeamTextColor(entry.teamId || entry.teamName, true),
                            }}
                          >
                            {entry.driverName}
                          </span>
                        </td>

                        {/* Team Name */}
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

                        {/* Best Lap Time */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-sky-300">
                          {entry.bestLapTime}
                        </td>

                        {/* Gap to P1 */}
                        <td className="py-3 px-4 text-right font-mono text-studio-300">
                          {entry.gapToP1 === 'LEADER' ? (
                            <span className="text-emerald-400 font-bold">LEADER</span>
                          ) : (
                            entry.gapToP1
                          )}
                        </td>

                        {/* Laps Completed */}
                        <td className="py-3 px-3 text-center font-mono text-studio-400">
                          {entry.lapsCompleted}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-studio-400 text-sm">
              {isVi ? 'Phiên chạy chưa diễn ra.' : 'Session not held yet.'}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-studio-400">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-sky-400" />
            <span>FIA Formula 1 World Championship · Practice Telemetry</span>
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
export default PracticeClassificationModal;
