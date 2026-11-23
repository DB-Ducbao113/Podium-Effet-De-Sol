interface EngineeringPartActionsProps {
  readonly lang: "en" | "vi";
  readonly isolated: boolean;
  readonly disabled: boolean;
  readonly onIsolate: () => void;
  readonly onReassemble: () => void;
}

export function EngineeringPartActions({
  lang,
  isolated,
  disabled,
  onIsolate,
  onReassemble,
}: EngineeringPartActionsProps) {
  return (
    <div className="peds-eng-part-toast__actions">
      {isolated ? (
        <button
          type="button"
          className="peds-eng-inspection-action peds-eng-inspection-action--active"
          onClick={onReassemble}
        >
          {lang === "vi" ? "Lắp lại" : "Reassemble"}
        </button>
      ) : (
        <button
          type="button"
          className="peds-eng-inspection-action"
          disabled={disabled}
          onClick={onIsolate}
        >
          {lang === "vi" ? "Tách riêng" : "Isolate"}
        </button>
      )}
    </div>
  );
}
