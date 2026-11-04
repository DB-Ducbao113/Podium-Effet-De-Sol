import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import type { GrandPrixRound, SeasonYear } from '../../types';
import { JOURNEY_WORLD_LAND_PATH } from './journeyWorldAtlas';
import { resolveCircuit } from './journeyCoordinates';

const WIDTH = 1000;
const HEIGHT = 500;
const LABEL_WIDTH = 34;
const LABEL_HEIGHT = 19;

type MapPoint = { race: GrandPrixRound; x: number; y: number };
type LabelledPoint = MapPoint & { labelX: number; labelY: number };

const project = (latitude: number, longitude: number) => ({
  x: ((longitude + 180) / 360) * WIDTH,
  y: ((90 - latitude) / 180) * HEIGHT,
});

/**
 * The world overview always shows every round. Numbered labels use deterministic,
 * collision-aware placement so dense European stops don't print on top of each other.
 * This is a label layout, NOT a race-route or a connection between Grand Prix.
 */
export function layoutRoundLabels(points: readonly MapPoint[]): LabelledPoint[] {
  const placed: { x: number; y: number }[] = [];
  const candidates = [
    [0, -19], [20, -14], [-20, -14], [20, 13], [-20, 13], [0, 21],
    [37, 0], [-37, 0], [37, -22], [-37, -22], [37, 22], [-37, 22],
  ];
  return points.map((point) => {
    let location: { x: number; y: number } | null = null;
    const choices = [...candidates];
    for (const distance of [48, 65, 82, 100, 118, 138]) {
      for (let i = 0; i < 16; i++) {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / 16;
        choices.push([Math.cos(angle) * distance, Math.sin(angle) * distance]);
      }
    }
    for (const [dx, dy] of choices) {
      const x = Math.min(WIDTH - LABEL_WIDTH / 2 - 6, Math.max(LABEL_WIDTH / 2 + 6, point.x + dx));
      const y = Math.min(HEIGHT - LABEL_HEIGHT / 2 - 6, Math.max(LABEL_HEIGHT / 2 + 6, point.y + dy));
      if (placed.every((other) =>
        Math.abs(other.x - x) > LABEL_WIDTH + 3 ||
        Math.abs(other.y - y) > LABEL_HEIGHT + 3
      )) {
        location = { x, y };
        break;
      }
    }
    if (!location) {
      // Retain an addressable label even if every candidate is occupied.
      location = { x: point.x, y: point.y };
    }
    placed.push(location);
    return { ...point, labelX: location.x, labelY: location.y };
  });
}

export function JourneyWorldMap({
  season,
  calendar,
  activeRound,
  onSelectRound,
  lang,
}: {
  season: SeasonYear;
  calendar: readonly GrandPrixRound[];
  activeRound: number;
  /** Optional: synchronize the 3D/2D round navigation without opening details. */
  onSelectRound?: (round: number) => void;
  lang: 'vi' | 'en';
}) {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const points = useMemo(() => {
    const coordinates = calendar.flatMap((race): MapPoint[] => {
      const geo = resolveCircuit(race);
      return geo ? [{ race, ...project(geo.latitude, geo.longitude) }] : [];
    });
    return layoutRoundLabels(coordinates);
  }, [calendar]);
  const selected = points.find((point) => point.race.round === selectedRound);
  const missing = calendar.length - points.length;

  const select = (round: number) => {
    setSelectedRound((old) => old === round ? null : round);
  };

  return (
    <div className="rcj-world-map" data-map-mode="all-rounds" data-route-lines="false"
      aria-label={lang === 'vi' ? `Bản đồ 2D các chặng F1 ${season}` : `2D map of all ${season} F1 rounds`}>
      <div className="rcj-map-viewport" tabIndex={0}
        aria-label={lang === 'vi' ? 'Kéo ngang để xem đầy đủ bản đồ trên màn hình nhỏ' : 'Scroll horizontally to explore the whole map on small screens'}>
        <svg className="rcj-map-svg rcj-map-atlas" viewBox="0 0 1000 500" role="group"
          aria-label={lang === 'vi' ? `Toàn bộ ${points.length} địa điểm chặng đua` : `All ${points.length} race locations`}>
          <defs>
            <pattern id="rcj-map-grid" width="83.333" height="55.556" patternUnits="userSpaceOnUse">
              <path d="M83.333 0H0V55.556" fill="none" stroke="#a3b5c5" strokeOpacity=".1" strokeWidth=".8" />
            </pattern>
          </defs>
          <rect width="1000" height="500" fill="url(#rcj-map-grid)" />
          <path d={JOURNEY_WORLD_LAND_PATH} fill="#1c303e" stroke="#527181"
            strokeOpacity=".64" strokeWidth=".7" fillRule="evenodd" />
          {points.map((point) => {
            const active = point.race.round === activeRound;
            const selectedPin = point.race.round === selectedRound;
            const label = `R${String(point.race.round).padStart(2, '0')}`;
            return (
              <g key={point.race.round} data-map-round={point.race.round}
                data-active={active} data-selected={selectedPin}>
                <circle cx={point.x} cy={point.y} r={active || selectedPin ? 6.2 : 3.4}
                  fill={active || selectedPin ? '#ff6436' : '#d1dfe3'}
                  stroke="#06131d" strokeWidth="1.7" />
                {active && <circle cx={point.x} cy={point.y} r="12.8"
                  fill="none" stroke="#ff6436" strokeOpacity=".64" strokeWidth="1.2" />}
                <g role="button" tabIndex={0} className="rcj-map-number"
                  data-round-label={label} data-selected={selectedPin}
                  data-active={active}
                  aria-label={`${label}: ${point.race.name}. ${lang === 'vi' ? 'Xem thông tin chặng' : 'Select for race details'}`}
                  aria-pressed={selectedPin}
                  onClick={() => select(point.race.round)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      select(point.race.round);
                    }
                  }}>
                  <title>{label} · {point.race.name}</title>
                  <rect x={point.labelX - LABEL_WIDTH / 2} y={point.labelY - LABEL_HEIGHT / 2}
                    width={LABEL_WIDTH} height={LABEL_HEIGHT} rx="4" />
                  <text x={point.labelX} y={point.labelY} textAnchor="middle"
                    dominantBaseline="central">{label}</text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="rcj-map-key" aria-hidden="true">
        <span><i /> {lang === 'vi' ? 'Chặng đang xem' : 'Current round'}</span>
        <span>{points.length} {lang === 'vi' ? 'điểm đua' : 'locations'}</span>
      </div>
      {selected && <aside className="rcj-map-selection" role="region"
        aria-label={lang === 'vi' ? 'Thông tin chặng được chọn' : 'Selected Grand Prix'}>
        <button type="button" className="rcj-map-dismiss"
          aria-label={lang === 'vi' ? 'Đóng thông tin chặng' : 'Close race details'}
          onClick={() => setSelectedRound(null)}><X size={16} aria-hidden="true" /></button>
        <span className="rcj-map-selection-round">R{String(selected.race.round).padStart(2, '0')} / {season}</span>
        <strong>{selected.race.flag} {selected.race.name}</strong>
        <small>{selected.race.circuit} · {selected.race.location}</small>
        <div className="rcj-map-selection-actions">
          <Link to={`/season/${season}?tab=calendar&round=${selected.race.round}`}
            data-map-view-details>
            {lang === 'vi' ? 'Lịch & chi tiết' : 'View weekend'} <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button type="button" onClick={() => {
            onSelectRound?.(selected.race.round);
            setSelectedRound(null);
          }}>{lang === 'vi' ? 'Theo hành trình' : 'Follow round'}</button>
        </div>
      </aside>}
      {missing > 0 && <p className="rcj-map-incomplete" role="status">
        {lang === 'vi'
          ? `${missing} chặng chưa có tọa độ bản đồ.`
          : `${missing} rounds are missing map coordinates.`}
      </p>}
    </div>
  );
}
