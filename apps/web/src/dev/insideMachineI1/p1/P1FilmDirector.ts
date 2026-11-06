/** Isolated pure math: avoid import cycles with pilotMotion.ts. */
function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function smoothProgress(value: number): number {
  const t = clampProgress(value);
  return t * t * (3 - 2 * t);
}

/**
 * P1.7 — one deterministic, reversible lighting / lens director.
 * No independent timers, framewise accumulating deltas, shaders with fake
 * telemetry, or unrelated particles. All cue changes are driven by the
 * exact same normalized progress that drives the R4.5 wheel components.
 */
export interface P1FilmLook {
  fov: number;
  exposure: number;
  key: number;
  ambient: number;
  hemisphere: number;
  warmRim: number;
  coolRim: number;
  vignette: number;
}

type FilmCue = { at: number; look: P1FilmLook };

const CUES: readonly FilmCue[] = [
  {
    at: 0,
    look: {
      fov: 35.5, exposure: 1.12, key: 3.50, ambient: 0.78,
      hemisphere: 1.80, warmRim: 2.55, coolRim: 2.45, vignette: 0.20,
    },
  },
  {
    at: 0.18,
    look: {
      fov: 33.0, exposure: 1.18, key: 3.85, ambient: 0.90,
      hemisphere: 2.05, warmRim: 2.75, coolRim: 2.75, vignette: 0.22,
    },
  },
  {
    at: 0.40,
    look: {
      fov: 34.0, exposure: 1.21, key: 4.10, ambient: 0.96,
      hemisphere: 2.12, warmRim: 2.20, coolRim: 3.05, vignette: 0.15,
    },
  },
  {
    at: 0.54,
    look: {
      fov: 35.5, exposure: 1.15, key: 3.95, ambient: 1.03,
      hemisphere: 2.20, warmRim: 1.35, coolRim: 2.70, vignette: 0.09,
    },
  },
  {
    at: 0.69,
    look: {
      fov: 34.0, exposure: 1.04, key: 2.85, ambient: 1.45,
      hemisphere: 2.45, warmRim: 0.15, coolRim: 1.15, vignette: 0,
    },
  },
  {
    at: 0.80,
    look: {
      fov: 32.5, exposure: 1.07, key: 3.10, ambient: 1.48,
      hemisphere: 2.45, warmRim: 0.05, coolRim: 1.25, vignette: 0,
    },
  },
  {
    at: 0.86,
    look: {
      fov: 33.0, exposure: 1.09, key: 3.20, ambient: 1.35,
      hemisphere: 2.35, warmRim: 0.20, coolRim: 1.35, vignette: 0.025,
    },
  },
  {
    at: 1,
    look: {
      fov: 35.5, exposure: 1.12, key: 3.50, ambient: 0.78,
      hemisphere: 1.80, warmRim: 2.55, coolRim: 2.45, vignette: 0.20,
    },
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function filmLookAt(value: number): P1FilmLook {
  const progress = clampProgress(value);
  let index = 0;
  while (index < CUES.length - 2 && progress > CUES[index + 1].at) index++;
  const first = CUES[index];
  const next = CUES[index + 1];
  const amount = smoothProgress((progress - first.at) / (next.at - first.at));
  const blend = (key: keyof P1FilmLook) => lerp(first.look[key], next.look[key], amount);
  return {
    fov: blend('fov'),
    exposure: blend('exposure'),
    key: blend('key'),
    ambient: blend('ambient'),
    hemisphere: blend('hemisphere'),
    warmRim: blend('warmRim'),
    coolRim: blend('coolRim'),
    vignette: blend('vignette'),
  };
}

/**
 * The cinematic camera should not stop at every chapter marker.
 * Nonuniform Hermite interpolation preserves a continuous tangent between
 * keyframes. Tangents are damped by 0.72 to avoid uncontrolled overshoot
 * around small hardware; the first and last frame settle deliberately.
 */
export function continuousFilmPoint(
  values: readonly (readonly [number, number, number])[],
  times: readonly number[],
  progress: number,
): [number, number, number] {
  if (values.length !== times.length || values.length < 2) {
    throw new Error('P1 film spline needs matching positions and timeline anchors');
  }
  const p = clampProgress(progress);
  let segment = 0;
  while (segment < times.length - 2 && p > times[segment + 1]) segment++;
  const start = values[segment];
  const end = values[segment + 1];
  const duration = times[segment + 1] - times[segment];
  if (!(duration > 0)) throw new Error('P1 film spline anchors must be increasing');
  const t = Math.max(0, Math.min(1, (p - times[segment]) / duration));

  const derivative = (index: number, axis: number): number => {
    if (index === 0 || index === values.length - 1) return 0;
    const denominator = times[index + 1] - times[index - 1];
    return denominator > 0
      ? 0.72 * (values[index + 1][axis] - values[index - 1][axis]) / denominator
      : 0;
  };

  // Cubic Hermite basis, C1 across the interior anchors, seekable both ways.
  const tt = t * t;
  const ttt = tt * t;
  const h00 = 2 * ttt - 3 * tt + 1;
  const h10 = ttt - 2 * tt + t;
  const h01 = -2 * ttt + 3 * tt;
  const h11 = ttt - tt;

  return [0, 1, 2].map((axis) =>
    h00 * start[axis] +
    h10 * duration * derivative(segment, axis) +
    h01 * end[axis] +
    h11 * duration * derivative(segment + 1, axis),
  ) as [number, number, number];
}
