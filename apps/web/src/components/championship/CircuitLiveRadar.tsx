import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CircuitData } from '../../types/circuit';
import { Play, Pause, Zap, Radio, FastForward, RotateCcw } from 'lucide-react';

import { RADAR_DRIVERS, DriverRadarItem } from './radarDrivers';
export type { DriverRadarItem };

interface CircuitLiveRadarProps {
  circuit: CircuitData;
  lang: 'vi' | 'en';
}

export const CircuitLiveRadar: React.FC<CircuitLiveRadarProps> = ({ circuit, lang }) => {
  const isVi = lang === 'vi';
  const [pathElement, setPathElement] = useState<SVGPathElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('lec');

  // Animation progress in seconds from start
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [pathTotalLength, setPathTotalLength] = useState<number>(0);

  // Reference lap duration based on circuit length (scaled to ~35s for engaging demo)
  const baseLapDurationSec = useMemo(() => {
    const km = circuit.telemetry.circuitLengthKm || 5.0;
    return Math.max(26, Math.min(48, km * 6.5));
  }, [circuit.telemetry.circuitLengthKm]);

  // Measure SVG path total length on mount / change
  useEffect(() => {
    if (!pathElement) return;
    try {
      const len = pathElement.getTotalLength();
      if (len > 0) setPathTotalLength(len);
    } catch {
      // Fallback for mock environments
      setPathTotalLength(1200);
    }
  }, [circuit.svgPath, pathElement]);

  // Animation frame loop
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setElapsedTime((prev) => prev + dt * playbackSpeed);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed]);

  // Calculate position and local physics for each driver
  const driversData = useMemo(() => {
    if (!pathElement || pathTotalLength <= 0) {
      return RADAR_DRIVERS.map((d) => ({
        ...d,
        x: circuit.startFinish.x,
        y: circuit.startFinish.y,
        angle: 0,
        speedKmh: 280,
        gear: 6,
        isDrs: false,
        sector: 1,
        gapSec: d.baseOffsetSec,
      }));
    }

    return RADAR_DRIVERS.map((d) => {
      // Offset driver progress along lap
      const effectiveTime = elapsedTime - d.baseOffsetSec;
      const progressFraction =
        ((effectiveTime % baseLapDurationSec) + baseLapDurationSec) % baseLapDurationSec;
      const normalizedFraction = progressFraction / baseLapDurationSec;

      const dist = normalizedFraction * pathTotalLength;
      const pt = pathElement.getPointAtLength(dist);

      // Sample look-ahead point to compute heading and curvature
      const lookAheadDist = (dist + 8) % pathTotalLength;
      const ptAhead = pathElement.getPointAtLength(lookAheadDist);

      // Curvature approximation: ratio of straight chord to path distance
      const chord = Math.hypot(ptAhead.x - pt.x, ptAhead.y - pt.y);
      const curvature = Math.max(0, Math.min(1, (8 - chord) / 4)); // 0 = straight, ~1 = hairpin

      // F1 Realistic Speed Curves:
      // Straight: 310 - 342 km/h, Corner: 85 - 130 km/h
      const maxSpeed = circuit.telemetry.topSpeedKmh || 335;
      const speedKmh = Math.round(maxSpeed - curvature * (maxSpeed - 92));

      // Gears: 8 on top speed straights, down to 2nd in sharp corners
      let gear = 8;
      if (speedKmh < 105) gear = 2;
      else if (speedKmh < 145) gear = 3;
      else if (speedKmh < 195) gear = 4;
      else if (speedKmh < 240) gear = 5;
      else if (speedKmh < 285) gear = 6;
      else if (speedKmh < 320) gear = 7;

      // DRS Active: On straights when speed > 275 km/h
      const isDrs = speedKmh > 275 && curvature < 0.25;

      // Sector calculation
      let sector = 1;
      if (normalizedFraction > 0.66) sector = 3;
      else if (normalizedFraction > 0.33) sector = 2;

      return {
        ...d,
        x: pt.x,
        y: pt.y,
        speedKmh,
        gear,
        isDrs,
        sector,
        gapSec: d.baseOffsetSec,
      };
    });
  }, [elapsedTime, pathTotalLength, baseLapDurationSec, circuit, pathElement]);

  const focusedDriver = useMemo(() => {
    return driversData.find((d) => d.id === selectedDriverId) || driversData[0];
  }, [driversData, selectedDriverId]);

  // Formatted lap timer
  const lapTimerFormatted = useMemo(() => {
    const effectiveTime = elapsedTime - focusedDriver.baseOffsetSec;
    const currentLapSec =
      ((effectiveTime % baseLapDurationSec) + baseLapDurationSec) % baseLapDurationSec;
    const minutes = Math.floor(currentLapSec / 60);
    const seconds = Math.floor(currentLapSec % 60);
    const millis = Math.floor((currentLapSec % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }, [elapsedTime, focusedDriver.baseOffsetSec, baseLapDurationSec]);

  const resetLap = useCallback(() => {
    setElapsedTime(0);
  }, []);

  return (
    <div className="relative w-full flex flex-col space-y-3">
      {/* ── Top Status & Radar Controls Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-studio-900/90 border border-studio-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-mono font-bold tracking-wide text-white uppercase flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isVi ? 'LIVE RADAR TRACKING' : 'LIVE RADAR TRACKING'}</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-800 text-studio-400 border border-studio-700/60 hidden sm:inline-block">
            60 FPS · OpenF1 Physics
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-white transition-colors cursor-pointer"
            title={isPlaying ? (isVi ? 'Tạm dừng' : 'Pause') : isVi ? 'Tiếp tục' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
            className="px-2 py-1 rounded-lg bg-studio-800 hover:bg-studio-700 text-[10px] font-mono font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
            title={isVi ? 'Tốc độ mô phỏng' : 'Playback Speed'}
          >
            <FastForward className="w-3 h-3 text-amber-400" />
            <span>{playbackSpeed}x</span>
          </button>

          <button
            type="button"
            onClick={resetLap}
            className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white transition-colors cursor-pointer"
            title={isVi ? 'Chạy lại từ đầu' : 'Restart Lap'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main Circuit SVG Track with Real-Time Animated Driver Beacons ── */}
      <div className="relative w-full max-w-[460px] mx-auto aspect-[16/11] flex items-center justify-center">
        <svg
          viewBox={circuit.viewBox}
          className="w-full h-full filter drop-shadow-[0_0_16px_rgba(255,24,1,0.55)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Track shadow / background glow */}
          <path
            d={circuit.svgPath}
            fill="none"
            stroke="#ff1801"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-25 blur-xs"
          />

          {/* Outer kerb border */}
          <path
            d={circuit.svgPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-85"
          />

          {/* Asphalt main track line */}
          <path
            ref={setPathElement}
            d={circuit.svgPath}
            fill="none"
            stroke="#161922"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Speed vector racing line */}
          <path
            d={circuit.svgPath}
            fill="none"
            stroke="#ff1801"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14 5"
            className="opacity-60"
          />

          {/* Start / Finish line marker */}
          <circle
            cx={circuit.startFinish.x}
            cy={circuit.startFinish.y}
            r="12"
            fill="#ff1801"
            className="opacity-50 animate-pulse"
          />
          <circle
            cx={circuit.startFinish.x}
            cy={circuit.startFinish.y}
            r="7"
            fill="#ffffff"
            stroke="#ff1801"
            strokeWidth="3"
          />

          {/* ── Real-Time Dynamic Driver Beacons ── */}
          {driversData.map((d) => {
            const isSelected = d.id === selectedDriverId;
            return (
              <g
                key={d.id}
                transform={`translate(${d.x}, ${d.y})`}
                className="cursor-pointer transition-transform duration-75"
                onClick={() => setSelectedDriverId(d.id)}
              >
                {/* Outer Ping Ripple for selected driver */}
                {isSelected && (
                  <circle
                    r="20"
                    fill="none"
                    stroke={d.teamColor}
                    strokeWidth="2.5"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Target Focus Reticle */}
                {isSelected && (
                  <circle
                    r="15"
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="opacity-95"
                  />
                )}

                {/* Driver Beacon Solid Circle */}
                <circle
                  r={isSelected ? 10.5 : 8.5}
                  fill={d.teamColor}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="filter drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]"
                />

                {/* Driver Initial / Racing Number */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isSelected ? '8' : '7'}
                  fontWeight="900"
                  fontFamily="'Impact', 'Arial Black', sans-serif"
                  fill={d.textColor}
                >
                  {d.number}
                </text>

                {/* Driver Name Tag Floating */}
                <g transform={`translate(${d.x > 380 ? -32 : 14}, ${d.y < 60 ? 18 : -14})`}>
                  <rect
                    x="-2"
                    y="-8"
                    width="44"
                    height="14"
                    rx="3"
                    fill="rgba(10, 12, 16, 0.88)"
                    stroke={isSelected ? '#ffd700' : 'rgba(255, 255, 255, 0.25)'}
                    strokeWidth="1"
                  />
                  <text
                    x="20"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="8"
                    fontWeight="800"
                    fontFamily="monospace"
                    fill="#ffffff"
                  >
                    {d.shortName}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Live Start / Finish Tag Floating */}
        <div className="absolute top-2 left-2 bg-studio-900/90 border border-studio-700/80 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 backdrop-blur-sm shadow-md pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-f1red animate-pulse" />
          <span>{isVi ? 'Vạch Xuất Phát / Đích' : 'Start / Finish'}</span>
        </div>
      </div>

      {/* ── Live Broadcast F1 Telemetry HUD Overlay ── */}
      <div className="rounded-xl bg-gradient-to-br from-studio-900 via-studio-950 to-black border border-studio-800 p-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-studio-800/80">
          {/* Driver Title Badge */}
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/50"
              style={{ backgroundColor: focusedDriver.teamColor }}
            />
            <div>
              <span className="text-sm font-black font-display text-white tracking-wide">
                #{focusedDriver.number} {focusedDriver.name}
              </span>
              <span className="text-[10px] font-mono text-studio-400 block -mt-0.5">
                {focusedDriver.team}
              </span>
            </div>
          </div>

          {/* Live Lap Timer & Sector */}
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 rounded bg-studio-800/80 border border-studio-700/60 font-mono text-xs">
              <span className="text-[10px] text-studio-400 block uppercase font-bold">
                {isVi ? 'Phân đoạn' : 'Sector'}
              </span>
              <span className="font-black text-amber-400">SECTOR {focusedDriver.sector}</span>
            </div>

            <div className="px-2.5 py-1 rounded bg-studio-800/80 border border-studio-700/60 font-mono text-xs">
              <span className="text-[10px] text-studio-400 block uppercase font-bold">
                {isVi ? 'Thời gian' : 'Lap Time'}
              </span>
              <span className="font-black text-emerald-400 text-sm tracking-wider">
                {lapTimerFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* ── Real-Time Digital Gauges (Speed, Gear, DRS) ── */}
        <div className="grid grid-cols-3 gap-2 pt-2.5">
          {/* Speedometer */}
          <div className="p-2 rounded-lg bg-studio-950/80 border border-studio-850 flex flex-col items-center justify-center">
            <span className="text-[9px] font-mono text-studio-400 uppercase font-bold">
              {isVi ? 'Tốc độ tức thời' : 'Live Speed'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {focusedDriver.speedKmh}
              </span>
              <span className="text-[10px] font-mono text-studio-400">km/h</span>
            </div>
            {/* Speed bar */}
            <div className="w-full bg-studio-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-f1red transition-all duration-75"
                style={{ width: `${Math.min(100, (focusedDriver.speedKmh / 350) * 100)}%` }}
              />
            </div>
          </div>

          {/* Current Gear */}
          <div className="p-2 rounded-lg bg-studio-950/80 border border-studio-850 flex flex-col items-center justify-center">
            <span className="text-[9px] font-mono text-studio-400 uppercase font-bold">
              {isVi ? 'Cấp số' : 'Gear'}
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-0.5">
              {focusedDriver.gear}
            </span>
            <span className="text-[9px] font-mono text-studio-500 mt-1">SEAMLESS SHIFT</span>
          </div>

          {/* DRS Indicator */}
          <div className="p-2 rounded-lg bg-studio-950/80 border border-studio-850 flex flex-col items-center justify-center">
            <span className="text-[9px] font-mono text-studio-400 uppercase font-bold">DRS</span>
            <div
              className={`mt-1 px-2.5 py-0.5 rounded font-black text-xs font-mono tracking-wider transition-colors flex items-center gap-1 ${
                focusedDriver.isDrs
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-studio-800/80 text-studio-500 border border-studio-700/50'
              }`}
            >
              <Zap
                className={`w-3 h-3 ${focusedDriver.isDrs ? 'text-emerald-400' : 'text-studio-600'}`}
              />
              <span>{focusedDriver.isDrs ? 'ACTIVE' : 'CLOSED'}</span>
            </div>
            <span className="text-[9px] font-mono text-studio-500 mt-1">
              {focusedDriver.isDrs
                ? isVi
                  ? 'Đang mở cánh'
                  : 'Wing Open'
                : isVi
                  ? 'Đóng cánh'
                  : 'Wing Closed'}
            </span>
          </div>
        </div>

        {/* ── Driver Quick Switch Tabs ── */}
        <div className="flex items-center gap-1.5 pt-3 mt-2 border-t border-studio-800/60 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono text-studio-400 uppercase font-bold shrink-0 mr-1">
            {isVi ? 'Theo dõi:' : 'Track:'}
          </span>
          {driversData.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDriverId(d.id)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                d.id === selectedDriverId
                  ? 'bg-white text-black shadow-md scale-105'
                  : 'bg-studio-800/80 hover:bg-studio-700 text-studio-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.teamColor }} />
              <span>{d.shortName}</span>
              <span className="text-[9px] opacity-70">
                {d.gapSec === 0 ? 'P1' : `+${d.gapSec.toFixed(1)}s`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
