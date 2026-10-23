import { describe, expect, it } from 'vitest';
import { FrameMetricsCollector } from './frameMetrics';

describe('FrameMetricsCollector', () => {
  it('reports frame percentiles and excludes invalid gaps', () => {
    const collector = new FrameMetricsCollector(5_000);
    for (let index = 0; index < 100; index += 1) collector.record(index * 16.7, 16.7, true);
    collector.record(2_000, 500, false);
    const result = collector.snapshot(60);
    expect(result.validFrameCount).toBe(100);
    expect(result.frameTimeP50Ms).toBeCloseTo(16.7);
    expect(result.frameTimeP95Ms).toBeCloseTo(16.7);
    expect(result.averageFps).toBeGreaterThan(59);
  });
});
