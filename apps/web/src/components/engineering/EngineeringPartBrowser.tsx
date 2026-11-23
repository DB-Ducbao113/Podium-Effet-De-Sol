import { useEffect, useRef } from "react";
import type {
  EngineeringPartSpec,
  EngineeringTrackId,
} from "./engineeringDisassemblyData";

type EngineeringLanguage = "en" | "vi";

interface EngineeringPartBrowserProps {
  readonly open: boolean;
  readonly lang: EngineeringLanguage;
  readonly parts: readonly EngineeringPartSpec[];
  readonly selectedPartId: string | null;
  readonly onSelect: (partId: string) => void;
  readonly onClose: () => void;
  readonly onClosed: () => void;
}

const TRACK_ORDER: readonly EngineeringTrackId[] = [
  "aero",
  "body",
  "corners",
  "core",
];

const TRACK_LABELS: Readonly<
  Record<EngineeringTrackId, Readonly<Record<EngineeringLanguage, string>>>
> = {
  aero: { en: "Aerodynamics & DRS", vi: "Khí động học & DRS" },
  body: {
    en: "Bodywork, cockpit & cooling",
    vi: "Thân vỏ, buồng lái & làm mát",
  },
  corners: { en: "Wheels & suspension", vi: "Bánh xe & hệ treo" },
  core: {
    en: "Underfloor, powertrain & chassis",
    vi: "Sàn Venturi, động cơ & khung gầm",
  },
};

export function EngineeringPartBrowser({
  open,
  lang,
  parts,
  selectedPartId,
  onSelect,
  onClose,
  onClosed,
}: EngineeringPartBrowserProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const copy =
    lang === "vi"
      ? {
          title: "Danh sách linh kiện",
          count: `${parts.length} linh kiện`,
          close: "Đóng danh sách linh kiện",
          selected: "Đang chọn",
        }
      : {
          title: "Component list",
          count: `${parts.length} components`,
          close: "Close component list",
          selected: "Selected",
        };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      const frame = requestAnimationFrame(() => {
        if (dialog.open) closeButtonRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const partsByTrack = new Map<EngineeringTrackId, EngineeringPartSpec[]>(
    TRACK_ORDER.map((track) => [track, []]),
  );
  for (const part of parts) partsByTrack.get(part.track)?.push(part);

  return (
    <dialog
      ref={dialogRef}
      id="engineering-parts-dialog"
      className="peds-eng-parts-dialog"
      aria-labelledby="engineering-parts-title"
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        onClose();
        onClosed();
      }}
    >
      <div className="peds-eng-parts-panel">
        <header className="peds-eng-parts-panel__header">
          <div>
            <h2 id="engineering-parts-title">{copy.title}</h2>
            <p>{copy.count}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="peds-eng-parts-panel__close"
            aria-label={copy.close}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="peds-eng-parts-panel__groups">
          {TRACK_ORDER.map((track) => {
            const groupParts = partsByTrack.get(track) ?? [];
            if (groupParts.length === 0) return null;

            return (
              <details
                key={track}
                className="peds-eng-parts-group"
                open={
                  track === "aero" ||
                  groupParts.some((part) => part.id === selectedPartId)
                }
              >
                <summary>
                  <span>{TRACK_LABELS[track][lang]}</span>
                  <span className="peds-eng-parts-group__count">
                    {groupParts.length}
                  </span>
                </summary>
                <ul>
                  {groupParts.map((part) => (
                    <li key={part.id}>
                      <button
                        type="button"
                        className="peds-eng-part-option"
                        aria-pressed={selectedPartId === part.id}
                        onClick={() => {
                          onSelect(part.id);
                          onClose();
                        }}
                      >
                        <span className="peds-eng-part-option__name">
                          {part.label[lang]}
                          {selectedPartId === part.id && (
                            <span className="peds-eng-part-option__selected">
                              {copy.selected}
                            </span>
                          )}
                        </span>
                        <span className="peds-eng-part-option__summary">
                          {part.summary[lang]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
