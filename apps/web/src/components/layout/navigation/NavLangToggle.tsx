import type { Language } from "../../../types";
import { NAV_MICROCOPY } from "./navRegistry";

export interface NavLangToggleProps {
  readonly lang: Language;
  readonly surfaceTone: "dark" | "light";
  readonly variant?: "header" | "drawer";
  readonly onSelectLang: (lang: Language) => void;
}

export function NavLangToggle({
  lang,
  surfaceTone,
  variant = "header",
  onSelectLang,
}: NavLangToggleProps) {
  return (
    <div
      className={`peds-nav-lang ${variant === "drawer" ? "is-drawer" : ""}`}
      role="group"
      data-surface-tone={surfaceTone}
      aria-label={NAV_MICROCOPY.languageGroupAria[lang]}
    >
      {(["en", "vi"] as const).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            className={`peds-nav-lang-btn ${active ? "is-active" : ""}`}
            aria-pressed={active}
            aria-label={
              code === "en"
                ? NAV_MICROCOPY.switchToEnAria[lang]
                : NAV_MICROCOPY.switchToViAria[lang]
            }
            onClick={() => onSelectLang(code)}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
