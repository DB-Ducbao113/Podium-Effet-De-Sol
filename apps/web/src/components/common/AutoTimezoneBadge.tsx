import { Globe } from "lucide-react";
import {
  effectiveTimeZone,
  zoneOffsetLabel,
} from "../../utils/championshipTimezone";
import "./autoTimezoneBadge.css";

export interface AutoTimezoneBadgeProps {
  readonly lang: "vi" | "en";
  readonly timeZone: string;
  readonly referenceDate?: Date;
  readonly variant?: "home" | "calendar" | "results";
  readonly className?: string;
}

/**
 * Strictly non-interactive read-only timezone telemetry badge.
 * Displays the auto-detected IANA zone and UTC offset without any manual picker.
 */
export function AutoTimezoneBadge({
  lang,
  timeZone,
  referenceDate,
  variant = "home",
  className,
}: AutoTimezoneBadgeProps) {
  const zone = effectiveTimeZone(timeZone);
  const offset = zoneOffsetLabel(referenceDate ?? new Date(), zone);
  const prefix = lang === "vi" ? "Múi giờ tự động" : "Auto time zone";

  return (
    <p
      className={`peds-tz-badge peds-tz-badge--${variant}${className ? ` ${className}` : ""}`}
      data-timezone={zone}
      data-timezone-readonly="true"
    >
      <Globe size={13} aria-hidden="true" className="peds-tz-badge__icon" />
      <span className="peds-tz-badge__prefix">{prefix}</span>
      <span className="peds-tz-badge__sep" aria-hidden="true">
        ·
      </span>
      <span className="peds-tz-badge__value">
        {zone} ({offset})
      </span>
    </p>
  );
}
