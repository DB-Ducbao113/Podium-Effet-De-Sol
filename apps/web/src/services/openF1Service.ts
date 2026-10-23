/**
 * OpenF1 Real-Time & Replay Data Service
 * Integrates with OpenF1 API (openf1.org) for authentic real-world driver tracking telemetry,
 * speed, gear, DRS status, positions, race control flags, and track coordinates.
 */

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  circuit_short_name: string;
  country_name: string;
  country_code: string;
  location: string;
  year: number;
  date_start: string;
  date_end: string;
}

export interface OpenF1Driver {
  driver_number: number;
  name_acronym: string;
  broadcast_name: string;
  full_name: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
}

export interface OpenF1Location {
  driver_number: number;
  x: number;
  y: number;
  z: number;
  date: string;
}

export interface OpenF1CarData {
  driver_number: number;
  speed: number;
  gear: number;
  drs: number;
  rpm?: number;
  throttle?: number;
  brake?: number;
  date?: string;
}

export interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
}

export interface OpenF1RaceControl {
  category: string;
  flag?: 'GREEN' | 'YELLOW' | 'RED' | 'CHEQUERED' | 'BLACK' | null;
  message: string;
  scope?: string | null;
  sector?: number | null;
  date: string;
}

export interface OpenF1DriverState {
  driver: OpenF1Driver;
  position: number;
  x: number;
  y: number;
  speed: number;
  gear: number;
  drs: boolean;
  gapSec?: number;
}

export interface OpenF1Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  spanX: number;
  spanY: number;
}

export interface CuratedReplayRace {
  id: string;
  name: string;
  circuitName: string;
  circuitKey: number;
  sessionKey: number;
  year: number;
  dateStart: string;
  dateEnd: string;
  sampleStartTime: string;
}

/**
 * Curated iconic races from OpenF1 database for instant replay
 */
export const CURATED_REPLAY_RACES: CuratedReplayRace[] = [
  {
    id: 'melbourne-2024',
    name: 'Australian GP 2024',
    circuitName: 'Albert Park, Melbourne',
    circuitKey: 10,
    sessionKey: 9488,
    year: 2024,
    dateStart: '2024-03-24T04:00:00+00:00',
    dateEnd: '2024-03-24T06:00:00+00:00',
    sampleStartTime: '2024-03-24T04:15:00',
  },
  {
    id: 'monaco-2024',
    name: 'Monaco GP 2024',
    circuitName: 'Circuit de Monaco',
    circuitKey: 22,
    sessionKey: 9523,
    year: 2024,
    dateStart: '2024-05-26T13:00:00+00:00',
    dateEnd: '2024-05-26T15:00:00+00:00',
    sampleStartTime: '2024-05-26T13:20:00',
  },
  {
    id: 'suzuka-2024',
    name: 'Japanese GP 2024',
    circuitName: 'Suzuka International Racing Course',
    circuitKey: 46,
    sessionKey: 9496,
    year: 2024,
    dateStart: '2024-04-07T05:00:00+00:00',
    dateEnd: '2024-04-07T07:00:00+00:00',
    sampleStartTime: '2024-04-07T05:15:00',
  },
  {
    id: 'sakhir-2024',
    name: 'Bahrain GP 2024',
    circuitName: 'Bahrain International Circuit',
    circuitKey: 63,
    sessionKey: 9472,
    year: 2024,
    dateStart: '2024-03-02T15:00:00+00:00',
    dateEnd: '2024-03-02T17:00:00+00:00',
    sampleStartTime: '2024-03-02T15:15:00',
  },
];

// In-memory cache to prevent exceeding 30 req/min (bounded: oldest evicted).
const memoryCache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 2000;
const MAX_CLIENT_CACHE_ENTRIES = 500;

export type OpenF1ErrorCode =
  'ok' | 'proxy-error' | 'upstream-rate-limited' | 'upstream-down' | 'timeout' | null;

class OpenF1Service {
  lastErrorCode: OpenF1ErrorCode = null;

  private async fetchJson<T>(
    endpoint: string,
    queryParams: Record<string, string | number> = {},
  ): Promise<T | null> {
    const query = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });

    const queryString = query.toString();
    const cacheKey = `${endpoint}?${queryString}`;

    const cached = memoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }

    // Same-origin proxy only (dev Vite proxy and prod serverless share the
    // same path/allowlist contract). No direct upstream fallback: it doubles
    // requests against the 30 req/min quota and bypasses proxy cache/CSP.
    const url = `/api/openf1/${endpoint}${queryString ? `?${queryString}` : ''}`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        this.lastErrorCode = res.status === 429 ? 'upstream-rate-limited' : 'upstream-down';
        return null;
      }
      const data = await res.json();
      memoryCache.delete(cacheKey);
      memoryCache.set(cacheKey, { timestamp: now, data });
      while (memoryCache.size > MAX_CLIENT_CACHE_ENTRIES) {
        const oldest = memoryCache.keys().next();
        if (oldest.done) break;
        memoryCache.delete(oldest.value);
      }
      this.lastErrorCode = 'ok';
      return data as T;
    } catch (err) {
      this.lastErrorCode =
        err instanceof DOMException && err.name === 'TimeoutError' ? 'timeout' : 'proxy-error';
      return null;
    }
  }

  /**
   * Get latest active or most recent session
   */
  async getLatestSession(): Promise<OpenF1Session | null> {
    const sessions = await this.fetchJson<OpenF1Session[]>('sessions', { session_key: 'latest' });
    if (sessions && sessions.length > 0) {
      return sessions[0];
    }
    return null;
  }

  /**
   * Get drivers for a specific session
   */
  async getSessionDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
    const drivers = await this.fetchJson<OpenF1Driver[]>('drivers', { session_key: sessionKey });
    return drivers || [];
  }

  /**
   * Get driver locations within a short time window (e.g., 2 seconds)
   */
  async getLocationWindow(
    sessionKey: number,
    dateStartIso: string,
    dateEndIso: string,
  ): Promise<OpenF1Location[]> {
    const locations = await this.fetchJson<OpenF1Location[]>('location', {
      session_key: sessionKey,
      'date>=': dateStartIso,
      'date<=': dateEndIso,
    });
    return locations || [];
  }

  /**
   * Get car data (speed, gear, DRS) within a short window
   */
  async getCarDataWindow(
    sessionKey: number,
    dateStartIso: string,
    dateEndIso: string,
  ): Promise<OpenF1CarData[]> {
    const carData = await this.fetchJson<OpenF1CarData[]>('car_data', {
      session_key: sessionKey,
      'date>=': dateStartIso,
      'date<=': dateEndIso,
    });
    return carData || [];
  }

  /**
   * Get latest positions (P1, P2...) for the session
   */
  async getPositions(sessionKey: number): Promise<OpenF1Position[]> {
    const positions = await this.fetchJson<OpenF1Position[]>('position', {
      session_key: sessionKey,
    });
    return positions || [];
  }

  /**
   * Get race control flags (Safety Car, Yellow, Green, Red)
   */
  async getRaceControl(sessionKey: number): Promise<OpenF1RaceControl[]> {
    const events = await this.fetchJson<OpenF1RaceControl[]>('race_control', {
      session_key: sessionKey,
    });
    return events || [];
  }
}

export const openF1Service = new OpenF1Service();
