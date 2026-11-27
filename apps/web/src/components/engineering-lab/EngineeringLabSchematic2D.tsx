import React, { useId } from "react";
import type { LabModeId } from "./engineeringLabRoutes";
import {
  INITIAL_LAB_SIMULATOR_STATE,
  evaluateLabTelemetry,
  type LabSimulatorState,
  type LabTelemetryEvaluation,
} from "./labSimulatorEngine";

export interface EngineeringLabSchematic2DProps {
  readonly mode: LabModeId;
  readonly lang: "vi" | "en";
  readonly reducedMotion: boolean;
  readonly state?: LabSimulatorState;
  readonly telemetry?: LabTelemetryEvaluation;
  readonly compact?: boolean;
}

export const EngineeringLabSchematic2D: React.FC<
  EngineeringLabSchematic2DProps
> = ({ mode, lang, reducedMotion, state, telemetry, compact = false }) => {
  const activeState = state ?? { ...INITIAL_LAB_SIMULATOR_STATE, mode };
  const activeTelemetry = telemetry ?? evaluateLabTelemetry(activeState);
  const isVi = lang === "vi";
  const rawUid = useId();
  const venturiGradId = `venturiSuctionGrad-${rawUid.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const wingDeg = activeState.wingAngleDeg;
  const rideMm = activeState.rideHeightMm;
  const floorOffsetY = ((24 - rideMm) / 15) * 8;
  const loadG = activeState.lateralLoadG;
  const rollDeg = (activeTelemetry.chassisRollRad * 180) / Math.PI;
  const dashAnim = reducedMotion ? undefined : "pedsSchematicDash 2.2s linear infinite";

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden"
      data-testid={`engineering-schematic-${mode}`}
    >
      <style>{`
        @keyframes pedsSchematicDash {
          from { stroke-dashoffset: 48; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      {mode === "ground-effect" && (
        <svg
          viewBox="0 0 640 280"
          className="h-full w-full"
          role="img"
          aria-label={
            isVi
              ? "Sơ đồ trường áp suất sàn Venturi và bộ khuếch tán"
              : "Venturi underfloor airflow and diffuser pressure schematic"
          }
        >
          <defs>
            <linearGradient id={venturiGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D9F5" stopOpacity="0.06" />
              <stop
                offset="46%"
                stopColor={activeTelemetry.stallRiskWarning ? "#FF4938" : "#00D9F5"}
                stopOpacity={0.18 + (activeTelemetry.suctionIndexPct / 100) * 0.42}
              />
              <stop offset="100%" stopColor="#00D9F5" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Ground asphalt datum */}
          <line x1="36" y1="226" x2="604" y2="226" stroke="#202730" strokeWidth="2" />
          <rect
            x="148"
            y="184"
            width="340"
            height="42"
            fill={`url(#${venturiGradId})`}
          />

          {/* Car Side Silhouette & Venturi Tunnel */}
          <g transform={`translate(0, ${floorOffsetY.toFixed(1)})`}>
            <path
              d="M78 188 L152 174 L242 132 L386 128 L496 154 L548 118 L568 118 L556 172 L528 176 L464 204 L268 210 L142 198 Z"
              fill="#11151B"
              stroke="#E9EDF2"
              strokeOpacity="0.52"
              strokeWidth="1.6"
            />
            {/* Venturi Throat & Diffuser Kickline */}
            <path
              d="M138 198 Q272 214 344 212 Q442 210 526 174"
              fill="none"
              stroke={activeTelemetry.stallRiskWarning ? "#FF4938" : "#00D9F5"}
              strokeWidth="2.6"
            />
            <circle cx="164" cy="196" r="24" fill="#080A0D" stroke="#A7B2C2" strokeWidth="1.5" />
            <circle cx="478" cy="196" r="26" fill="#080A0D" stroke="#A7B2C2" strokeWidth="1.5" />
          </g>

          {/* Underfloor Accelerated Streamlines */}
          {[0, 1, 2].map((idx) => (
            <path
              key={idx}
              d={`M48 ${196 + idx * 8} C180 ${204 + idx * 5}, 320 ${216 - idx * 2}, 588 ${168 + idx * 12}`}
              fill="none"
              stroke={
                activeTelemetry.stallRiskWarning && idx === 0
                  ? "#FF4938"
                  : "#00D9F5"
              }
              strokeWidth={idx === 1 ? "2" : "1.2"}
              strokeDasharray="10 6"
              style={{ animation: dashAnim }}
            />
          ))}

          {!compact && (
            <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#A7B2C2">
              <text x="52" y="42" fill="#00D9F5">
                {isVi
                  ? "HÌNH 01 — HỌNG HÚT VENTURI & PHỤC HỒI KHUẾCH TÁN"
                  : "FIG. 01 — VENTURI THROAT & DIFFUSER RECOVERY"}
              </text>
              <text x="52" y="252">
                {isVi
                  ? `KHOẢNG SÁNG GẦM: ${rideMm} MM · CHỈ SỐ HÚT: ${activeTelemetry.suctionIndexPct}%`
                  : `CLEARANCE: ${rideMm} MM · SUCTION INDEX: ${activeTelemetry.suctionIndexPct}%`}
              </text>
              <text
                x={isVi ? "376" : "412"}
                y="252"
                fill={activeTelemetry.stallRiskWarning ? "#FF4938" : "#E9EDF2"}
              >
                {activeTelemetry.stallRiskWarning
                  ? isVi
                    ? "CẢNH BÁO NGHẼN DÒNG / DẬP DỀNH"
                    : "STALL / PORPOISING WARNING"
                  : isVi
                    ? "LUỒNG KHUẾCH TÁN BÁM DÍNH"
                    : "ATTACHED DIFFUSER PLUME"}
              </text>
            </g>
          )}
        </svg>
      )}

      {mode === "active-aero" && (
        <svg
          viewBox="0 0 640 280"
          className="h-full w-full"
          role="img"
          aria-label={
            isVi
              ? "Sơ đồ góc tấn cánh gió chủ động và cơ cấu chấp hành"
              : "Active aerodynamics dual-element wing angle schematic"
          }
        >
          {/* Mainplane fixed carbon section */}
          <path
            d="M148 164 C216 184, 308 186, 368 166 C322 154, 232 150, 148 164 Z"
            fill="#11151B"
            stroke="#E9EDF2"
            strokeWidth="1.8"
          />

          {/* CNC Actuator Linkage & Pivot */}
          <circle cx="378" cy="154" r="6" fill="#080A0D" stroke="#00D9F5" strokeWidth="2" />
          <line
            x1="286"
            y1="122"
            x2="404"
            y2={146 - (wingDeg / 35) * 26}
            stroke="#FF4938"
            strokeWidth="2.2"
          />

          {/* Movable Upper Flap rotating live with wingAngleDeg (0..35°) */}
          <g transform={`rotate(${-(wingDeg - 8) * 0.92} 378 154)`}>
            <path
              d="M372 154 C422 162, 478 156, 512 138 C474 130, 418 134, 372 154 Z"
              fill="#202730"
              stroke="#00D9F5"
              strokeWidth="2.2"
            />
          </g>

          {/* Dynamic Airflow Streamlines */}
          {[-28, -8, 14, 34].map((offsetY, i) => {
            const exitLift = (wingDeg / 35) * 42;
            return (
              <path
                key={offsetY}
                d={`M54 ${146 + offsetY} C210 ${152 + offsetY}, 370 ${158 + offsetY * 0.7}, 592 ${144 + offsetY - exitLift}`}
                fill="none"
                stroke="#00D9F5"
                strokeOpacity={i === 1 || i === 2 ? 0.92 : 0.45}
                strokeWidth={i === 1 ? "2.1" : "1.2"}
                strokeDasharray="12 6"
                style={{ animation: dashAnim }}
              />
            );
          })}

          {!compact && (
            <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#A7B2C2">
              <text x="52" y="42" fill="#00D9F5">
                {isVi
                  ? "HÌNH 02 — CÁNH ĐA TẦNG & ĐỘNG HỌC CƠ CẤU CHẤP HÀNH"
                  : "FIG. 02 — MULTI-ELEMENT WING & ACTUATOR KINEMATICS"}
              </text>
              <text x="52" y="250">
                {isVi ? "GÓC CÁNH" : "FLAP ANGLE"}: {wingDeg}° ·{" "}
                {isVi ? "ĐỘ MỞ KHE" : "SLOT RATIO"}:{" "}
                {Math.round(activeTelemetry.slotGapOpenRatio * 100)}%
              </text>
              <text x={isVi ? "366" : "404"} y="250" fill="#E9EDF2">
                {isVi ? "LỰC ÉP" : "DF"}:{" "}
                {activeTelemetry.downforceTendency.label[lang].toUpperCase()} ·{" "}
                {isVi ? "LỰC CẢN" : "DRAG"}:{" "}
                {activeTelemetry.dragTendency.label[lang].toUpperCase()}
              </text>
            </g>
          )}
        </svg>
      )}

      {mode === "hybrid-powertrain" && (
        <svg
          viewBox="0 0 640 280"
          className="h-full w-full"
          role="img"
          aria-label={
            isVi
              ? "Sơ đồ truyền dẫn năng lượng Hybrid V6, Pin ES, Inverter và MGU-K"
              : "Hybrid powertrain energy flow schematic between V6, ES battery, MGU-K and rear axle"
          }
        >
          {/* Chassis spine outline */}
          <rect
            x="108"
            y="68"
            width="424"
            height="144"
            rx="28"
            fill="#0B0E13"
            stroke="#202730"
            strokeWidth="1.5"
          />

          {/* Functional Power Unit Blocks */}
          <rect x="136" y="106" width="108" height="68" rx="10" fill="#11151B" stroke="#00D9F5" strokeWidth="1.6" />
          <rect x="274" y="92" width="112" height="96" rx="10" fill="#11151B" stroke="#E9EDF2" strokeOpacity="0.45" strokeWidth="1.6" />
          <rect x="414" y="108" width="88" height="64" rx="10" fill="#11151B" stroke={activeTelemetry.rearRainLightHarvesting ? "#FF4938" : "#00D9F5"} strokeWidth="1.8" />

          {/* Rear Driven Wheels */}
          <rect x="492" y="52" width="46" height="26" rx="5" fill="#202730" stroke="#A7B2C2" />
          <rect x="492" y="202" width="46" height="26" rx="5" fill="#202730" stroke="#A7B2C2" />

          {/* High-Voltage Energy Conduits */}
          <path
            d={
              activeTelemetry.rearRainLightHarvesting
                ? "M515 78 L515 140 L414 140 L244 140"
                : "M244 140 L414 140 L515 140 L515 78"
            }
            fill="none"
            stroke={activeTelemetry.rearRainLightHarvesting ? "#FF4938" : "#00D9F5"}
            strokeWidth="3"
            strokeDasharray="10 6"
            style={{ animation: dashAnim }}
          />
          <path
            d={
              activeTelemetry.rearRainLightHarvesting
                ? "M515 202 L515 140"
                : "M515 140 L515 202"
            }
            fill="none"
            stroke={activeTelemetry.rearRainLightHarvesting ? "#FF4938" : "#00D9F5"}
            strokeWidth="3"
            strokeDasharray="10 6"
            style={{ animation: dashAnim }}
          />

          {/* Rear FIA Harvesting Rain LED */}
          <circle
            cx="548"
            cy="140"
            r="6"
            fill={activeTelemetry.rearRainLightHarvesting ? "#FF4938" : "#202730"}
          />

          <g fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="#E9EDF2">
            <text x="152" y="136">
              {isVi ? "PIN LƯU TRỮ" : "ENERGY STORE"}
            </text>
            <text x="152" y="152" fill="#00D9F5">
              {isVi ? "ĐIỆN ÁP CAO" : "HV BATTERY"}
            </text>
            <text x="294" y="136">1.6L V6 ICE</text>
            <text x="294" y="152" fill="#A7B2C2">
              {isVi ? "ĐỐT TRONG" : "COMBUSTION"}
            </text>
            <text x="430" y="136">MGU-K</text>
            <text x="430" y="152" fill={activeTelemetry.rearRainLightHarvesting ? "#FF4938" : "#00D9F5"}>
              {isVi
                ? activeState.hybridRegime === "deploy"
                  ? "XẢ ĐIỆN"
                  : activeState.hybridRegime === "harvest"
                    ? "THU HỒI"
                    : "CÂN BẰNG"
                : activeState.hybridRegime.toUpperCase()}
            </text>
          </g>

          {!compact && (
            <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#A7B2C2">
              <text x="52" y="42" fill="#00D9F5">
                {isVi
                  ? "HÌNH 03 — VÒNG LẶP NĂNG LƯỢNG HYBRID KHÉP KÍN"
                  : "FIG. 03 — SUPERVISORY HYBRID ENERGY LOOP"}
              </text>
              <text x="52" y="254">
                {isVi ? "CHẾ ĐỘ" : "MODE"}:{" "}
                {isVi
                  ? activeState.hybridRegime === "deploy"
                    ? "XẢ ĐIỆN"
                    : activeState.hybridRegime === "harvest"
                      ? "THU HỒI"
                      : "CÂN BẰNG"
                  : activeState.hybridRegime.toUpperCase()}{" "}
                · {isVi ? "TỶ TRỌNG MGU-K" : "MGU-K ALLOCATION"}:{" "}
                {activeTelemetry.mguKSharePct}%
              </text>
            </g>
          )}
        </svg>
      )}

      {mode === "vehicle-dynamics" && (
        <svg
          viewBox="0 0 640 280"
          className="h-full w-full"
          role="img"
          aria-label={
            isVi
              ? "Sơ đồ động học hệ thống treo, tâm lăn và phân bổ tải lốp"
              : "Vehicle dynamics suspension roll-centre and contact-patch load schematic"
          }
        >
          <line x1="60" y1="218" x2="580" y2="218" stroke="#202730" strokeWidth="2" />

          {/* Left & Right Slick Tyres */}
          <rect x="116" y="134" width="48" height="84" rx="8" fill="#11151B" stroke="#E9EDF2" strokeWidth="1.6" />
          <rect x="476" y="134" width="48" height="84" rx="8" fill="#11151B" stroke="#00D9F5" strokeWidth="2" />

          {/* Contact Patch Vertical Load Vectors */}
          <ellipse
            cx="140"
            cy="218"
            rx={16 - loadG * 1.4}
            ry="5"
            fill="#00D9F5"
            fillOpacity="0.35"
          />
          <ellipse
            cx="500"
            cy="218"
            rx={18 + loadG * 3.4}
            ry="6.5"
            fill={loadG >= 4.0 ? "#FF4938" : "#00D9F5"}
            fillOpacity="0.72"
          />

          {/* Sprung Monocoque + Double Wishbones Rolling Dynamically */}
          <g transform={`rotate(${(rollDeg * 2.4).toFixed(2)} 320 168)`}>
            {/* Upper & Lower Carbon Wishbones */}
            <line x1="164" y1="150" x2="266" y2="142" stroke="#A7B2C2" strokeWidth="2.2" />
            <line x1="164" y1="194" x2="266" y2="188" stroke="#A7B2C2" strokeWidth="2.2" />
            <line x1="476" y1="150" x2="374" y2="142" stroke="#00D9F5" strokeWidth="2.4" />
            <line x1="476" y1="194" x2="374" y2="188" stroke="#00D9F5" strokeWidth="2.4" />
            {/* Pushrod diagonals */}
            <line x1="164" y1="192" x2="274" y2="128" stroke="#FF4938" strokeWidth="1.8" />
            <line x1="476" y1="192" x2="366" y2="128" stroke="#00D9F5" strokeWidth="1.8" />

            {/* Survival Cell Bulkhead */}
            <rect
              x="266"
              y="118"
              width="108"
              height="76"
              rx="14"
              fill="#11151B"
              stroke="#E9EDF2"
              strokeWidth="1.8"
            />
            <circle cx="320" cy="156" r="5" fill="#FF4938" />
          </g>

          {/* Instantaneous Roll-Centre Datum */}
          <circle cx="320" cy="196" r="4.5" fill="#00D9F5" />

          {!compact && (
            <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#A7B2C2">
              <text x="52" y="42" fill="#00D9F5">
                {isVi
                  ? "HÌNH 04 — ĐỘNG HỌC TAY ĐÒN KÉP & CHUYỂN DỊCH TẢI LỐP"
                  : "FIG. 04 — WISHBONE KINEMATICS & LOAD TRANSFER"}
              </text>
              <text x="52" y="252">
                {isVi ? "TẢI GIA TỐC" : "LOAD"}: {loadG.toFixed(1)} G ·{" "}
                {isVi ? "LỐP NGOÀI" : "OUTSIDE PATCH"}:{" "}
                {activeTelemetry.outsideTireLoadSharePct}% ·{" "}
                {isVi ? "TRỤC TRƯỚC" : "FRONT AXLE"}:{" "}
                {activeTelemetry.frontAxleSharePct}%
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  );
};
