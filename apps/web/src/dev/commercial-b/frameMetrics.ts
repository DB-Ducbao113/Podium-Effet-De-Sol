export interface FrameMetrics {
  averageFps: number;
  medianFps: number;
  onePercentLowFps: number;
  frameTimeP50Ms: number;
  frameTimeP95Ms: number;
  spikeCount: number;
  validFrameCount: number;
}

const percentile = (values: number[], ratio: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))];
};

export class FrameMetricsCollector {
  private frames: Array<{ atMs: number; deltaMs: number }> = [];
  constructor(private readonly retentionMs = 5_000) {}

  record(atMs: number, deltaMs: number, valid: boolean) {
    if (valid && Number.isFinite(deltaMs) && deltaMs > 0 && deltaMs < 250) {
      this.frames.push({ atMs, deltaMs });
    }
    const cutoff = atMs - this.retentionMs;
    while (this.frames.length && this.frames[0].atMs < cutoff) this.frames.shift();
  }

  reset() {
    this.frames = [];
  }

  snapshot(refreshRateHz = 60): FrameMetrics {
    const values = this.frames.map(({ deltaMs }) => deltaMs);
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const p50 = percentile(values, 0.5);
    const p95 = percentile(values, 0.95);
    const p99 = percentile(values, 0.99);
    const budget = 1000 / Math.min(60, Math.max(30, refreshRateHz));
    return {
      averageFps: mean ? 1000 / mean : 0,
      medianFps: p50 ? 1000 / p50 : 0,
      onePercentLowFps: p99 ? 1000 / p99 : 0,
      frameTimeP50Ms: p50,
      frameTimeP95Ms: p95,
      spikeCount: values.filter((value) => value > budget * 1.5).length,
      validFrameCount: values.length,
    };
  }
}
