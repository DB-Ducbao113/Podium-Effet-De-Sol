import NumberFlow, { NumberFlowGroup, type Format } from "@number-flow/react";

export interface OdometerNumberProps {
  readonly value: number;
  readonly reducedMotion: boolean;
  readonly format?: Format;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly className?: string;
  readonly locales?: Intl.LocalesArgument;
}

/**
 * FX-03a — Rolling odometer numeric display powered by @number-flow/react.
 * Uses tabular-nums and zero layout shift; degrades cleanly under reducedMotion or SSR.
 */
export function OdometerNumber({
  value,
  reducedMotion,
  format,
  prefix,
  suffix,
  className = "",
  locales = "en-US",
}: OdometerNumberProps) {
  return (
    <span
      className={`sm-odometer ${className}`.trim()}
      data-fx="FX-03"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <NumberFlow
        value={value}
        locales={locales}
        format={format}
        prefix={prefix}
        suffix={suffix}
        animated={!reducedMotion}
        respectMotionPreference={true}
        transformTiming={{
          duration: reducedMotion ? 0 : 460,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        spinTiming={{
          duration: reducedMotion ? 0 : 520,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </span>
  );
}

export interface CountdownOdometerProps {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly reducedMotion: boolean;
  readonly className?: string;
}

const TWO_DIGIT_FORMAT: Format = {
  minimumIntegerDigits: 2,
  useGrouping: false,
};

/**
 * FX-03b — Synchronized rolling-digit F1 countdown (`DD : HH : MM : SS`).
 */
export function CountdownOdometer({
  days,
  hours,
  minutes,
  seconds,
  reducedMotion,
  className = "",
}: CountdownOdometerProps) {
  return (
    <NumberFlowGroup>
      <span
        className={`sm-countdown-odometer ${className}`.trim()}
        data-fx="FX-03"
        aria-label={`${String(days).padStart(2, "0")}D ${String(hours).padStart(2, "0")}H ${String(minutes).padStart(2, "0")}M ${String(seconds).padStart(2, "0")}S`}
      >
        <span className="sm-countdown-seg">
          <OdometerNumber
            value={days}
            reducedMotion={reducedMotion}
            format={TWO_DIGIT_FORMAT}
          />
          <em className="sm-countdown-unit">D</em>
        </span>
        <span className="sm-countdown-seg">
          <OdometerNumber
            value={hours}
            reducedMotion={reducedMotion}
            format={TWO_DIGIT_FORMAT}
          />
          <em className="sm-countdown-unit">H</em>
        </span>
        <span className="sm-countdown-seg">
          <OdometerNumber
            value={minutes}
            reducedMotion={reducedMotion}
            format={TWO_DIGIT_FORMAT}
          />
          <em className="sm-countdown-unit">M</em>
        </span>
        <span className="sm-countdown-seg">
          <OdometerNumber
            value={seconds}
            reducedMotion={reducedMotion}
            format={TWO_DIGIT_FORMAT}
          />
          <em className="sm-countdown-unit">S</em>
        </span>
      </span>
    </NumberFlowGroup>
  );
}
