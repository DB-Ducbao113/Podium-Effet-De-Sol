import { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Focus, Globe2 } from 'lucide-react';
import type { GrandPrixRound, SeasonYear } from '../../types';
import { JOURNEY_WORLD_LAND_PATH } from './journeyWorldAtlas';
import { resolveCircuit, type Geo } from './journeyCoordinates';

const project = ({ longitude, latitude }: Geo) => ({
  x: (longitude + 180) / 360 * WIDTH,
  y: (90 - latitude) / 180 * HEIGHT,
});
const rad = (degrees: number) => degrees * Math.PI / 180;
const deg = (radians: number) => radians * 180 / Math.PI;

/** Draw a great-circle arc, split cleanly at the antimeridian instead of drawing across the entire map. */
function greatCirclePath(a: Waypoint, b: Waypoint) {
  const unit = (lng: number, lat: number) => {
    const phi = rad(lat), lambda = rad(lng);
    return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
  };
  const va = unit(a.longitude, a.latitude);
  const vb = unit(b.longitude, b.latitude);
  const omega = Math.acos(Math.max(-1, Math.min(1, va.reduce((acc, x, i) => acc + x * vb[i], 0))));
  const sinOmega = Math.sin(omega);
  const steps = Math.max(12, Math.ceil(deg(omega) / 3));
  const commands: string[] = [];
  let lastLongitude: number | null = null;
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const wa = omega < 1e-6 ? 1 - t : Math.sin((1 - t) * omega) / sinOmega;
    const wb = omega < 1e-6 ? t : Math.sin(t * omega) / sinOmega;
    const x = wa * va[0] + wb * vb[0];
    const y = wa * va[1] + wb * vb[1];
    const z = wa * va[2] + wb * vb[2];
    const longitude = deg(Math.atan2(y, x));
    const latitude = deg(Math.atan2(z, Math.hypot(x, y)));
    const projected = project({ longitude, latitude });
    const wrapped = lastLongitude !== null && Math.abs(longitude - lastLongitude) > 180;
    commands.push(`${step === 0 || wrapped ? 'M' : 'L'}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`);
    lastLongitude = longitude;
  }
  return commands.join(' ');
}

export function JourneyWorldMap({
  season,
  calendar,
  activeRound,
  travelProgress,
  onSelectRound,
  lang,
}: {
  season: SeasonYear;
  calendar: readonly GrandPrixRound[];
  activeRound: number;
  travelProgress: number;
  onSelectRound: (round: number) => void;
  lang: 'vi' | 'en';
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(false);
  const points = useMemo(() =>
    calendar.map((race) => {
      const location = resolveCircuit(race);
      if (!location) return null;
      return { race, ...location, ...project(location) };
    }).filter((point): point is Waypoint => point !== null),
  [calendar]);
  const segments = useMemo(() =>
    points.slice(1).map((point, i) => ({
      key: `${points[i].race.round}-${point.race.round}`,
      path: greatCirclePath(points[i], point),
    })),
  [points]);
  const active = points.find((point) => point.race.round === activeRound) ?? points[0];
  const selectedX = active ? active.x / WIDTH * 100 : 50;
  const selectedY = active ? active.y / HEIGHT * 100 : 50;

  useEffect(() => {
    // On narrow screens the SVG keeps a legible minimum width; pan the world to the current destination.
    const viewport = viewportRef.current;
    if (!viewport || !active) return;
    if (viewport.scrollWidth <= viewport.clientWidth + 1) return;
    const canvasWidth = viewport.scrollWidth;
    const nextLeft = active.x / WIDTH * canvasWidth - viewport.clientWidth / 2;
    viewport.scrollTo({
      left: Math.max(0, nextLeft),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, [activeRound, active]);

  return (
    <div className="rcj-world-map" aria-label={lang === 'vi' ? 'Bản đồ hành trình Grand Prix theo năm' : 'Season Grand Prix journey world map'}>
      <div className="rcj-world-map-header">
        <div>
          <span className="rcj-world-map-kicker"><Globe2 size={15} aria-hidden="true" /> THE GRAND PRIX WORLD TOUR</span>
          <strong>{season} / {lang === 'vi' ? 'HÀNH TRÌNH TOÀN CẦU' : 'GLOBAL ROUTE'}</strong>
        </div>
        <button className="rcj-map-focus" type="button" aria-pressed={focus} onClick={() => setFocus((value) => !value)}>
          {focus ? <Globe2 size={15} aria-hidden="true" /> : <Focus size={15} aria-hidden="true" />}
          {focus ? (lang === 'vi' ? 'Toàn bản đồ' : 'World view') : (lang === 'vi' ? 'Theo chặng' : 'Focus stop')}
        </button>
      </div>
      <div className="rcj-map-viewport" ref={viewportRef} tabIndex={0} aria-label={lang === 'vi' ? 'Bản đồ có thể kéo ngang trên màn hình nhỏ' : 'Horizontally scrollable map on small screens'}>
        <div className="rcj-map-canvas">
          <div className="rcj-map-plane" style={{
            transformOrigin: `${selectedX}% ${selectedY}%`,
            transform: focus ? 'scale(1.35)' : 'scale(1)',
          }}>
            <svg className="rcj-map-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <pattern id="rcj-graticule" width="83.333" height="55.556" patternUnits="userSpaceOnUse">
                  <path d="M83.333 0H0V55.556" fill="none" stroke="#a5b2c5" strokeOpacity=".13" strokeWidth=".7" />
                </pattern>
                <filter id="rcj-route-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>
              <rect width="1000" height="500" fill="url(#rcj-graticule)" />
              <path d={JOURNEY_WORLD_LAND_PATH} fill="#25313c" stroke="#536474" strokeOpacity=".68" strokeWidth=".65" fillRule="evenodd" />
              {segments.map((segment) => (
                <path key={`future-${segment.key}`} d={segment.path} stroke="#748694" strokeOpacity=".33" strokeDasharray="3 7" strokeWidth="1.35" fill="none" />
              ))}
              {segments.map((segment, i) => {
                const portion = Math.max(0, Math.min(1, travelProgress - i));
                return <g key={segment.key}>
                  <path d={segment.path} stroke="#ff4a18" strokeOpacity={portion > 0 ? '.55' : '0'} strokeWidth="8" filter="url(#rcj-route-glow)" fill="none" pathLength={1} strokeDasharray={`${portion} 1`} />
                  <path d={segment.path} stroke="#ff6538" strokeOpacity={portion > 0 ? '1' : '0'} strokeWidth="2.9" fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${portion} 1`} />
                </g>;
              })}
              {points.map((point, index) => {
                const visited = travelProgress >= index - 0.035;
                const current = point.race.round === activeRound;
                return (
                  <g key={point.race.round} opacity={visited || current ? 1 : 0.25}>
                    {current && <circle cx={point.x} cy={point.y} r="15" fill="none" stroke="#ff4a18" strokeOpacity=".6" strokeWidth="1.5" className="rcj-map-pulse" />}
                    <circle cx={point.x} cy={point.y} r={current ? 6.7 : 3.8} fill={visited || current ? '#ff4a18' : '#8b9aa8'} stroke="#0a0c10" strokeWidth="2" />
                  </g>
                );
              })}
            </svg>
            {points.map((point, index) => {
              const selected = point.race.round === activeRound;
              return (
                <button
                  key={point.race.round}
                  type="button"
                  className="rcj-map-pin"
                  data-selected={selected}
                  data-revealed={travelProgress >= index - 0.035}
                  style={{ left: `${point.x / WIDTH * 100}%`, top: `${point.y / HEIGHT * 100}%` }}
                  title={`R${String(point.race.round).padStart(2, '0')} · ${point.race.name}`}
                  aria-label={`R${String(point.race.round).padStart(2, '0')} · ${point.race.name}`}
                  aria-current={selected ? 'step' : undefined}
                  onClick={() => onSelectRound(point.race.round)}
                >
                  {selected && <span aria-hidden="true">R{String(point.race.round).padStart(2, '0')}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="rcj-map-bottom">
        <div className="rcj-map-active">
          <span><Compass size={16} aria-hidden="true" /> {lang === 'vi' ? 'ĐANG KHÁM PHÁ' : 'NOW EXPLORING'} · R{String(activeRound).padStart(2, '0')}</span>
          <strong>{active?.race.flag} {active?.race.name}</strong>
          <small>{active?.race.circuit} · {active?.race.location}</small>
        </div>
        <div className="rcj-map-legend">
          <span><i className="rcj-map-legend-done" /> {lang === 'vi' ? 'Đã khám phá' : 'Travelled'}</span>
          <span><i className="rcj-map-legend-next" /> {lang === 'vi' ? 'Phía trước' : 'Ahead'}</span>
        </div>
      </div>
      {points.length !== calendar.length && <p className="rcj-map-incomplete" role="status">
        {lang === 'vi' ? 'Có chặng chưa có tọa độ xác minh nên chưa hiển thị trên bản đồ.' : 'Some rounds are missing verified map coordinates.'}
      </p>}
    </div>
  );
}
