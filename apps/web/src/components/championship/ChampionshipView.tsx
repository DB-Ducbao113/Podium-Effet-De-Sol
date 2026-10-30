import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useNavigationStore } from "../../store/useNavigationStore";
import { SeasonYear } from "../../types";
import { t } from "../../i18n/translations";
import { ChampionshipStandings } from "./ChampionshipStandings";
import { ChampionshipCalendar } from "./ChampionshipCalendar";
import { RaceResults } from "./RaceResults";
import { ChampionshipDirectory } from "./ChampionshipDirectory";
import {
  Trophy,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  UserRound,
} from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { Card } from "../ui/Card";
import { Tabs } from "../ui/Tabs";
import { Tooltip } from "../ui/Tooltip";
import { Button } from "../ui/Button";
import { AdSlot } from "../ui/AdSlot";
import "./championshipF4.css";
import "./championshipC1.css";

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
  const navigate = useNavigate();
  const location = useLocation();
  const {
    setSelectedSeason,
    activeSubTab,
    setActiveSubTab,
    standingsCategory,
    setStandingsCategory,
    syncMeta,
    syncSeasonData,
  } = useChampionshipStore();

  const strings = t[lang].championship;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSubTab !== "results") return;
    const root = viewRef.current;
    const controls = root?.querySelector<HTMLElement>(".f4-controls");
    if (!root || !controls) return;
    const update = () =>
      root.style.setProperty(
        "--c11-pinned-top",
        `${Math.ceil(controls.getBoundingClientRect().height + 64)}px`,
      );
    const observer = new ResizeObserver(update);
    observer.observe(controls);
    update();
    return () => {
      observer.disconnect();
      root.style.removeProperty("--c11-pinned-top");
    };
  }, [activeSubTab]);

  const selectedTab =
    activeSubTab === "standings"
      ? standingsCategory
      : activeSubTab === "drivers"
        ? "drivers-directory"
        : activeSubTab === "teams"
          ? "teams-directory"
          : activeSubTab;
  const adReview =
    new URLSearchParams(window.location.search).get("design-review") === "ads";

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

  const tabItems = [
    {
      value: "drivers",
      label: lang === "vi" ? "BXH tay đua" : "Driver standings",
      icon: <Trophy className="h-3.5 w-3.5" />,
    },
    {
      value: "constructors",
      label: lang === "vi" ? "BXH đội đua" : "Constructor standings",
      icon: <Trophy className="h-3.5 w-3.5" />,
    },
    {
      value: "calendar",
      label: strings.tabCalendar,
      icon: <Calendar className="h-3.5 w-3.5" />,
    },
    {
      value: "results",
      label: strings.tabResults,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    {
      value: "teams-directory",
      label: strings.tabTeams,
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      value: "drivers-directory",
      label: strings.tabDrivers,
      icon: <UserRound className="h-3.5 w-3.5" />,
    },
  ] as const;

  const selectTab = (value: (typeof tabItems)[number]["value"]) => {
    const params = new URLSearchParams(location.search);
    if (value === "drivers" || value === "constructors") {
      setStandingsCategory(value);
      setActiveSubTab("standings");
      params.set("tab", "standings");
      params.set("category", value);
    } else if (value === "teams-directory") setActiveSubTab("teams");
    else if (value === "drivers-directory") setActiveSubTab("drivers");
    else setActiveSubTab(value);
    if (value !== "drivers" && value !== "constructors") {
      params.set(
        "tab",
        value === "teams-directory"
          ? "teams"
          : value === "drivers-directory"
            ? "drivers"
            : value,
      );
      params.delete("category");
    }
    if (location.pathname.startsWith("/season/"))
      navigate(`${location.pathname}?${params.toString()}${location.hash}`);
  };

  return (
    <div
      ref={viewRef}
      className={`r1-primary r1-championship f4-championship min-h-screen py-12 relative ${activeSubTab === "results" ? "c1-results-active" : ""}`}
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

        {/* Top Control Bar: Season Selector & Subtabs */}
        <Card className="f4-controls flex flex-col items-stretch justify-between gap-3 overflow-hidden p-3 xl:flex-row xl:items-center xl:gap-4 sm:p-4">
          {/* Subtabs (Standings, Calendar, Results, Teams, Drivers) */}
          <Tabs
            items={tabItems}
            value={selectedTab}
            onValueChange={selectTab}
            ariaLabel={
              lang === "vi" ? "Nội dung giải vô địch" : "Championship content"
            }
            idBase="championship"
            className="custom-scrollbar -mx-1 max-w-full pb-1.5 sm:mx-0 sm:pb-1"
          />

          {/* Season Switcher & Refresh */}
          <div className="flex items-center justify-between xl:justify-end gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-studio-100">
            <Tooltip
              label={
                lang === "vi"
                  ? "Làm mới dữ liệu kết quả"
                  : "Refresh season data"
              }
            >
              <Button
                data-championship-refresh
                onClick={handleManualSync}
                disabled={syncMeta.syncStatus === "syncing"}
                variant="secondary"
                size="icon"
                aria-label={
                  lang === "vi"
                    ? "Làm mới dữ liệu kết quả"
                    : "Refresh season data"
                }
                className="min-[861px]:h-9 min-[861px]:w-9"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncMeta.syncStatus === "syncing" ? "animate-spin text-peds-accent-soft motion-reduce:animate-none" : ""}`}
                />
              </Button>
            </Tooltip>

            <div className="flex items-center gap-1 bg-studio-100 p-1 rounded-lg border border-studio-200">
              {SEASONS.map((seasonOption) => (
                <button
                  key={seasonOption}
                  data-season-option={seasonOption}
                  onClick={() => onSeasonChange(seasonOption)}
                  className={`min-h-11 min-[861px]:min-h-0 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    season === seasonOption
                      ? "bg-white text-f1red shadow-xs font-bold"
                      : "text-studio-600 hover:text-studio-950"
                  }`}
                >
                  <span>{seasonOption}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Content Render based on Subtab with 3D Depth Entrance */}
        <div
          key={selectedTab}
          id={`championship-panel-${selectedTab}`}
          role="tabpanel"
          aria-labelledby={`championship-tab-${selectedTab}`}
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
