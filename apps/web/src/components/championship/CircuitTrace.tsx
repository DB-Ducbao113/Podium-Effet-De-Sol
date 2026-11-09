import { useId } from 'react';
import type { CircuitData } from '../../types/circuit';

type TraceVariant = 'hero' | 'detail' | 'thumbnail';

const STROKES: Record<
  TraceVariant,
  { glow: number; kerb: number; bed: number; line: number; marker: number }
> = {
  hero: { glow: 30, kerb: 21, bed: 15, line: 6, marker: 12 },
  detail: { glow: 24, kerb: 17, bed: 12, line: 5, marker: 10 },
  thumbnail: { glow: 34, kerb: 24, bed: 15, line: 7, marker: 16 },
};

export function CircuitTrace({
  circuit,
  variant = 'detail',
  className,
}: {
  circuit: CircuitData | undefined;
  variant?: TraceVariant;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!circuit) return null;
  const stroke = STROKES[variant];
  const gradientId = `p4-trace-${uid}`;

  return (
    <svg
      className={`p4-trace p4-trace--${variant}${className ? ` ${className}` : ''}`}
      viewBox={circuit.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6a00" />
          <stop offset="55%" stopColor="#ff2a2a" />
          <stop offset="100%" stopColor="#e51b37" />
        </linearGradient>
      </defs>
      <path
        d={circuit.svgPath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeOpacity="0.28"
        strokeWidth={stroke.glow}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={circuit.svgPath}
        fill="none"
        stroke="#f4f0e8"
        strokeOpacity="0.16"
        strokeWidth={stroke.kerb}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={circuit.svgPath}
        fill="none"
        stroke="#0a0c10"
        strokeWidth={stroke.bed}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={circuit.svgPath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke.line}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        data-rc-trace-line={variant === 'thumbnail' ? undefined : ''}
        style={{ strokeDasharray: 1 }}
      />
      <circle
        cx={circuit.startFinish.x}
        cy={circuit.startFinish.y}
        r={stroke.marker}
        fill="#0a0c10"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke.marker * 0.34}
      />
      <circle
        cx={circuit.startFinish.x}
        cy={circuit.startFinish.y}
        r={stroke.marker * 0.32}
        fill="#ff6a00"
      />
    </svg>
  );
}
