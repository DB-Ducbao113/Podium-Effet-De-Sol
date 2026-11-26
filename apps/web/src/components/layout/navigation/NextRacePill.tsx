import type { MouseEvent } from "react";
import type { NextRacePillState } from "./nextRaceSchedule";

export interface NextRacePillProps {
  readonly pill: NextRacePillState;
  readonly surfaceTone: "dark" | "light";
  readonly variant?: "header" | "drawer";
  readonly getCalendarHref: () => string;
  readonly onNavigateCalendar: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export function NextRacePill({
  pill,
  surfaceTone,
  variant = "header",
  getCalendarHref,
  onNavigateCalendar,
}: NextRacePillProps) {
  const baseClass =
    variant === "drawer" ? "peds-nav-drawer-next" : "peds-nav-next";

  if (!pill.href) {
    return (
      <span
        className={`${baseClass} is-static`}
        data-status={pill.status}
        data-surface-tone={surfaceTone}
        role="status"
        aria-live="polite"
        aria-label={pill.ariaLabel}
      >
        <span className="peds-nav-next-text">{pill.text}</span>
      </span>
    );
  }

  return (
    <a
      href={getCalendarHref()}
      className={baseClass}
      data-status={pill.status}
      data-surface-tone={surfaceTone}
      aria-label={pill.ariaLabel}
      onClick={onNavigateCalendar}
    >
      {pill.isLiveWeekend ? (
        <span className="peds-nav-next-dot" aria-hidden="true" />
      ) : null}
      <span className="peds-nav-next-text">{pill.text}</span>
      <span className="peds-nav-next-arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}
