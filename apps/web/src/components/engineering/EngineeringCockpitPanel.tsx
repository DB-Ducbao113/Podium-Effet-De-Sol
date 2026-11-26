import React from "react";
import {
  ENGINEERING_COCKPIT_CONTROLS,
  evaluateCockpitTelemetry,
  type EngineeringCockpitControlId,
  type EngineeringCockpitTelemetryAction,
  type EngineeringCockpitTelemetryState,
} from "./engineeringCockpitTelemetry";

export interface EngineeringCockpitPanelProps {
  readonly lang: "en" | "vi";
  readonly state: EngineeringCockpitTelemetryState;
  readonly onDispatch: (action: EngineeringCockpitTelemetryAction) => void;
  readonly onFocusControlPart?: (
    partId: string,
    controlId: EngineeringCockpitControlId,
  ) => void;
}

export const EngineeringCockpitPanel: React.FC<
  EngineeringCockpitPanelProps
> = ({ lang, state, onDispatch, onFocusControlPart }) => {
  const telemetry = evaluateCockpitTelemetry(state);

  return (
    <section
      className="peds-eng-cockpit-tray"
      data-testid="engineering-cockpit-panel"
      aria-label={
        lang === "vi"
          ? "Bảng điều khiển vô-lăng và mô phỏng màn hình OLED buồng lái F1"
          : "F1 steering wheel controls and OLED telemetry simulator"
      }
    >
      {/* 1. 15-LED Shift Array + Interactive OLED Telemetry Strip */}
      <div
        className="peds-eng-cockpit-telemetry"
        data-testid="engineering-cockpit-telemetry"
      >
        <div
          className="peds-eng-shift-leds"
          role="img"
          aria-label={
            lang === "vi"
              ? `Dải đèn sang số: ${telemetry.activeLedCount} trên 15 đèn sáng`
              : `Shift LED array: ${telemetry.activeLedCount} of 15 active`
          }
        >
          {telemetry.shiftLeds.map((led) => (
            <span
              key={led.index}
              className={`peds-eng-shift-led peds-eng-shift-led--${led.band}${led.active ? " peds-eng-shift-led--active" : ""}`}
            />
          ))}
        </div>

        <div className="peds-eng-cockpit-oled">
          <div className="peds-eng-cockpit-gear-group">
            <button
              type="button"
              className="peds-eng-cockpit-gear-btn"
              aria-label={lang === "vi" ? "Giảm số" : "Downshift"}
              disabled={!state.pitLimiter && telemetry.gear <= 1}
              onClick={() => onDispatch({ type: "step-gear", delta: -1 })}
            >
              −
            </button>
            <div className="peds-eng-cockpit-gear-readout">
              <span className="peds-eng-cockpit-gear-label">
                {lang === "vi" ? "SỐ" : "GEAR"}
              </span>
              <strong
                className="peds-eng-cockpit-gear-value"
                data-testid="engineering-cockpit-gear"
              >
                {telemetry.gearLabel}
              </strong>
            </div>
            <button
              type="button"
              className="peds-eng-cockpit-gear-btn"
              aria-label={lang === "vi" ? "Tăng số" : "Upshift"}
              disabled={!state.pitLimiter && telemetry.gear >= 8}
              onClick={() => onDispatch({ type: "step-gear", delta: 1 })}
            >
              +
            </button>
          </div>

          <div className="peds-eng-cockpit-metrics">
            <span
              className="peds-eng-cockpit-rpm"
              data-testid="engineering-cockpit-rpm"
            >
              {telemetry.rpm.toLocaleString("en-US")} RPM
            </span>
            <span
              className="peds-eng-cockpit-speed"
              data-testid="engineering-cockpit-speed"
            >
              {telemetry.speedKmh} km/h
            </span>
          </div>

          <div className="peds-eng-cockpit-badges">
            <button
              type="button"
              className={`peds-eng-cockpit-badge${telemetry.drsStatus === "ACTIVE" ? " peds-eng-cockpit-badge--drs-on" : ""}`}
              aria-pressed={telemetry.drsStatus === "ACTIVE"}
              onClick={() => onDispatch({ type: "toggle-drs" })}
              title={
                lang === "vi"
                  ? "Bật/tắt mô phỏng mở cánh DRS"
                  : "Toggle illustrative DRS flap state"
              }
            >
              DRS {telemetry.drsStatus}
            </button>
            <button
              type="button"
              className={`peds-eng-cockpit-badge${telemetry.pitLimiter ? " peds-eng-cockpit-badge--pit-on" : ""}`}
              aria-pressed={telemetry.pitLimiter}
              onClick={() => onDispatch({ type: "toggle-pit" })}
              title={
                lang === "vi"
                  ? "Bật/tắt giới hạn tốc độ đường pit 80 km/h"
                  : "Toggle 80 km/h pit lane speed limiter"
              }
            >
              PIT 80
            </button>
          </div>
        </div>
      </div>

      {/* 2. Six F1 Steering Wheel Control Zones */}
      <div
        className="peds-eng-cockpit-zones"
        role="group"
        aria-label={
          lang === "vi"
            ? "6 vùng điều khiển trên vô-lăng F1"
            : "6 F1 steering wheel control zones"
        }
      >
        {ENGINEERING_COCKPIT_CONTROLS.map((control) => {
          const active = state.activeControlId === control.id;
          return (
            <button
              key={control.id}
              type="button"
              className={`peds-eng-cockpit-zone${active ? " peds-eng-cockpit-zone--active" : ""}`}
              data-testid={`cockpit-zone-${control.id.toLowerCase()}`}
              aria-pressed={active}
              onClick={() => {
                onDispatch({ type: "select-control", controlId: control.id });
                onFocusControlPart?.(control.partId, control.id);
              }}
            >
              {control.shortCode}
            </button>
          );
        })}
      </div>

      {/* 3. Active Control Zone Technical Readout */}
      <div
        className="peds-eng-cockpit-detail"
        data-testid="engineering-cockpit-detail"
      >
        <div className="peds-eng-cockpit-detail__head">
          <strong className="peds-eng-cockpit-detail__title">
            {telemetry.activeControl.label[lang]}
          </strong>
          <span className="peds-eng-cockpit-detail__dial">
            {telemetry.activeControl.dialSetting[lang]}
          </span>
        </div>
        <p className="peds-eng-cockpit-detail__summary">
          {telemetry.activeControl.summary[lang]}
        </p>
        <p className="peds-eng-cockpit-detail__disclaimer">
          {lang === "vi"
            ? `${telemetry.ersMode.vi} · Mô phỏng nguyên lý vô-lăng F1 (không phải dữ liệu đội đua chính thức)`
            : `${telemetry.ersMode.en} · Illustrative F1 steering logic (not official team telemetry)`}
        </p>
      </div>
    </section>
  );
};
