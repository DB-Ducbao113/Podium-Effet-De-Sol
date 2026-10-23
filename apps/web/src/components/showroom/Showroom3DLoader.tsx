import React from 'react';
import { Html, useProgress } from '@react-three/drei';
import { Gauge, Cpu, Radio } from 'lucide-react';

export const Showroom3DLoader: React.FC = () => {
  const { progress } = useProgress();
  const roundedProgress = Math.round(progress);

  return (
    <Html center zIndexRange={[1000, 0]}>
      <div className="w-[320px] sm:w-[380px] p-6 rounded-2xl bg-studio-950/95 backdrop-blur-xl border border-studio-700/80 shadow-2xl text-white select-none space-y-4">
        {/* Header telemetry badge */}
        <div className="flex items-center justify-between border-b border-studio-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-f1red animate-ping" />
            <span className="font-mono text-[11px] font-black uppercase tracking-widest text-f1red flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-f1red" />
              PIT WALL TELEMETRY
            </span>
          </div>
          <span className="font-mono text-xs font-black text-emerald-400">
            {roundedProgress}% LOADED
          </span>
        </div>

        {/* Central message */}
        <div className="space-y-1">
          <h3 className="font-display text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-studio-400" />
            Đang nạp mô hình 3D F1 C42
          </h3>
          <p className="text-[11px] text-studio-400 font-medium">
            Khởi tạo khí động học mặt đất, buồng lái Halo & thông số 11 đội đua...
          </p>
        </div>

        {/* LED Rev-meter progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-studio-500 font-bold uppercase">
            <span>Aero Scan</span>
            <span>18.3 MB Model</span>
          </div>
          {/* LED Blocks Bar */}
          <div className="h-3 w-full bg-studio-900 rounded-md overflow-hidden p-0.5 border border-studio-800 flex gap-0.5">
            {Array.from({ length: 24 }).map((_, idx) => {
              const active = idx / 24 <= progress / 100;
              const color =
                idx < 12
                  ? 'bg-emerald-500 shadow-emerald-500/50'
                  : idx < 18
                    ? 'bg-amber-400 shadow-amber-400/50'
                    : 'bg-f1red shadow-f1red/50';

              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-[1px] transition-all duration-150 ${
                    active ? color : 'bg-studio-800/40'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Footer status text */}
        <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-studio-500">
          <span className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-studio-400" />
            FIA 2026 Ground Effect
          </span>
          <span className="text-studio-400">Pirelli P-Zero 18"</span>
        </div>
      </div>
    </Html>
  );
};
