import { CircuitData, DrsZoneInfo, CircuitCornerHighlight } from '../types/circuit';
import type { CircuitGeoCoords } from '../components/championship/circuitCoordinates';

export interface TurnMarkerData {
  number: number;
  lat: number;
  lng: number;
  nameVi: string;
  nameEn: string;
  speedCategory: 'slow' | 'medium' | 'high';
}

export interface DrsSegmentData {
  id: number;
  info: DrsZoneInfo;
  coordinates: [number, number][];
}

export interface CircuitGpsLayout {
  trackCoordinates: [number, number][];
  startFinishCoord: [number, number];
  turns: TurnMarkerData[];
  drsSegments: DrsSegmentData[];
}

/**
 * Parses SVG path string into sampled 2D points (x, y)
 */
export function sampleSvgPathPoints(svgPath: string, samplesPerCurve = 5): [number, number][] {
  const points: [number, number][] = [];
  // Tokenize commands and numbers
  const tokens = svgPath.match(/[a-df-z]|[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!tokens || tokens.length === 0) return points;

  let cursorX = 0;
  let cursorY = 0;
  let startX = 0;
  let startY = 0;
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[a-df-z]/i.test(token)) {
      const cmd = token;
      i++;
      if (cmd === 'M' || cmd === 'm') {
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        cursorX = cmd === 'M' ? x : cursorX + x;
        cursorY = cmd === 'm' ? y : cursorY + y;
        startX = cursorX;
        startY = cursorY;
        points.push([cursorX, cursorY]);
      } else if (cmd === 'L' || cmd === 'l') {
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        cursorX = cmd === 'L' ? x : cursorX + x;
        cursorY = cmd === 'l' ? y : cursorY + y;
        points.push([cursorX, cursorY]);
      } else if (cmd === 'Q' || cmd === 'q') {
        const cx = parseFloat(tokens[i++]);
        const cy = parseFloat(tokens[i++]);
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        const cpX = cmd === 'Q' ? cx : cursorX + cx;
        const cpY = cmd === 'Q' ? cy : cursorY + cy;
        const endX = cmd === 'Q' ? x : cursorX + x;
        const endY = cmd === 'Q' ? y : cursorY + y;

        // Quadratic Bezier interpolation
        for (let s = 1; s <= samplesPerCurve; s++) {
          const t = s / samplesPerCurve;
          const px = (1 - t) * (1 - t) * cursorX + 2 * (1 - t) * t * cpX + t * t * endX;
          const py = (1 - t) * (1 - t) * cursorY + 2 * (1 - t) * t * cpY + t * t * endY;
          points.push([px, py]);
        }
        cursorX = endX;
        cursorY = endY;
      } else if (cmd === 'C' || cmd === 'c') {
        const c1x = parseFloat(tokens[i++]);
        const c1y = parseFloat(tokens[i++]);
        const c2x = parseFloat(tokens[i++]);
        const c2y = parseFloat(tokens[i++]);
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        const endX = cmd === 'C' ? x : cursorX + x;
        const endY = cmd === 'C' ? y : cursorY + y;

        for (let s = 1; s <= samplesPerCurve; s++) {
          const t = s / samplesPerCurve;
          const px =
            (1 - t) * (1 - t) * (1 - t) * cursorX +
            3 * (1 - t) * (1 - t) * t * c1x +
            3 * (1 - t) * t * t * c2x +
            t * t * t * endX;
          const py =
            (1 - t) * (1 - t) * (1 - t) * cursorY +
            3 * (1 - t) * (1 - t) * t * c1y +
            3 * (1 - t) * t * t * c2y +
            t * t * t * endY;
          points.push([px, py]);
        }
        cursorX = endX;
        cursorY = endY;
      } else if (cmd === 'Z' || cmd === 'z') {
        cursorX = startX;
        cursorY = startY;
        points.push([startX, startY]);
      }
    } else {
      // Unspecified command (repeat last L/Q/C)
      i++;
    }
  }

  return points;
}

/**
 * Converts SVG coordinate points into geographic real-world coordinates centered on track location
 */
export function generateCircuitGpsLayout(
  circuit: CircuitData,
  center: CircuitGeoCoords,
): CircuitGpsLayout {
  const sampledPoints = sampleSvgPathPoints(circuit.svgPath, 4);

  // If path parsing returned empty, generate fallback elliptical loop
  let rawPoints = sampledPoints;
  if (rawPoints.length < 10) {
    rawPoints = [];
    const count = 36;
    for (let idx = 0; idx <= count; idx++) {
      const angle = (idx / count) * Math.PI * 2;
      const rx = 200 + Math.sin(angle * 3) * 30;
      const ry = 120 + Math.cos(angle * 2) * 20;
      rawPoints.push([250 + Math.cos(angle) * rx, 180 + Math.sin(angle) * ry]);
    }
  }

  // Calculate bounding box and center of raw points
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of rawPoints) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  // Real world track scale: ~5km lap corresponds to ~1.4km to 2.2km physical span
  const trackLength = circuit.telemetry?.circuitLengthKm || 5.0;
  // ~0.009 to 0.018 degrees in latitude (1 degree ~ 111.1km => 0.01 degree ~ 1.11km)
  const latSpan = Math.max(0.012, Math.min(0.022, (trackLength / 5.2) * 0.015));
  const cosLat = Math.cos((center.lat * Math.PI) / 180) || 1;
  const lngSpan = latSpan / cosLat;

  // Convert raw points to [lat, lng]
  // Invert Y because SVG Y is down (+), whereas Geographic Latitude is up (+)
  const trackCoordinates: [number, number][] = rawPoints.map(([x, y]) => {
    const normX = (x - midX) / (width / 2);
    const normY = (midY - y) / (height / 2); // Inverted Y

    const lat = center.lat + normY * (latSpan / 2);
    const lng = center.lng + normX * (lngSpan / 2);
    return [lat, lng];
  });

  // Start / finish point
  const sfRawX = circuit.startFinish?.x ?? rawPoints[0][0];
  const sfRawY = circuit.startFinish?.y ?? rawPoints[0][1];
  const sfNormX = (sfRawX - midX) / (width / 2);
  const sfNormY = (midY - sfRawY) / (height / 2);
  const startFinishCoord: [number, number] = [
    center.lat + sfNormY * (latSpan / 2),
    center.lng + sfNormX * (lngSpan / 2),
  ];

  // Generate turns along the track
  const totalTurns = circuit.telemetry?.turns?.total || 14;
  const cornersMap = new Map<number, CircuitCornerHighlight>();
  if (circuit.corners) {
    for (const c of circuit.corners) {
      cornersMap.set(c.number, c);
    }
  }

  const turns: TurnMarkerData[] = [];
  const trackPointCount = trackCoordinates.length;

  for (let turnNum = 1; turnNum <= totalTurns; turnNum++) {
    // Distributed evenly along track with an offset from start/finish
    const index = Math.floor(((turnNum * 0.95) / totalTurns) * trackPointCount) % trackPointCount;
    const coord = trackCoordinates[index] || trackCoordinates[0];
    const cornerInfo = cornersMap.get(turnNum);

    turns.push({
      number: turnNum,
      lat: coord[0],
      lng: coord[1],
      nameVi: cornerInfo?.nameVi || `Khúc cua Turn ${turnNum}`,
      nameEn: cornerInfo?.nameEn || `Turn ${turnNum}`,
      speedCategory:
        cornerInfo?.speedCategory ||
        (turnNum % 3 === 0 ? 'slow' : turnNum % 2 === 0 ? 'high' : 'medium'),
    });
  }

  // Generate DRS Segments (Highlighted in vivid Green on straights)
  const drsZones = circuit.drsZones || [];
  const drsSegments: DrsSegmentData[] = [];

  drsZones.forEach((zone, idx) => {
    const step = Math.floor(trackPointCount / Math.max(1, drsZones.length));
    const startIdx = Math.floor(idx * step + step * 0.3) % trackPointCount;
    const length = Math.max(4, Math.floor(step * 0.45));

    const segmentCoords: [number, number][] = [];
    for (let k = 0; k < length; k++) {
      const ptIdx = (startIdx + k) % trackPointCount;
      segmentCoords.push(trackCoordinates[ptIdx]);
    }

    if (segmentCoords.length > 1) {
      drsSegments.push({
        id: zone.id,
        info: zone,
        coordinates: segmentCoords,
      });
    }
  });

  return {
    trackCoordinates,
    startFinishCoord,
    turns,
    drsSegments,
  };
}
