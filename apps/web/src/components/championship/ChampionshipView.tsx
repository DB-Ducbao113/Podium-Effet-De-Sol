import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isChampionshipJourneyRoute } from "../../championshipJourneyRoute";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useNavigationStore } from "../../store/useNavigationStore";
import { SeasonYear } from "../../types";
import { t } from "../../i18n/translations";
import { resolveTextZoomLevel } from "../../hooks/useTextZoomAttribute";
import { ChampionshipStandings } from "./ChampionshipStandings";
import { ChampionshipCalendar } from "./ChampionshipCalendar";
import { RaceResults } from "./RaceResults";
import { ChampionshipDirectory } from "./ChampionshipDirectory";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { Tooltip } from "../ui/Tooltip";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { AdSlot } from "../ui/AdSlot";
import "./championshipF4.css";
import "./championshipC1.css";

type ChampionshipTab = "standings" | "calendar" | "results" | "teams" | "drivers";

interface ChampionshipViewProps {
  season: SeasonYear;
  onSeasonChange: (season: SeasonYear) => void;
  headingLevel?: "h1" | "h2";
}

export const ChampionshipView: React.FC<ChampionshipViewProps> = ({
  season,
  onSeasonChange,
  headingLevel = "h1",
}) => {
  const { lang } = useNavigationStore();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    setSelectedSeason,
    activeSubTab,
    standingsCategory,
    setStandingsCategory,
    syncMeta,
    syncSeasonData,
  } = useChampionshipStore();

  const strings = t[lang].championship;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [textZoom, setTextZoom] = useState<"normal" | "200" | "400">("normal");

  useEffect(() => {
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:absolute;left:-9999px;top:0;width:1rem;height:1rem;pointer-events:none;visibility:hidden";
    document.body.appendChild(probe);
    const update = () => {
      setTextZoom(resolveTextZoomLevel(document.documentElement, probe));
    };
    const observer = new ResizeObserver(update);
    observer.observe(probe);
    update();
    return () => {
      observer.disconnect();
      probe.remove();
    };
  }, []);

  const selectedContent =
    activeSubTab === "standings"
      ? standingsCategory
      : activeSubTab === "drivers"
        ? "drivers-directory"
        : activeSubTab === "teams"
          ? "teams-directory"
          : activeSubTab;
  const adReview =
    new URLSearchParams(location.search).get("design-review") === "ads";
  const immersiveJourney =
    activeSubTab === "calendar" &&
    isChampionshipJourneyRoute(location.pathname, location.search);

  // Mirrors the global navbar order: the Results group first, then Standings.
  const sectionTabs: { value: ChampionshipTab; label: string }[] = [
    { value: "results", label: strings.tabResults },
    { value: "calendar", label: strings.tabCalendar },
    { value: "standings", label: strings.tabStandings },
    { value: "teams", label: strings.tabTeams },
    { value: "drivers", label: strings.tabDrivers },
  ];
  const goToTab = (tab: ChampionshipTab) => {
    const params = new URLSearchParams({ tab });
    if (tab === "standings") params.set("category", standingsCategory);
    navigate(`/season/${season}?${params.toString()}`);
  };
  const goToCategory = (category: "drivers" | "constructors") => {
    setStandingsCategory(category);
    navigate(`/season/${season}?tab=standings&category=${category}`);
  };

  const SEASONS: SeasonYear[] = [2026, 2025, 2024];
  useEffect(() => {
    setSelectedSeason(season);
  }, [season, setSelectedSeason]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleManualSync = async () => {
    await syncSeasonData(season);
    showToast(
      useChampionshipStore.getState().syncMeta.message ||
        (lang === "vi" ? "Đồng bộ hoàn tất." : "Sync complete."),
    );
  };

  return (
    <div
      className={`r1-primary r1-championship f4-championship min-h-screen relative ${immersiveJourney ? "is-journey" : "py-12"} ${
        activeSubTab === "results"
          ? "c1-results-active"
          : activeSubTab === "calendar"
            ? "c1-calendar-active"
            : activeSubTab === "standings"
              ? "p5-standings-shell"
              : ""
      }`}
      data-text-zoom={textZoom}
    >
      <div className="page-container space-y-8">
        {/* Header */}
        <div className="c1-page-intro">
          <SectionHeading
            eyebrow={strings.badge}
            title={strings.title}
            description={strings.desc}
            titleAs={headingLevel}
            titleClassName={
              lang === "vi"
                ? "championship-page-title font-bold leading-[1.15] tracking-tight"
                : "championship-page-title font-bold leading-[1.08] tracking-tight"
            }
          />
        </div>

        {!immersiveJourney && <div className="f4-controls" aria-label={lang === "vi" ? "Điều khiển giải đấu" : "Championship controls"}>
          {activeSubTab !== "results" && <div className="f4-tabs-row">
            <Tabs
              items={sectionTabs}
              value={activeSubTab}
              onValueChange={goToTab}
              ariaLabel={lang === "vi" ? "Các mục giải đấu" : "Championship sections"}
              idBase="championship-section"
              scrollCueLabel={lang === "vi" ? "Cuộn để xem thêm mục" : "Scroll for more sections"}
            />
          </div>}
          <div className="f4-season-row">
            {activeSubTab === "standings" && (
              <div className="f4-category-toggle" role="group" aria-label={lang === "vi" ? "Loại bảng xếp hạng" : "Standings category"}>
                <button type="button" aria-pressed={standingsCategory === "drivers"} onClick={() => goToCategory("drivers")}>
                  {lang === "vi" ? "Tay đua" : "Drivers"}
                </button>
                <button type="button" aria-pressed={standingsCategory === "constructors"} onClick={() => goToCategory("constructors")}>
                  {lang === "vi" ? "Đội đua" : "Constructors"}
                </button>
              </div>
            )}
            <span className="f4-season-label">{lang === 'vi' ? 'Mùa giải' : 'Season'}</span>
            <div className="f4-season-switcher" role="group" aria-label={lang === 'vi' ? 'Chọn mùa giải' : 'Choose season'}>
              {SEASONS.map((seasonOption) => (
                <button
                  key={seasonOption}
                  data-season-option={seasonOption}
                  type="button"
                  aria-pressed={season === seasonOption}
                  onClick={() => onSeasonChange(seasonOption)}
                  className={season === seasonOption ? 'is-active' : undefined}
                >
                  <span>{seasonOption}</span>
                </button>
              ))}
            </div>
            <Tooltip className="f4-refresh-tooltip" label={lang === 'vi' ? 'Làm mới dữ liệu kết quả' : 'Refresh season data'}>
              <Button
                data-championship-refresh
                onClick={handleManualSync}
                disabled={syncMeta.syncStatus === 'syncing'}
                variant="secondary"
                size="icon"
                aria-label={lang === 'vi' ? 'Làm mới dữ liệu kết quả' : 'Refresh season data'}
                className="f4-season-refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncMeta.syncStatus === 'syncing' ? 'animate-spin text-peds-accent-soft motion-reduce:animate-none' : ''}`} />
              </Button>
            </Tooltip>
          </div>
        </div>}

        {/* Section content selected by the primary navigation. */}
        <div
          key={selectedContent}
          id={`championship-content-${selectedContent}`}
          className="f4-panel"
        >
          {activeSubTab === "standings" && (
            <ChampionshipStandings season={season} />
          )}
          {activeSubTab === "calendar" && (
            <ChampionshipCalendar season={season} />
          )}
          {activeSubTab === "results" && <RaceResults season={season} />}
          {activeSubTab === "teams" && (
            <ChampionshipDirectory season={season} kind="teams" />
          )}
          {activeSubTab === "drivers" && (
            <ChampionshipDirectory season={season} kind="drivers" />
          )}
        </div>
        <AdSlot
          variant="leaderboard"
          placement="championship-after-content"
          reviewMode={adReview}
        />
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 right-6 z-50">
          <div className="bg-studio-950 text-white px-5 py-3 rounded-xl shadow-2xl border border-studio-700 flex items-center gap-3 text-xs font-bold">
            {syncMeta.syncStatus === "error" ? (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
