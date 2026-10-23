import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  openF1Service,
  OpenF1Driver,
  OpenF1Location,
  OpenF1CarData,
  OpenF1RaceControl,
  OpenF1ErrorCode,
  CURATED_REPLAY_RACES,
  CuratedReplayRace,
} from '../../services/openF1Service';
import { Play, Pause, RotateCcw, Radio, Flag, ExternalLink } from 'lucide-react';

interface DriverRenderState {
  driver: OpenF1Driver;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  speed: number;
  gear: number;
  drs: boolean;
  position: number;
  gapSec: number;
}

interface OpenF1LiveMapProps {
  lang: 'vi' | 'en';
}

export const OpenF1LiveMap: React.FC<OpenF1LiveMapProps> = ({ lang }) => {
  const isVi = lang === 'vi';

  // Mode: Live vs Replay
  const [mode] = useState<'live' | 'replay'>('replay');
  const [selectedRace, setSelectedRace] = useState<CuratedReplayRace>(CURATED_REPLAY_RACES[0]);

  // Session & Drivers metadata
  const [driversMap, setDriversMap] = useState<Record<number, OpenF1Driver>>({});
  const [activeSessionKey, setActiveSessionKey] = useState<number>(
    CURATED_REPLAY_RACES[0].sessionKey,
  );
  const [sessionTitle, setSessionTitle] = useState<string>(CURATED_REPLAY_RACES[0].name);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTimeOffsetSec, setCurrentTimeOffsetSec] = useState<number>(0);
  const maxRaceDurationSec = 5400; // 90 minutes

  // Active Race Control Flag & Selected Driver
  const [latestFlag, setLatestFlag] = useState<OpenF1RaceControl | null>(null);
  const [focusedDriverNumber, setFocusedDriverNumber] = useState<number | null>(null);

  // Telemetry transport error, sourced from the service error code.
  // Set when a poll fails with no usable data; cleared once data flows again.
  // ('ok'/null both mean "no banner".)
  const [telemetryError, setTelemetryError] = useState<OpenF1ErrorCode>(null);

  // Calibration coordinate bounds
  const [bounds, setBounds] = useState<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  // Drivers dynamic positions state
  const [driversState, setDriversState] = useState<Record<number, DriverRenderState>>({});

  // Load drivers for active session
  useEffect(() => {
    let isCancelled = false;
    async function loadDrivers() {
      const drivers = await openF1Service.getSessionDrivers(activeSessionKey);
      if (isCancelled || !drivers || drivers.length === 0) return;

      const map: Record<number, OpenF1Driver> = {};
      drivers.forEach((d) => {
        map[d.driver_number] = d;
      });
      setDriversMap(map);
    }
    loadDrivers();
    return () => {
      isCancelled = true;
    };
  }, [activeSessionKey]);

  // Fetch telemetry window based on current replay time or live time
  const fetchTelemetrySnapshot = useCallback(async () => {
    let startIso: string;
    let endIso: string;

    if (mode === 'live') {
      const now = new Date();
      endIso = now.toISOString();
      startIso = new Date(now.getTime() - 4000).toISOString();
    } else {
      // Replay mode from base time + offset
      const baseDate = new Date(selectedRace.sampleStartTime);
      const currentReplayDate = new Date(baseDate.getTime() + currentTimeOffsetSec * 1000);
      startIso = currentReplayDate.toISOString();
      endIso = new Date(currentReplayDate.getTime() + 3000).toISOString();
    }

    try {
      const [locations, carData, positions, raceControl] = await Promise.all([
        openF1Service.getLocationWindow(activeSessionKey, startIso, endIso),
        openF1Service.getCarDataWindow(activeSessionKey, startIso, endIso),
        openF1Service.getPositions(activeSessionKey),
        openF1Service.getRaceControl(activeSessionKey),
      ]);

      if (raceControl && raceControl.length > 0) {
        setLatestFlag(raceControl[raceControl.length - 1]);
      }

      // Build quick lookups
      const posMap: Record<number, number> = {};
      positions.forEach((p) => {
        posMap[p.driver_number] = p.position;
      });

      const carMap: Record<number, OpenF1CarData> = {};
      carData.forEach((c) => {
        carMap[c.driver_number] = c;
      });

      if (!locations || locations.length === 0) {
        // No usable telemetry: surface the transport reason (if any) until
        // a later poll recovers.
        const code = openF1Service.lastErrorCode;
        if (code && code !== 'ok') setTelemetryError(code);
        return;
      }
      // Data is flowing again: reset any previous transport error.
      setTelemetryError(null);

      // Update / Calibrate bounds dynamically from active points
      let curMinX = bounds?.minX ?? Infinity;
      let curMaxX = bounds?.maxX ?? -Infinity;
      let curMinY = bounds?.minY ?? Infinity;
      let curMaxY = bounds?.maxY ?? -Infinity;

      locations.forEach((loc) => {
        if (loc.x < curMinX) curMinX = loc.x;
        if (loc.x > curMaxX) curMaxX = loc.x;
        if (loc.y < curMinY) curMinY = loc.y;
        if (loc.y > curMaxY) curMaxY = loc.y;
      });

      if (curMaxX > curMinX && curMaxY > curMinY) {
        setBounds({ minX: curMinX, maxX: curMaxX, minY: curMinY, maxY: curMaxY });
      }

      // Group latest point per driver
      const latestLocByDriver: Record<number, OpenF1Location> = {};
      locations.forEach((loc) => {
        latestLocByDriver[loc.driver_number] = loc;
      });

      // Update drivers state with target positions
      setDriversState((prevState) => {
        const next: Record<number, DriverRenderState> = { ...prevState };

        Object.entries(latestLocByDriver).forEach(([dNumStr, loc]) => {
          const dNum = Number(dNumStr);
          const driverInfo = driversMap[dNum] || {
            driver_number: dNum,
            name_acronym: `#${dNum}`,
            broadcast_name: `Driver ${dNum}`,
            full_name: `Driver ${dNum}`,
            team_name: 'F1',
            team_colour: 'E10600',
          };

          const car = carMap[dNum];
          const pos = posMap[dNum] || 20;

          const prevDriver = prevState[dNum];
          next[dNum] = {
            driver: driverInfo,
            currentX: prevDriver ? prevDriver.currentX : loc.x,
            currentY: prevDriver ? prevDriver.currentY : loc.y,
            targetX: loc.x,
            targetY: loc.y,
            speed: car?.speed || prevDriver?.speed || 240,
            gear: car?.gear || prevDriver?.gear || 7,
            drs: car ? car.drs >= 10 : prevDriver?.drs || false,
            position: pos,
            gapSec: (pos - 1) * 1.4,
          };
        });

        return next;
      });
    } catch {
      // Graceful error recovery
    }
  }, [
    activeSessionKey,
    bounds,
    currentTimeOffsetSec,
    driversMap,
    mode,
    selectedRace.sampleStartTime,
  ]);

  // Polling loop (every 2 seconds) + scrubber advance
  useEffect(() => {
    if (!isPlaying) return;

    // Initial snapshot fetch
    fetchTelemetrySnapshot();

    const interval = setInterval(() => {
      fetchTelemetrySnapshot();
      if (mode === 'replay') {
        setCurrentTimeOffsetSec((prev) => Math.min(maxRaceDurationSec, prev + 2 * playbackSpeed));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchTelemetrySnapshot, isPlaying, mode, playbackSpeed]);

  // Smooth 60 FPS Position Interpolation (Lerp)
  useEffect(() => {
    let animId: number;

    const lerpLoop = () => {
      setDriversState((prev) => {
        let changed = false;
        const updated: Record<number, DriverRenderState> = {};

        Object.entries(prev).forEach(([key, d]) => {
          const num = Number(key);
          const dx = d.targetX - d.currentX;
          const dy = d.targetY - d.currentY;

          // Interpolation factor 0.12 provides silky smooth glide
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            changed = true;
            updated[num] = {
              ...d,
              currentX: d.currentX + dx * 0.12,
              currentY: d.currentY + dy * 0.12,
            };
          } else {
            updated[num] = d;
          }
        });

        return changed ? updated : prev;
      });

      animId = requestAnimationFrame(lerpLoop);
    };

    animId = requestAnimationFrame(lerpLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Map Metric (x, y) to SVG Canvas Coordinates (Width: 600, Height: 420)
  const svgViewBoxWidth = 600;
  const svgViewBoxHeight = 420;
  const padding = 45;

  const projectCoords = useCallback(
    (x: number, y: number) => {
      if (!bounds) return { x: svgViewBoxWidth / 2, y: svgViewBoxHeight / 2 };

      const spanX = Math.max(10, bounds.maxX - bounds.minX);
      const spanY = Math.max(10, bounds.maxY - bounds.minY);

      // Preserve aspect ratio
      const maxSpan = Math.max(spanX, spanY);
      const normX = (x - bounds.minX) / maxSpan;
      const normY = (y - bounds.minY) / maxSpan;

      const drawW = svgViewBoxWidth - padding * 2;
      const drawH = svgViewBoxHeight - padding * 2;

      // Invert Y for SVG
      const projX = padding + normX * drawW + (drawW - (spanX / maxSpan) * drawW) / 2;
      const projY =
        svgViewBoxHeight - (padding + normY * drawH + (drawH - (spanY / maxSpan) * drawH) / 2);

      return { x: projX, y: projY };
    },
    [bounds],
  );

  // Sorted Leaderboard
  const sortedDrivers = useMemo(() => {
    return Object.values(driversState).sort((a, b) => a.position - b.position);
  }, [driversState]);

  const focusedDriver = useMemo(() => {
    if (!focusedDriverNumber) return sortedDrivers[0] || null;
    return driversState[focusedDriverNumber] || sortedDrivers[0] || null;
  }, [driversState, focusedDriverNumber, sortedDrivers]);

  // Handle Race Switch
  const handleSelectReplayRace = (race: CuratedReplayRace) => {
    setSelectedRace(race);
    setActiveSessionKey(race.sessionKey);
    setSessionTitle(race.name);
    setCurrentTimeOffsetSec(0);
    setBounds(null);
    setDriversState({});
    setTelemetryError(null);
  };

  // Format Replay Time
  const formatTimeOffset = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative rounded-2xl bg-studio-950 border border-studio-800/80 overflow-hidden flex flex-col shadow-2xl">
      {/* ── Top Header Bar (Live Badge, Session Switcher, Flags) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-studio-900/90 border-b border-studio-850">
        <div className="flex items-center gap-2.5">
          {mode === 'live' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-f1red/20 text-f1red border border-f1red/40 shadow-[0_0_12px_rgba(255,24,1,0.4)]">
              <span className="w-2 h-2 rounded-full bg-f1red animate-ping" />
              <span>LIVE TRACKER</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Radio className="w-3 h-3 text-amber-400" />
              <span>REPLAY TELEMETRY</span>
            </span>
          )}

          <div className="flex flex-col">
            <span className="text-xs font-black text-white font-display flex items-center gap-1">
              {sessionTitle}
            </span>
            <span className="text-[10px] font-mono text-studio-400">
              {selectedRace.circuitName}
            </span>
          </div>
        </div>

        {/* Right side controls: Flag banner & Mode Selector */}
        <div className="flex items-center gap-2">
          {/* Race Control Banner */}
          {latestFlag && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                latestFlag.flag === 'YELLOW'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : latestFlag.flag === 'RED'
                    ? 'bg-f1red/20 text-red-400 border-f1red/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Flag className="w-3 h-3" />
              <span>{latestFlag.flag || 'TRACK STATUS'}</span>
            </div>
          )}

          {/* Curated Race Dropdown */}
          <select
            value={selectedRace.id}
            onChange={(e) => {
              const found = CURATED_REPLAY_RACES.find((r) => r.id === e.target.value);
              if (found) handleSelectReplayRace(found);
            }}
            className="bg-studio-850 hover:bg-studio-800 text-studio-200 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border border-studio-700/80 cursor-pointer focus:outline-none"
          >
            {CURATED_REPLAY_RACES.map((race) => (
              <option key={race.id} value={race.id}>
                {race.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Telemetry transport error banner (from service error code) ── */}
      {telemetryError && (
        <div
          role="alert"
          className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-2"
        >
          <Radio className="w-3.5 h-3.5 shrink-0" />
          <span>
            {telemetryError === 'upstream-rate-limited'
              ? isVi
                ? 'OpenF1 đang giới hạn tần suất (429) — tự thử lại sau ít phút.'
                : 'OpenF1 rate limit (429) — retrying automatically.'
              : telemetryError === 'timeout'
                ? isVi
                  ? 'Hết thời gian chờ telemetry — đang thử lại.'
                  : 'Telemetry request timed out — retrying.'
                : isVi
                  ? 'Không tải được telemetry lúc này — đang giữ dữ liệu cũ.'
                  : 'Telemetry unavailable — showing last known data.'}
          </span>
        </div>
      )}

      {/* ── Main Map & Leaderboard Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 relative bg-studio-950">
        {/* SVG Track Map Area (8 cols) */}
        <div className="md:col-span-8 relative p-2 sm:p-4 flex items-center justify-center min-h-[300px] sm:min-h-[360px] bg-radial from-studio-900/60 to-studio-950">
          {/* Radar background grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            viewBox={`0 0 ${svgViewBoxWidth} ${svgViewBoxHeight}`}
            className="w-full h-full max-h-[380px] filter drop-shadow-[0_0_16px_rgba(0,0,0,0.8)]"
          >
            {/* Draw calibrated circuit trajectory connecting cars */}
            {sortedDrivers.length >= 2 && (
              <path
                d={sortedDrivers.reduce((acc, d, i) => {
                  const p = projectCoords(d.currentX, d.currentY);
                  return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, '')}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-20"
              />
            )}

            {/* Drivers Live Dots */}
            {Object.values(driversState).map((d) => {
              const { x, y } = projectCoords(d.currentX, d.currentY);
              const isSelected = focusedDriver?.driver.driver_number === d.driver.driver_number;
              const teamColor = d.driver.team_colour ? `#${d.driver.team_colour}` : '#ffffff';

              return (
                <g
                  key={d.driver.driver_number}
                  className="cursor-pointer transition-transform duration-75"
                  onClick={() => setFocusedDriverNumber(d.driver.driver_number)}
                >
                  {/* Outer pulse when selected */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="16"
                      fill={teamColor}
                      className="opacity-30 animate-ping"
                    />
                  )}

                  {/* Car Dot with Team Color */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? '9' : '7'}
                    fill={teamColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="shadow-lg filter drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]"
                  />

                  {/* Driver Acronym Tag (NOR, VER, LEC) */}
                  <text
                    x={x + 11}
                    y={y + 3.5}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="800"
                    fontFamily="monospace"
                    className="select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,1)]"
                  >
                    {d.driver.name_acronym}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Driver Telemetry Card in bottom left */}
          {focusedDriver && (
            <div className="absolute bottom-3 left-3 bg-studio-950/95 border border-studio-800 backdrop-blur-md rounded-xl p-3 shadow-2xl flex items-center gap-3 z-10">
              <div
                className="w-1.5 h-10 rounded-full"
                style={{
                  backgroundColor: focusedDriver.driver.team_colour
                    ? `#${focusedDriver.driver.team_colour}`
                    : '#e10600',
                }}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black font-mono text-white">
                    P{focusedDriver.position} {focusedDriver.driver.name_acronym}
                  </span>
                  <span className="text-[10px] text-studio-400">
                    #{focusedDriver.driver.driver_number}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-base font-black font-mono text-white">
                    {focusedDriver.speed}{' '}
                    <span className="text-[10px] font-normal text-studio-400">km/h</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    G{focusedDriver.gear}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold ${
                      focusedDriver.drs
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-studio-800 text-studio-500'
                    }`}
                  >
                    DRS {focusedDriver.drs ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Leaderboard Sidebar (4 cols) */}
        <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-studio-850 bg-studio-950/90 p-3 flex flex-col max-h-[360px] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-studio-850">
            <span className="text-[10px] font-mono font-bold text-studio-400 uppercase tracking-wider">
              {isVi ? 'Bảng Thứ Hạng' : 'Live Positions'}
            </span>
            <span className="text-[10px] font-mono text-studio-500">
              {sortedDrivers.length} CARS
            </span>
          </div>

          <div className="space-y-1 overflow-y-auto pr-1">
            {sortedDrivers.map((d) => {
              const isSelected = focusedDriver?.driver.driver_number === d.driver.driver_number;
              const teamColor = d.driver.team_colour ? `#${d.driver.team_colour}` : '#ffffff';

              return (
                <div
                  key={d.driver.driver_number}
                  onClick={() => setFocusedDriverNumber(d.driver.driver_number)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-studio-800/90 text-white font-bold'
                      : 'hover:bg-studio-900 text-studio-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-studio-400 w-4">{d.position}</span>
                    <span
                      className="w-1.5 h-3.5 rounded-full"
                      style={{ backgroundColor: teamColor }}
                    />
                    <span className="text-[11px] font-bold text-white">
                      {d.driver.name_acronym}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-studio-400">
                      {d.position === 1 ? 'LEADER' : `+${d.gapSec.toFixed(1)}s`}
                    </span>
                    <span className="text-[10px] font-bold text-studio-300">{d.speed} km/h</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Replay Scrubber & Playback Controls ── */}
      <div className="p-3 bg-studio-900/95 border-t border-studio-850 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Play/Pause & Speed */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-f1red hover:bg-f1red/90 text-white transition-all cursor-pointer shadow-md"
            title={isPlaying ? 'Tạm dừng' : 'Tiếp tục'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTimeOffsetSec(0)}
            className="p-2 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-300 transition-colors cursor-pointer"
            title="Reset về đầu race"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center rounded-lg bg-studio-850 p-0.5 border border-studio-800">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  playbackSpeed === spd ? 'bg-f1red text-white' : 'text-studio-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <span className="text-xs font-mono font-bold text-studio-300 ml-1">
            {formatTimeOffset(currentTimeOffsetSec)}
          </span>
        </div>

        {/* Timeline Range Scrubber */}
        <div className="w-full sm:w-1/2 flex items-center gap-2">
          <span className="text-[10px] font-mono text-studio-500">00:00</span>
          <input
            type="range"
            min={0}
            max={maxRaceDurationSec}
            step={2}
            value={currentTimeOffsetSec}
            onChange={(e) => setCurrentTimeOffsetSec(Number(e.target.value))}
            className="w-full accent-f1red cursor-pointer h-1.5 bg-studio-800 rounded-lg"
          />
          <span className="text-[10px] font-mono text-studio-500">90:00</span>
        </div>

        {/* Attribution Credit */}
        <div className="flex items-center gap-1 text-[10px] font-mono text-studio-500 hover:text-studio-400">
          <span>Data by</span>
          <a
            href="https://openf1.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-f1red font-bold hover:underline flex items-center gap-0.5"
          >
            OpenF1.org
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
