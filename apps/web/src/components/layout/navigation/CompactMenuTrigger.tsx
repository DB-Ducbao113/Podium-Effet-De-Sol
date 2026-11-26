import type { Language } from "../../../types";
import { NAV_MICROCOPY } from "./navRegistry";

export interface CompactMenuTriggerProps {
  readonly open: boolean;
  readonly dialogId: string;
  readonly lang: Language;
  readonly surfaceTone: "dark" | "light";
  readonly onToggle: () => void;
}

export function CompactMenuTrigger({
  open,
  dialogId,
  lang,
  surfaceTone,
  onToggle,
}: CompactMenuTriggerProps) {
  const label = open
    ? NAV_MICROCOPY.closeTrigger[lang]
    : NAV_MICROCOPY.openTrigger[lang];

  return (
    <button
      type="button"
      className="peds-nav-trigger"
      data-open={open ? "true" : "false"}
      data-surface-tone={surfaceTone}
      aria-expanded={open}
      aria-controls={dialogId}
      aria-label={label}
      onClick={onToggle}
    >
      <span
        className="peds-nav-burger"
        data-open={open ? "true" : "false"}
        aria-hidden="true"
      >
        <span className="peds-nav-burger-line" />
        <span className="peds-nav-burger-line" />
        <span className="peds-nav-burger-line" />
      </span>
    </button>
  );
}
