import { Camera, Info, Pause, Play, RotateCcw, Wrench, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import type {
  Fp04rbShowroomLod,
  WheelCorner,
} from "../showroom/fp04rb-garage/fp04rbLoader";
import {
  GARAGE_CAMERA_PRESETS,
  INSPECTION_PARTS,
  PRD_34_CAMERA_PRESETS,
  type BayFocus,
  type CameraPresetId,
  type GarageMode,
} from "../showroom/fp04rb-garage/inspectionParts";
import {
  getPrdTeamManifest,
  type LiveryVariantId,
} from "../showroom/fp04rb-garage/liveryPrdManifest2026";
import {
  MAINTENANCE_STEP_LABELS,
  type MaintenanceState,
} from "../showroom/fp04rb-garage/ServiceSequence";
import { getTeamBadgeUrl } from "../showroom/fp04rb-garage/teamLogos2026";
import {
  FP04RB_CHASSIS_DISCLAIMER,
  TEAMS_2026,
  getTeam2026ById,
  type TeamId as GarageTeamId,
} from "../showroom/fp04rb-garage/teams2026";

const GARAGE_MODE_LABELS: Record<
  GarageMode,
  { readonly vi: string; readonly en: string }
> = {
  overview: { vi: "Toàn cảnh", en: "Overview" },
  inspection: { vi: "Kiểm tra", en: "Inspect" },
  maintenance: { vi: "Bảo dưỡng", en: "Service" },
};

const GARAGE_CORNERS: readonly WheelCorner[] = ["FL", "FR", "RL", "RR"];

const SHORT_CAM_LABELS: Record<
  CameraPresetId,
  { readonly vi: string; readonly en: string }
> = {
  "pit-lane-overview": { vi: "Pit-Lane", en: "Pit-Lane" },
  front: { vi: "Trước", en: "Front" },
  "left-side": { vi: "Trái", en: "Left" },
  "right-side": { vi: "Phải", en: "Right" },
  rear: { vi: "Sau", en: "Rear" },
  top: { vi: "Trên", en: "Top" },
  "technical-closeup": { vi: "Cận cảnh", en: "Close-up" },
  "front-34-left": { vi: "3/4 Tr.Trái", en: "3/4 FL" },
  "front-34-right": { vi: "3/4 Tr.Phải", en: "3/4 FR" },
  "rear-34-left": { vi: "3/4 S.Trái", en: "3/4 RL" },
  "rear-34-right": { vi: "3/4 S.Phải", en: "3/4 RR" },
};

export interface StormShowroomViewProps {
  readonly lang: "vi" | "en";
  readonly webglReady: boolean;
  readonly showroomLoadState: "idle" | "loading" | "ready" | "error";
  readonly garageTeamId: GarageTeamId;
  readonly garageVariantId: LiveryVariantId;
  readonly garageBayFocus: BayFocus;
  readonly garageMode: GarageMode;
  readonly garagePreset: CameraPresetId;
  readonly garageSelectedPartId: string;
  readonly garageHoveredPartId: string | null;
  readonly garageStatsSample: {
    readonly bay1Tris: number;
    readonly bay2Tris: number;
    readonly lod: Fp04rbShowroomLod;
  } | null;
  readonly garageMaintenanceState: MaintenanceState;
  readonly onSelectGarageTeam: (id: GarageTeamId) => void;
  readonly onSelectCadillacVariant: (variant: LiveryVariantId) => void;
  readonly onSelectGarageBay: (bay: BayFocus) => void;
  readonly onSelectGarageMode: (mode: GarageMode) => void;
  readonly onSelectGaragePreset: (preset: CameraPresetId) => void;
  readonly onHoverGaragePart: (partId: string | null) => void;
  readonly onSelectGaragePart: (partId: string) => void;
  readonly onSelectGarageCorner: (corner: WheelCorner) => void;
  readonly onStartGarageMaintenance: () => void;
  readonly onPauseGarageMaintenance: () => void;
  readonly onResetGarageMaintenance: () => void;
}

export function StormShowroomView({
  lang,
  webglReady,
  showroomLoadState,
  garageTeamId,
  garageVariantId,
  garageBayFocus,
  garageMode,
  garagePreset,
  garageSelectedPartId,
  garageHoveredPartId,
  garageStatsSample,
  garageMaintenanceState,
  onSelectGarageTeam,
  onSelectCadillacVariant,
  onSelectGarageBay,
  onSelectGarageMode,
  onSelectGaragePreset,
  onHoverGaragePart,
  onSelectGaragePart,
  onSelectGarageCorner,
  onStartGarageMaintenance,
  onPauseGarageMaintenance,
  onResetGarageMaintenance,
}: StormShowroomViewProps) {
  const isVi = lang === "vi";
  const [partInfoPinned, setPartInfoPinned] = useState(false);
  const [camMenuOpen, setCamMenuOpen] = useState(false);
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const [hoveredTeamId, setHoveredTeamId] = useState<GarageTeamId | null>(null);
  const srWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!camMenuOpen && !infoMenuOpen && !partInfoPinned) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCamMenuOpen(false);
        setInfoMenuOpen(false);
        setPartInfoPinned(false);
        onHoverGaragePart(null);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && srWrapRef.current && !srWrapRef.current.contains(target)) {
        setCamMenuOpen(false);
        setInfoMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [camMenuOpen, infoMenuOpen, partInfoPinned, onHoverGaragePart]);

  const team = useMemo(() => getTeam2026ById(garageTeamId), [garageTeamId]);
  const metaTeam = useMemo(
    () => getTeam2026ById(hoveredTeamId ?? garageTeamId),
    [hoveredTeamId, garageTeamId],
  );
  const prdManifest = useMemo(() => getPrdTeamManifest(team.id), [team.id]);
  const activeVariantMeta =
    prdManifest.availableVariants.find((v) => v.id === garageVariantId) ??
    prdManifest.availableVariants[0];

  const effectivePartId = garageHoveredPartId ?? garageSelectedPartId;
  const selectedPart = useMemo(
    () =>
      INSPECTION_PARTS.find((p) => p.id === effectivePartId) ??
      INSPECTION_PARTS[0],
    [effectivePartId],
  );
  const selectedPartIndex = Math.max(
    0,
    INSPECTION_PARTS.findIndex((p) => p.id === selectedPart.id),
  );

  const focusedBayKey = garageBayFocus === "bay-1" ? "bay1" : "bay2";
  const focusedDriver = team.drivers[focusedBayKey];
  const stepLabel = MAINTENANCE_STEP_LABELS[garageMaintenanceState.step][lang];

  const showPartCallout =
    garageMode !== "maintenance" &&
    (Boolean(garageHoveredPartId) || partInfoPinned);

  const statusLine = !webglReady
    ? FP04RB_CHASSIS_DISCLAIMER[lang]
    : showroomLoadState === "loading"
      ? isVi
        ? "Đang nạp cặp xe 3D FP-04 RB cùng pit garage 2 khoang..."
        : "Loading dual-car FP-04 RB GLB models inside the 2-bay pit garage..."
      : showroomLoadState === "error"
        ? isVi
          ? "Không giải mã được tệp 3D FP-04 RB GLB · bảng 11 đội & thông số kỹ thuật vẫn khả dụng."
          : "FP-04 RB 3D GLB failed to decode · 11-team palette & inspection specs remain active."
        : `${FP04RB_CHASSIS_DISCLAIMER[lang]}`;

  return (
    <div
      ref={srWrapRef}
      className="sp-lg-wrap sp-lg-sr-wrap"
      data-prototype-tab="showroom"
      data-testid="fp04rb-garage-showroom"
      data-team={team.id}
      data-mode={garageMode}
      data-bay-focus={garageBayFocus}
      data-bay1-tris={garageStatsSample?.bay1Tris ?? 0}
      data-bay2-tris={garageStatsSample?.bay2Tris ?? 0}
      data-showroom-state={webglReady ? showroomLoadState : "fallback"}
      style={
        {
          "--sr-team-primary": team.primaryColor,
          "--sr-team-accent": team.accentColor,
        } as CSSProperties
      }
    >
      <header className="sp-lg-sr-top">
        <div
          className={`sp-lg-sr-head ${infoMenuOpen ? "is-open" : ""}`}
          onMouseLeave={() => setInfoMenuOpen(false)}
        >
          <button
            type="button"
            className="sp-lg-panel sp-lg-sr-brandpill"
            aria-expanded={infoMenuOpen}
            onClick={() => setInfoMenuOpen((v) => !v)}
          >
            <img
              src={getTeamBadgeUrl(team.id)}
              alt=""
              aria-hidden="true"
              className="sp-lg-sr-brandlogo"
            />
            <h1 className="sp-lg-h1 sp-lg-sr-mini-h1">
              {team.name}, <em>{focusedDriver}</em>
            </h1>
            <span className="sp-sr-season-tag">
              {isVi ? "ĐỘI HÌNH 2026" : "2026 GRID"}
            </span>
            <span className="sp-lg-sr-infobadge" aria-hidden="true">
              <Info />
            </span>
          </button>

          <div
            className="sp-lg-panel sp-lg-sr-infopop"
            role="region"
            aria-label={isVi ? "Thông tin Garage" : "Garage specs"}
          >
            <div className="sp-lg-kick">
              {isVi
                ? `GARAGE PIT 2 KHOANG · 2026 GRID · FP-04 RB · #${team.carNumbers.bay1} & #${team.carNumbers.bay2}`
                : `TWO-BAY F1 PIT GARAGE · 2026 GRID · FP-04 RB · #${team.carNumbers.bay1} & #${team.carNumbers.bay2}`}
              {garageStatsSample
                ? ` · ${(garageStatsSample.bay1Tris / 1000).toFixed(0)}k / ${(garageStatsSample.bay2Tris / 1000).toFixed(0)}k tris`
                : ""}
            </div>
            <div className="sp-lg-sr-infobays">
              BAY 1 ({team.drivers.bay1}) · BAY 2 ({team.drivers.bay2})
            </div>
            <p className="sp-lg-sr-hint">{statusLine}</p>
            <Link to="/about" className="sp-sr-about-link">
              {isVi
                ? "Giới thiệu & Bản quyền mô hình →"
                : "About & 3D Provenance →"}
            </Link>
          </div>
        </div>

        <div className="sp-lg-sr-controls">
          <div
            className="sp-lg-panel sp-lg-sr-toolbar sp-lg-sr-garage-toolbar"
            role="group"
            aria-label={
              isVi
                ? "Chế độ Garage, Khoang & Góc camera"
                : "Garage mode, bays and camera presets"
            }
          >
            <div className="sp-lg-sr-camgroup">
              {(["overview", "inspection", "maintenance"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={garageMode === m}
                  className={`sp-lg-sr-cbtn ${garageMode === m ? "is-active" : ""}`}
                  onClick={() => {
                    setPartInfoPinned(false);
                    onSelectGarageMode(m);
                  }}
                >
                  {GARAGE_MODE_LABELS[m][lang]}
                </button>
              ))}
            </div>

            <div className="sp-lg-sr-baygroup">
              <button
                type="button"
                aria-pressed={garageBayFocus === "bay-1"}
                className={`sp-lg-sr-cbtn ${garageBayFocus === "bay-1" ? "is-active" : ""}`}
                onClick={() => onSelectGarageBay("bay-1")}
              >
                {`Bay 1 #${team.carNumbers.bay1}`}
              </button>
              <button
                type="button"
                aria-pressed={garageBayFocus === "bay-2"}
                className={`sp-lg-sr-cbtn ${garageBayFocus === "bay-2" ? "is-active" : ""}`}
                onClick={() => onSelectGarageBay("bay-2")}
              >
                {`Bay 2 #${team.carNumbers.bay2}`}
              </button>
            </div>

            <div
              className={`sp-lg-sr-camwrap ${camMenuOpen ? "is-open" : ""}`}
              onMouseLeave={() => setCamMenuOpen(false)}
            >
              <button
                type="button"
                className="sp-lg-sr-cbtn sp-lg-sr-camtrig"
                aria-expanded={camMenuOpen}
                aria-label={isVi ? "Chọn góc camera" : "Camera angles"}
                onClick={() => setCamMenuOpen((v) => !v)}
              >
                <Camera aria-hidden="true" />
                <span>{SHORT_CAM_LABELS[garagePreset][lang]}</span>
              </button>

              <div
                className="sp-lg-panel sp-lg-sr-campop"
                role="group"
                aria-label={
                  isVi ? "Danh sách góc camera" : "Camera angle presets"
                }
              >
                {[...GARAGE_CAMERA_PRESETS, ...PRD_34_CAMERA_PRESETS].map(
                  (p) => {
                    const active = garagePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={active}
                        data-camera-preset={p.id}
                        className={`sp-lg-sr-cbtn is-cam ${active ? "is-active" : ""}`}
                        onClick={() => {
                          onSelectGaragePreset(p.id);
                          setCamMenuOpen(false);
                        }}
                      >
                        {SHORT_CAM_LABELS[p.id][lang]}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="sp-lg-sr-stage">
        {!webglReady ? (
          <div className="sp-lg-panel sp-lg-sr-fallback" role="status">
            <span className="sp-lg-np-k">
              {isVi
                ? "WEBGL KHÔNG KHẢ DỤNG · GARAGE 2 XE 2026 GRID"
                : "WEBGL FALLBACK ACTIVE · 2026 GRID 2-CAR GARAGE"}
            </span>
            <h2>
              FP-04 RB · {team.name} (#{team.carNumbers.bay1} · #
              {team.carNumbers.bay2})
            </h2>
            <p>
              {isVi
                ? "Môi trường hiện tại chưa bật WebGL. Bạn vẫn có thể chuyển đầy đủ 11 đội đua 2026, 2 khoang xe và thông số kiểm tra kỹ thuật bên dưới."
                : "Hardware WebGL is unavailable in this environment. All 11 2026 team liveries, two-bay car metadata, and inspection specs remain interactive below."}
            </p>
          </div>
        ) : showroomLoadState === "loading" ? (
          <div className="sp-lg-panel sp-lg-sr-loading" role="status">
            {isVi
              ? "ĐANG NẠP GARAGE 2 XE FP-04 RB..."
              : "LOADING DUAL-CAR FP-04 RB GARAGE..."}
          </div>
        ) : null}
      </div>

      <div className="sp-lg-sr-dock">
        {showPartCallout && (
          <aside
            className="sp-lg-panel sp-lg-sr-callout"
            aria-label={selectedPart.label[lang]}
          >
            <div className="sp-lg-sr-callout-head">
              <span className="sp-lg-np-k">
                {selectedPart.supported
                  ? "3D MESH HIGHLIGHT"
                  : "UNSUPPORTED SPEC"}{" "}
                · 0{selectedPartIndex + 1} / {INSPECTION_PARTS.length}
              </span>
              {partInfoPinned && (
                <button
                  type="button"
                  className="sp-lg-sr-close"
                  aria-label={
                    isVi ? "Đóng chi tiết bộ phận" : "Dismiss part card"
                  }
                  onClick={() => {
                    setPartInfoPinned(false);
                    onHoverGaragePart(null);
                  }}
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>
            <h3>{selectedPart.label[lang]}</h3>
            <p>{selectedPart.summary[lang]}</p>
            {!selectedPart.supported && selectedPart.unsupportedReason ? (
              <div className="sp-lg-sr-callout-note is-warn">
                {selectedPart.unsupportedReason[lang]}
              </div>
            ) : (
              <div className="sp-lg-sr-callout-note">
                BAY 1 · #{team.carNumbers.bay1} ·{" "}
                {selectedPart.nodeName ?? "FP-04 RB"}
              </div>
            )}
          </aside>
        )}

        {garageMode === "maintenance" && (
          <aside
            className="sp-lg-panel sp-lg-sr-callout sp-lg-sr-service"
            aria-label={
              isVi ? "Quy trình bảo dưỡng bánh xe" : "Wheel Service Sequence"
            }
          >
            <div className="sp-lg-sr-callout-head">
              <span className="sp-lg-np-k">
                <Wrench
                  aria-hidden="true"
                  style={{
                    width: 12,
                    height: 12,
                    display: "inline",
                    marginRight: 6,
                  }}
                />
                {isVi
                  ? `BẢO DƯỠNG BÁNH XE · ${garageBayFocus === "bay-2" ? "BAY 2" : "BAY 1"}`
                  : `WHEEL SERVICE · ${garageBayFocus === "bay-2" ? "BAY 2" : "BAY 1"}`}
              </span>
              <span
                className={`sp-lg-sr-step ${garageMaintenanceState.status === "paused" ? "is-paused" : ""}`}
                data-testid="service-step"
              >
                {garageMaintenanceState.status === "paused"
                  ? `${garageMaintenanceState.step} · ${isVi ? "TẠM DỪNG" : "PAUSED"}`
                  : garageMaintenanceState.step}
              </span>
            </div>
            <p className="sp-lg-sr-stepdesc">
              {garageMaintenanceState.step === "LIFT_CAR" &&
              garageMaintenanceState.stepProgress >= 0.99 &&
              garageMaintenanceState.status === "running"
                ? isVi
                  ? "Đang chờ kỹ thuật viên tới đúng vị trí bánh xe..."
                  : "Waiting for wheel gunner to reach corner..."
                : garageMaintenanceState.status === "paused"
                  ? isVi
                    ? `${stepLabel} — Kéo chuột xoay 360° hoặc nhấn Space để tiếp tục`
                    : `${stepLabel} — Drag to orbit 360° or press Space to resume`
                  : stepLabel}
            </p>
            <div
              className={`sp-lg-sr-progress ${garageMaintenanceState.status === "paused" ? "is-paused" : ""}`}
              aria-hidden="true"
            >
              <span
                style={{
                  width: `${Math.round(garageMaintenanceState.stepProgress * 100)}%`,
                }}
              />
            </div>
            <div className="sp-lg-sr-srvcontrols">
              <div
                className="sp-lg-sr-corners"
                role="group"
                aria-label="Corner selection"
              >
                {GARAGE_CORNERS.map((corner) => (
                  <button
                    key={corner}
                    type="button"
                    aria-pressed={garageMaintenanceState.corner === corner}
                    className={`sp-lg-sr-cbtn ${garageMaintenanceState.corner === corner ? "is-active" : ""}`}
                    onClick={() => onSelectGarageCorner(corner)}
                  >
                    {corner}
                  </button>
                ))}
              </div>
              <div className="sp-lg-sr-srvactions">
                <button
                  type="button"
                  className="sp-lg-sr-cbtn is-primary"
                  disabled={garageMaintenanceState.status === "running"}
                  onClick={onStartGarageMaintenance}
                >
                  <Play aria-hidden="true" style={{ width: 12, height: 12 }} />
                  {garageMaintenanceState.status === "paused"
                    ? isVi
                      ? "Tiếp tục"
                      : "Resume"
                    : isVi
                      ? "Bắt đầu"
                      : "Start"}
                </button>
                <button
                  type="button"
                  aria-pressed={garageMaintenanceState.status === "paused"}
                  className={`sp-lg-sr-cbtn ${
                    garageMaintenanceState.status === "paused"
                      ? "is-paused"
                      : garageMaintenanceState.status === "running"
                        ? "is-pause-ready"
                        : ""
                  }`}
                  disabled={
                    garageMaintenanceState.status !== "running" &&
                    garageMaintenanceState.status !== "paused"
                  }
                  onClick={onPauseGarageMaintenance}
                >
                  <Pause aria-hidden="true" style={{ width: 12, height: 12 }} />
                  {garageMaintenanceState.status === "paused"
                    ? isVi
                      ? "Đã dừng"
                      : "Paused"
                    : isVi
                      ? "Tạm dừng"
                      : "Pause"}
                </button>
                <button
                  type="button"
                  className="sp-lg-sr-cbtn"
                  onClick={onResetGarageMaintenance}
                >
                  <RotateCcw
                    aria-hidden="true"
                    style={{ width: 12, height: 12 }}
                  />
                  {isVi ? "Đặt lại" : "Reset"}
                </button>
              </div>
            </div>
          </aside>
        )}

        <div className="sp-lg-sr-bottom-row">
          <div
            className="sp-lg-panel sp-lg-sr-strip"
            role="group"
            aria-label={
              isVi ? "Kiểm tra chi tiết FP-04 RB" : "FP-04 RB Inspection Parts"
            }
            onMouseLeave={() => onHoverGaragePart(null)}
          >
            {INSPECTION_PARTS.map((part, idx) => {
              const active =
                effectivePartId === part.id &&
                (Boolean(garageHoveredPartId) ||
                  partInfoPinned ||
                  garageMode === "inspection");
              const code = idx + 1 < 10 ? `0${idx + 1}` : String(idx + 1);
              return (
                <button
                  key={part.id}
                  type="button"
                  aria-pressed={active}
                  data-part-id={part.id}
                  title={part.label[lang]}
                  className={`sp-lg-sr-apill ${active ? "is-active" : ""} ${!part.supported ? "is-spec" : ""}`}
                  onMouseEnter={() => onHoverGaragePart(part.id)}
                  onFocus={() => onHoverGaragePart(part.id)}
                  onBlur={() => onHoverGaragePart(null)}
                  onClick={() => {
                    setPartInfoPinned(true);
                    onSelectGaragePart(part.id);
                  }}
                >
                  <span className="sp-lg-sr-anum">{code}</span>
                  <span className="sp-lg-sr-aname">{part.label[lang]}</span>
                </button>
              );
            })}
          </div>

          <div
            className="sp-lg-panel sp-lg-sr-liveries sp-lg-sr-teamsbar"
            role="group"
            aria-label={
              isVi
                ? "11 đội đua F1 2026 trong Garage"
                : "11 F1 2026 Garage Teams"
            }
            data-variant-id={garageVariantId}
            onMouseLeave={() => setHoveredTeamId(null)}
          >
            <div className="sp-lg-panel sp-lg-sr-livmeta">
              <img
                src={getTeamBadgeUrl(metaTeam.id)}
                alt=""
                aria-hidden="true"
                className="sp-lg-sr-teamlogo"
              />
              <span className="sp-lg-sr-livtitle">
                <b>{metaTeam.name.toUpperCase()}</b> · BAY 1 (
                {metaTeam.drivers.bay1}) · BAY 2 ({metaTeam.drivers.bay2})
              </span>
              <span className="sp-lg-sr-livtag">
                {metaTeam.id === team.id && activeVariantMeta.asymmetricSplit
                  ? "L/R SPLIT"
                  : metaTeam.shortCode}
              </span>
            </div>

            <div className="sp-lg-sr-teamsw">
              {TEAMS_2026.map((t) => {
                const selected = garageTeamId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    title={`${t.name} (#${t.carNumbers.bay1} · #${t.carNumbers.bay2})`}
                    aria-label={`${t.name} (#${t.carNumbers.bay1} · #${t.carNumbers.bay2})`}
                    aria-pressed={selected}
                    data-team-option={t.id}
                    className={`sp-lg-sr-tbtn ${selected ? "is-active" : ""}`}
                    onMouseEnter={() => setHoveredTeamId(t.id)}
                    onFocus={() => setHoveredTeamId(t.id)}
                    onBlur={() => setHoveredTeamId(null)}
                    onClick={() => onSelectGarageTeam(t.id)}
                  >
                    <span
                      className="sp-lg-sr-tdot"
                      style={{
                        background: `linear-gradient(135deg, ${t.zonePaint.nose} 55%, ${t.accentColor} 55%)`,
                      }}
                      aria-hidden="true"
                    />
                    <img
                      src={getTeamBadgeUrl(t.id)}
                      alt=""
                      aria-hidden="true"
                      className="sp-lg-sr-tbadge"
                    />
                    <span className="sp-lg-sr-tcode">{t.shortCode}</span>
                  </button>
                );
              })}

              {team.id === "cadillac" && (
                <div
                  className="sp-lg-sr-variants"
                  data-testid="cadillac-variant-switcher"
                >
                  {prdManifest.availableVariants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      data-variant-option={v.id}
                      aria-pressed={garageVariantId === v.id}
                      className={`sp-lg-sr-cbtn is-cam ${garageVariantId === v.id ? "is-active" : ""}`}
                      onClick={() => onSelectCadillacVariant(v.id)}
                    >
                      {v.id === "cadillac-spa-2026" ? "Spa" : "Debut"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
