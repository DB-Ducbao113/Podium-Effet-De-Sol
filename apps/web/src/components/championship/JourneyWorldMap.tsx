import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import type { GrandPrixRound, SeasonYear } from '../../types';
import { JOURNEY_WORLD_LAND_PATH } from './journeyWorldAtlas';
import { resolveCircuit } from './journeyCoordinates';
import { layoutRoundLabels, type MapPoint } from './journeyLabelLayout';

const WIDTH = 1000;
const HEIGHT = 500;
const LABEL_WIDTH = 34;
const LABEL_HEIGHT = 19;

const project = (latitude: number, longitude: number) => ({
  x: ((longitude + 180) / 360) * WIDTH,
  y: ((90 - latitude) / 180) * HEIGHT,
});

export function JourneyWorldMap({
  season,
  calendar,
  activeRound,
  onSelectRound,
  lang,
  tab = 'calendar',
  markerOpacity = 1,
}: {
  season: SeasonYear;
  calendar: readonly GrandPrixRound[];
  activeRound: number;
  /** Optional: synchronize the 3D/2D round navigation without opening details. */
  onSelectRound?: (round: number) => void;
  lang: 'vi' | 'en';
  tab?: 'results' | 'calendar';
  markerOpacity?: number;
}) {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const points = useMemo(() => {
    const coordinates = calendar.flatMap((race): MapPoint[] => {
      const geo = resolveCircuit(race);
      return geo ? [{ race, ...project(geo.latitude, geo.longitude) }] : [];
    });
    return layoutRoundLabels(coordinates);
  }, [calendar]);
  const selected = points.find((point) => point.race.round === selectedRound);
  const missing = calendar.length - points.length;
  const markersInteractive = markerOpacity > 0.5;

  useEffect(() => {
    if (!markersInteractive) setSelectedRound(null);
  }, [markersInteractive]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const atlas = viewport?.querySelector<SVGSVGElement>('.rcj-map-atlas');
    const point = points.find((entry) => entry.race.round === activeRound);
    if (!viewport || !atlas || !point || viewport.scrollWidth <= viewport.clientWidth) return;
    const viewportBox = viewport.getBoundingClientRect();
    const atlasBox = atlas.getBoundingClientRect();
    viewport.scrollLeft += atlasBox.left - viewportBox.left + point.x / WIDTH * atlasBox.width - viewportBox.width / 2;
  }, [activeRound, points]);

  const select = (round: number) => {
    setSelectedRound((old) => old === round ? null : round);
  };

  return (
    <div className="rcj-world-map" data-map-mode="all-rounds" data-route-lines="false"
      aria-label={lang === 'vi' ? `Bản đồ 2D các chặng F1 ${season}` : `2D map of all ${season} F1 rounds`}>
      <div className="rcj-map-viewport" ref={viewportRef} tabIndex={0}
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
          <g className="rcj-map-markers" opacity={markerOpacity} aria-hidden={!markersInteractive}
            style={{ pointerEvents: markersInteractive ? 'auto' : 'none' }}>
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
                <g role="button" tabIndex={markersInteractive ? 0 : -1} className="rcj-map-number"
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
          </g>
        </svg>
      </div>
      <div className="rcj-map-key" aria-hidden="true" style={{ opacity: markerOpacity }}>
        <span><span className="rcj-map-key-dot" /> {lang === 'vi' ? 'Chặng đang xem' : 'Current round'}</span>
        <span>{points.length} {lang === 'vi' ? 'điểm đua' : 'locations'}</span>
      </div>
      {selected && markersInteractive && <aside className="rcj-map-selection" role="region"
        aria-label={lang === 'vi' ? 'Thông tin chặng được chọn' : 'Selected Grand Prix'}>
        <button type="button" className="rcj-map-dismiss"
          aria-label={lang === 'vi' ? 'Đóng thông tin chặng' : 'Close race details'}
          onClick={() => setSelectedRound(null)}><X size={16} aria-hidden="true" /></button>
        <span className="rcj-map-selection-round">R{String(selected.race.round).padStart(2, '0')} / {season}</span>
        <strong>{selected.race.flag} {selected.race.name}</strong>
        <small>{selected.race.circuit} · {selected.race.location}</small>
        <div className="rcj-map-selection-actions">
          <Link to={`/season/${season}?tab=${tab}&round=${selected.race.round}`}
            data-map-view-details>
            {tab === 'results' ? (lang === 'vi' ? 'Xem kết quả' : 'View results') : (lang === 'vi' ? 'Lịch & chi tiết' : 'View weekend')} <ArrowUpRight size={15} aria-hidden="true" />
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
