import { ArrowUpRight, Box, Cpu, Trophy } from "lucide-react";
import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import type {
  ConstructorStanding,
  DriverStanding,
  GrandPrixRound,
  RaceResult,
  SeasonYear,
} from "../../types";
import { useTimezoneStore } from "../../store/useTimezoneStore";
import { getSessionTimeRange } from "../../utils/raceSchedule";
import { AutoTimezoneBadge } from "../common/AutoTimezoneBadge";
import { LiveCountdownLeaf } from "./LiveCountdownLeaf";
import type { StormInspectionTarget } from "./types";

export interface LiveF1PulseDockProps {
  readonly lang: "vi" | "en";
  readonly season: SeasonYear;
  readonly reducedMotion: boolean;
  readonly nextRace?: GrandPrixRound;
  readonly latestResult?: RaceResult;
  readonly standings: {
    readonly drivers: readonly DriverStanding[];
    readonly constructors: readonly ConstructorStanding[];
  };
  readonly onInspect: (target: StormInspectionTarget) => void;
  readonly onPrefetchRoute?: (
    routeKey: "showroom" | "engineering" | "calendar" | "standings",
  ) => void;
}

function shortGp(name: string): string {
  return name.replace(/\s+Grand Prix$/i, "").trim();
}

export const LiveF1PulseDock = memo(function LiveF1PulseDock({
  lang,
  season,
  reducedMotion,
  nextRace,
  latestResult,
  standings,
  onInspect,
  onPrefetchRoute,
}: LiveF1PulseDockProps) {
  const isVi = lang === "vi";
  const timeZone = useTimezoneStore((s) => s.timeZone);
  const leader = standings.drivers[0];

  const raceStartDate = useMemo(() => {
    if (!nextRace) return null;
    return getSessionTimeRange(nextRace, "race")?.start ?? null;
  }, [nextRace]);

  return (
    <div
      className="sp-pulse-dock"
      data-testid="live-f1-pulse-dock"
      aria-label={
        isVi
          ? "Nhịp đập mùa giải F1 trực tiếp và lối vào 3D"
          : "Live F1 season pulse and 3D showcases"
      }
    >
      {/* Card 1: Synchronized Next-Race Countdown + Auto IP Timezone */}
      <div className="sp-pulse-card" data-lg-glow="true">
        {nextRace ? (
          <>
            <div className="sp-pulse-card__head">
              <span className="sp-pulse-kicker">
                <span className="sp-lg-live-dot" aria-hidden="true" />
                {isVi
                  ? `CHẶNG KẾ TIẾP · VÒNG ${String(nextRace.round).padStart(2, "0")}`
                  : `NEXT GRAND PRIX · R${String(nextRace.round).padStart(2, "0")}`}
              </span>
              <Link
                to={`/season/${season}?tab=calendar`}
                className="sp-pulse-mini-link"
                onMouseEnter={() => onPrefetchRoute?.("calendar")}
                onFocus={() => onPrefetchRoute?.("calendar")}
              >
                {shortGp(nextRace.name)}{" "}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>

            <div className="sp-pulse-countdown-row">
              <LiveCountdownLeaf
                targetEpochMs={raceStartDate ? raceStartDate.getTime() : null}
                lang={lang}
                reducedMotion={reducedMotion}
                className="sp-pulse-countdown-digits"
              />
            </div>

            <AutoTimezoneBadge
              lang={lang}
              timeZone={timeZone}
              referenceDate={raceStartDate ?? undefined}
              variant="home"
              className="sp-pulse-tz"
            />
          </>
        ) : (
          <>
            <div className="sp-pulse-card__head">
              <span className="sp-pulse-kicker">
                {isVi
                  ? `MÙA GIẢI ${season} ĐÃ KHÉP LẠI`
                  : `${season} SEASON COMPLETE`}
              </span>
            </div>
            <div className="sp-pulse-countdown-digits">
              {isVi ? "HOÀN TẤT PHÂN HẠNG" : "FINAL STANDINGS LOCKED"}
            </div>
            <Link
              to={`/season/${season}?tab=standings`}
              className="sp-pulse-mini-link"
              onMouseEnter={() => onPrefetchRoute?.("standings")}
              onFocus={() => onPrefetchRoute?.("standings")}
            >
              {isVi
                ? "Xem bảng xếp hạng chung cuộc"
                : "Open final championship table"}{" "}
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </>
        )}
      </div>

      {/* Card 2: Championship P1 Leader & Latest GP Winner Dossier Triggers */}
      <div className="sp-pulse-card" data-lg-glow="true">
        <div className="sp-pulse-card__head">
          <span className="sp-pulse-kicker">
            <Trophy size={12} aria-hidden="true" />
            {isVi
              ? `TÂM ĐIỂM ĐƯỜNG ĐUA ${season}`
              : `${season} CHAMPIONSHIP PULSE`}
          </span>
        </div>

        <div className="sp-pulse-rows">
          {leader ? (
            <button
              type="button"
              className="sp-pulse-row-btn"
              onClick={() =>
                onInspect({
                  kind: "driver",
                  driverId: leader.driverId,
                  season,
                })
              }
            >
              <span className="sp-pulse-row-main">
                <strong>P1 · {leader.driverCode}</strong>
                <span>{leader.driverName}</span>
              </span>
              <span className="sp-pulse-row-meta">{leader.points} PTS ↗</span>
            </button>
          ) : null}

          {latestResult ? (
            <button
              type="button"
              className="sp-pulse-row-btn"
              onClick={() =>
                onInspect({
                  kind: "race",
                  round: latestResult.round,
                  season,
                })
              }
            >
              <span className="sp-pulse-row-main">
                <strong>
                  {isVi
                    ? `THẮNG R${latestResult.round}`
                    : `WON R${latestResult.round}`}
                </strong>
                <span>
                  {shortGp(latestResult.grandPrix)} ·{" "}
                  {latestResult.podium.p1.driver}
                </span>
              </span>
              <span className="sp-pulse-row-meta">Podium ↗</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Card 3: Interactive 3D Showcase Teasers (Showroom & Engineering) */}
      <div className="sp-pulse-card" data-lg-glow="true">
        <div className="sp-pulse-card__head">
          <span className="sp-pulse-kicker">
            <Box size={12} aria-hidden="true" />
            {isVi ? "TRẢI NGHIỆM 3D TƯƠNG TÁC" : "INTERACTIVE 3D STAGES"}
          </span>
        </div>

        <div className="sp-pulse-rows">
          <Link
            to="/showroom"
            className="sp-pulse-row-btn"
            onMouseEnter={() => onPrefetchRoute?.("showroom")}
            onFocus={() => onPrefetchRoute?.("showroom")}
          >
            <span className="sp-pulse-row-main">
              <strong>{isVi ? "GARAGE 2 XE" : "2-BAY GARAGE"}</strong>
              <span>
                {isVi
                  ? "11 đội 2026 · Pit Crew tháo bánh"
                  : "11 teams 2026 · Live wheel service"}
              </span>
            </span>
            <span className="sp-pulse-row-meta" aria-hidden="true">
              <ArrowUpRight size={15} />
            </span>
          </Link>

          <Link
            to="/engineering"
            className="sp-pulse-row-btn"
            onMouseEnter={() => onPrefetchRoute?.("engineering")}
            onFocus={() => onPrefetchRoute?.("engineering")}
          >
            <span className="sp-pulse-row-main">
              <strong>
                <Cpu
                  size={11}
                  aria-hidden="true"
                  style={{ display: "inline", marginRight: 4 }}
                />
                {isVi ? "47 LINH KIỆN" : "47 ASSEMBLIES"}
              </strong>
              <span>
                {isVi
                  ? "Show 12 hồi mổ xẻ khí động FP-04 RB"
                  : "12-scene FP-04 RB aero disassembly"}
              </span>
            </span>
            <span className="sp-pulse-row-meta" aria-hidden="true">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
});
