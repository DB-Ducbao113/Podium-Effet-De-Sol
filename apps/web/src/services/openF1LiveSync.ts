import { BASELINE_CUTOFF_BY_SEASON } from '../data/championship/baselineCutoff';
import { CALENDAR_2026 } from '../data/championship/calendar';
import { DETAILED_RACE_RESULTS_2026 } from '../data/championship/detailedResults2026';
import type { DetailedRaceResult, DetailedRaceResultEntry, TeamId } from '../types';

interface OpenF1SessionRow {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  location?: string;
  country_name?: string;
}

interface OpenF1ResultRow {
  position: number | null;
  driver_number: number;
  number_of_laps?: number;
  duration?: number | null;
  gap_to_leader?: number | string | null;
  dnf?: boolean;
  dns?: boolean;
  dsq?: boolean;
}

const DRIVER_BY_NUM: Record<
  number,
  { driverId: string; driverName: string; driverCode: string; teamId: TeamId; teamName: string }
> = {
  1: { driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', teamId: 'mclaren', teamName: 'McLaren' },
  3: { driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', teamId: 'redbull', teamName: 'Red Bull' },
  5: { driverId: 'bortoleto', driverName: 'Gabriel Bortoleto', driverCode: 'BOR', teamId: 'audi', teamName: 'Audi' },
  6: { driverId: 'hadjar', driverName: 'Isack Hadjar', driverCode: 'HAD', teamId: 'redbull', teamName: 'Red Bull' },
  10: { driverId: 'gasly', driverName: 'Pierre Gasly', driverCode: 'GAS', teamId: 'alpine', teamName: 'Alpine F1 Team' },
  11: { driverId: 'perez', driverName: 'Sergio Pérez', driverCode: 'PER', teamId: 'cadillac', teamName: 'Cadillac F1 Team' },
  12: { driverId: 'antonelli', driverName: 'Andrea Kimi Antonelli', driverCode: 'ANT', teamId: 'mercedes', teamName: 'Mercedes' },
  14: { driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', teamId: 'astonmartin', teamName: 'Aston Martin' },
  16: { driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', teamId: 'ferrari', teamName: 'Ferrari' },
  18: { driverId: 'stroll', driverName: 'Lance Stroll', driverCode: 'STR', teamId: 'astonmartin', teamName: 'Aston Martin' },
  23: { driverId: 'albon', driverName: 'Alexander Albon', driverCode: 'ALB', teamId: 'williams', teamName: 'Williams' },
  27: { driverId: 'hulkenberg', driverName: 'Nico Hülkenberg', driverCode: 'HUL', teamId: 'audi', teamName: 'Audi' },
  30: { driverId: 'lawson', driverName: 'Liam Lawson', driverCode: 'LAW', teamId: 'racingbulls', teamName: 'RB F1 Team' },
  31: { driverId: 'ocon', driverName: 'Esteban Ocon', driverCode: 'OCO', teamId: 'haas', teamName: 'Haas F1 Team' },
  41: { driverId: 'lindblad', driverName: 'Arvid Lindblad', driverCode: 'LIN', teamId: 'racingbulls', teamName: 'RB F1 Team' },
  43: { driverId: 'colapinto', driverName: 'Franco Colapinto', driverCode: 'COL', teamId: 'alpine', teamName: 'Alpine F1 Team' },
  44: { driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', teamId: 'ferrari', teamName: 'Ferrari' },
  55: { driverId: 'sainz', driverName: 'Carlos Sainz', driverCode: 'SAI', teamId: 'williams', teamName: 'Williams' },
  63: { driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', teamId: 'mercedes', teamName: 'Mercedes' },
  77: { driverId: 'bottas', driverName: 'Valtteri Bottas', driverCode: 'BOT', teamId: 'cadillac', teamName: 'Cadillac F1 Team' },
  81: { driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', teamId: 'mclaren', teamName: 'McLaren' },
  87: { driverId: 'bearman', driverName: 'Oliver Bearman', driverCode: 'BEA', teamId: 'haas', teamName: 'Haas F1 Team' },
};

const FIA_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

function fmtDuration(sec: number | null | undefined): string {
  if (typeof sec !== 'number' || !Number.isFinite(sec)) return 'Finished';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = (sec % 60).toFixed(3).padStart(6, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

function fmtGap(gap: number | string | null | undefined): string {
  if (gap === 0 || gap === '0') return 'Leader';
  if (typeof gap === 'number' && Number.isFinite(gap)) return `+${gap.toFixed(3)}s`;
  if (typeof gap === 'string' && gap.length > 0) return gap.startsWith('+') ? gap : `+${gap}`;
  return 'DNF';
}

function matchCalendarRound(session: OpenF1SessionRow) {
  const cutoff = BASELINE_CUTOFF_BY_SEASON[2026].completedRounds;
  const loc = (session.location || '').toLowerCase();
  const country = (session.country_name || '').toLowerCase();
  return CALENDAR_2026.find(
    (gp) =>
      gp.round > cutoff &&
      (gp.location.toLowerCase().includes(loc) ||
        loc.includes(gp.location.toLowerCase()) ||
        gp.country.toLowerCase() === country),
  );
}

export async function syncOpenF1LiveRaces2026(
  existingResults: DetailedRaceResult[],
): Promise<{ success: boolean; results: DetailedRaceResult[]; message: string; source: string }> {
  try {
    const sessionsRes = await fetch('/api/openf1?endpoint=sessions&year=2026');
    if (!sessionsRes.ok) {
      return {
        success: false,
        results: existingResults,
        message: 'OpenF1 chưa phản hồi; giữ dữ liệu đã lưu gần nhất.',
        source: 'Local saved snapshot',
      };
    }

    const sessions = (await sessionsRes.json()) as OpenF1SessionRow[];
    if (!Array.isArray(sessions)) {
      return {
        success: false,
        results: existingResults,
        message: 'Dữ liệu OpenF1 không hợp lệ.',
        source: 'Local saved snapshot',
      };
    }

    const nowMs = Date.now();
    const raceByRound = new Map<number, DetailedRaceResult>();
    for (const r of DETAILED_RACE_RESULTS_2026) raceByRound.set(r.round, r);
    for (const r of existingResults) raceByRound.set(r.round, r);

    const candidateRaces = sessions.filter(
      (s) =>
        s.session_name === 'Race' &&
        s.date_end &&
        Date.parse(s.date_end) < nowMs &&
        Boolean(matchCalendarRound(s)),
    );

    let addedRounds = 0;
    const syncedAt = new Date().toISOString().slice(0, 10);

    for (const session of candidateRaces) {
      const cal = matchCalendarRound(session);
      if (!cal) continue;

      const resResp = await fetch(
        `/api/openf1?endpoint=session_result&session_key=${session.session_key}`,
      );
      if (!resResp.ok) continue;
      const rows = (await resResp.json()) as OpenF1ResultRow[];
      if (!Array.isArray(rows) || rows.length < 10) continue;

      const sorted = [...rows].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
      const entries: DetailedRaceResultEntry[] = sorted.map((row, idx) => {
        const pos = typeof row.position === 'number' ? row.position : idx + 1;
        const meta = DRIVER_BY_NUM[row.driver_number] ?? {
          driverId: `driver_${row.driver_number}`,
          driverName: `Driver #${row.driver_number}`,
          driverCode: String(row.driver_number),
          teamId: 'mercedes' as TeamId,
          teamName: 'F1 Team',
        };
        const isDnf = Boolean(row.dnf || row.dsq || row.dns || row.position == null);
        const status = row.dsq
          ? 'DSQ'
          : row.dns
            ? 'DNS'
            : isDnf
              ? 'DNF'
              : typeof row.gap_to_leader === 'string' && row.gap_to_leader.includes('LAP')
                ? row.gap_to_leader
                : 'Finished';
        const timeOrGap =
          pos === 1 ? fmtDuration(row.duration) : isDnf ? status : fmtGap(row.gap_to_leader);
        const points = !isDnf && pos <= 10 ? FIA_POINTS[pos - 1] : 0;

        return {
          position: pos,
          driverId: meta.driverId,
          driverName: meta.driverName,
          driverCode: meta.driverCode,
          driverNumber: row.driver_number,
          teamId: meta.teamId,
          teamName: meta.teamName,
          laps: row.number_of_laps || cal.laps,
          status,
          timeOrGap,
          points,
        };
      });

      const winner = entries[0];
      raceByRound.set(cal.round, {
        id: `race-2026-r${cal.round}-${cal.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        season: 2026,
        round: cal.round,
        grandPrix: cal.name,
        officialName: cal.officialName,
        circuit: cal.circuit,
        location: cal.location,
        country: cal.country,
        date: session.date_start.slice(0, 10),
        dataSource: 'OpenF1 Live Classification',
        dataUpdatedAt: syncedAt,
        status: 'completed',
        lapsTotal: cal.laps,
        winner: winner
          ? { driver: winner.driverName, team: winner.teamName, time: winner.timeOrGap }
          : undefined,
        entries,
      });
      addedRounds++;
    }

    const merged = [...raceByRound.values()].sort((a, b) => a.round - b.round);
    return {
      success: true,
      results: merged,
      message:
        addedRounds > 0
          ? `Đã đồng bộ tự động ${addedRounds} chặng mới từ OpenF1 Live.`
          : 'Đã kiểm tra OpenF1 Live — dữ liệu mùa 2026 đang ở trạng thái mới nhất.',
      source: 'OpenF1 Live API',
    };
  } catch {
    return {
      success: false,
      results: existingResults,
      message: 'Không thể kết nối OpenF1 lúc này; đang giữ dữ liệu đã lưu.',
      source: 'Local saved snapshot',
    };
  }
}
