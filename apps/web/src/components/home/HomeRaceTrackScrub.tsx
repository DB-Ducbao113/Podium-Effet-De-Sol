import { useEffect, useRef } from 'react';
import type { GrandPrixRound } from '../../types';
import { findCircuitByName } from '../../data/championship/circuitsData';
import { getSeasonCircuit } from '../../utils/p5SeasonalVisuals';
import { smoothstep } from './journey/homeJourneyMath';
import { subscribeHomeScrub } from './journey/homeScrubRegistry';

/**
 * Draws the real next-round circuit outline as the race-control floor is
 * scrubbed. Geometry comes from the season's verified circuit data; the base
 * outline stays visible without JS, the ignition trace + leader dot are the
 * scroll-driven layer. pathLength=1 keeps the dash normalized before measuring.
 */
export function HomeRaceTrackScrub({ race }: { race?: GrandPrixRound }) {
  const circuit = race
    ? getSeasonCircuit(race.season, race.round) ?? findCircuitByName(race.circuit)
    : undefined;
  const drawRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const draw = drawRef.current;
    const dot = dotRef.current;
    if (!draw || !dot) return;
    const length = draw.getTotalLength();
    const apply = (progress: number) => {
      const t = smoothstep(.12, .92, progress);
      draw.setAttribute('stroke-dashoffset', String(1 - t));
      const point = draw.getPointAtLength(t * length);
      dot.setAttribute('cx', point.x.toFixed(2));
      dot.setAttribute('cy', point.y.toFixed(2));
    };
    return subscribeHomeScrub('race-control', apply);
  }, [circuit]);

  if (!circuit) return null;

  return (
    <svg
      className="home-rc__track"
      viewBox={circuit.viewBox}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      role="presentation"
    >
      <path
        d={circuit.svgPath}
        stroke="#75B8D4"
        strokeOpacity=".28"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        ref={drawRef}
        className="home-rc__track-draw"
        d={circuit.svgPath}
        pathLength={1}
        stroke="#FF4A18"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1"
        strokeDashoffset="1"
      />
      <circle
        ref={dotRef}
        cx={circuit.startFinish.x}
        cy={circuit.startFinish.y}
        r="6"
        fill="#F4F0E8"
        stroke="#FF4A18"
        strokeWidth="2.5"
      />
    </svg>
  );
}