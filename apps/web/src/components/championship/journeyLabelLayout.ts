import type { GrandPrixRound } from '../../types';

const WIDTH = 1000;
const HEIGHT = 500;
const LABEL_WIDTH = 34;
const LABEL_HEIGHT = 19;

export type MapPoint = { race: GrandPrixRound; x: number; y: number };
type LabelledPoint = MapPoint & { labelX: number; labelY: number };

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

