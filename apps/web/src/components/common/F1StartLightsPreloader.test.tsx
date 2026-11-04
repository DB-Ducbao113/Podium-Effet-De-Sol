import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { F1StartLightsPreloader } from './F1StartLightsPreloader';
import {
  getStartLightsFrame,
  START_LIGHT_CUE,
  START_LIGHT_TIMING,
  START_LIGHT_TIMING_2X,
  START_LIGHT_TIMING_3X,
  getIntroTiming,
} from './startLightsTiming';
import { isDocumentReload } from './documentReload';

describe('F1StartLightsPreloader', () => {
  it('renders the unchanged animation when the document controller mounts it', () => {
    const html = renderToStaticMarkup(<F1StartLightsPreloader />);
    expect(html).toContain('F1 Start Lights Preloader');
    expect(html).toContain('PREPARING GRID...');
    expect(html.match(/data-testid="start-light"/g)).toHaveLength(10);
  });

  it.each([
    ['navigate', false],
    ['back_forward', false],
    ['prerender', false],
    ['reload', true],
  ])('recognizes navigation type %s as reload = %s', (type, expected) => {
    const timing = {
      getEntriesByType: () => [{ entryType: 'navigation', type }],
    } as unknown as Pick<Performance, 'getEntriesByType'>;
    expect(isDocumentReload(timing)).toBe(expected);
  });

  it('fails closed when navigation timing is missing, ambiguous or throws', () => {
    expect(isDocumentReload(undefined)).toBe(false);
    expect(
      isDocumentReload({ getEntriesByType: () => [] } as Pick<Performance, 'getEntriesByType'>),
    ).toBe(false);
    expect(
      isDocumentReload({
        getEntriesByType: () => [
          { entryType: 'navigation', type: 'reload' },
          { entryType: 'navigation', type: 'reload' },
        ],
      } as unknown as Pick<Performance, 'getEntriesByType'>),
    ).toBe(false);
    expect(
      isDocumentReload({
        getEntriesByType: () => [{ entryType: 'resource', type: 'reload' }],
      } as unknown as Pick<Performance, 'getEntriesByType'>),
    ).toBe(false);
    expect(
      isDocumentReload({
        getEntriesByType: () => {
          throw new Error('timing unavailable');
        },
      }),
    ).toBe(false);
  });

  it.each([
    [0, 'awakening', 0],
    [999, 'awakening', 0],
    [1000, 'pressure', 1],
    [1499, 'pressure', 1],
    [1500, 'pressure', 2],
    [2000, 'pressure', 3],
    [2500, 'pressure', 4],
    [2999, 'pressure', 4],
    [3000, 'hold', 5],
    [3999, 'hold', 5],
    [4000, 'lights-out', 0],
    [4399, 'lights-out', 0],
    [4400, 'launch', 0],
    [4999, 'launch', 0],
    [5000, 'launch', 0],
    [5600, 'launch', 0],
    [6199, 'launch', 0],
    [6200, 'complete', 0],
    [60000, 'complete', 0],
  ])('at %d ms shows %s with %d red columns in 1x baseline', (time, phase, litColumns) => {
    expect(getStartLightsFrame(time)).toEqual({ phase, litColumns });
  });

  it('keeps the complete start call', () => {
    expect(START_LIGHT_CUE).toBe("IT'S LIGHTS OUT AND AWAY WE GO!");
  });

  it('keeps the overlay mounted through the logo hold and entire reveal in 1x', () => {
    const revealEnds =
      START_LIGHT_TIMING.launchMs +
      START_LIGHT_TIMING.logoHoldMs +
      START_LIGHT_TIMING.revealDurationMs;
    expect(revealEnds).toBe(START_LIGHT_TIMING.totalMs);
    expect(getStartLightsFrame(revealEnds - 1).phase).toBe('launch');
    expect(getStartLightsFrame(revealEnds).phase).toBe('complete');
  });

  describe('Variant A — 2x Speed Optimization', () => {
    it('provides generous readability duration', () => {
      expect(START_LIGHT_TIMING_2X.totalMs).toBe(4250);
      expect(START_LIGHT_TIMING_2X.launchMs - START_LIGHT_TIMING_2X.lightsOutMs).toBe(900);
      expect(START_LIGHT_TIMING_2X.logoHoldMs).toBe(950);
    });

    it('progresses smoothly through all 5 lights, hold, lights-out, and launch', () => {
      const timing = START_LIGHT_TIMING_2X;
      expect(getStartLightsFrame(0, timing)).toEqual({ phase: 'awakening', litColumns: 0 });
      expect(getStartLightsFrame(timing.firstLightMs, timing)).toEqual({ phase: 'pressure', litColumns: 1 });
      expect(getStartLightsFrame(timing.firstLightMs + timing.lightIntervalMs, timing)).toEqual({ phase: 'pressure', litColumns: 2 });
      expect(getStartLightsFrame(timing.holdMs - 1, timing)).toEqual({ phase: 'pressure', litColumns: 4 });
      expect(getStartLightsFrame(timing.holdMs, timing)).toEqual({ phase: 'hold', litColumns: 5 });
      expect(getStartLightsFrame(timing.lightsOutMs, timing)).toEqual({ phase: 'lights-out', litColumns: 0 });
      expect(getStartLightsFrame(timing.launchMs, timing)).toEqual({ phase: 'launch', litColumns: 0 });
      expect(getStartLightsFrame(timing.totalMs, timing)).toEqual({ phase: 'complete', litColumns: 0 });
    });

    it('has totalMs equal to launchMs + logoHoldMs + revealDurationMs', () => {
      const expected = START_LIGHT_TIMING_2X.launchMs + START_LIGHT_TIMING_2X.logoHoldMs + START_LIGHT_TIMING_2X.revealDurationMs;
      expect(START_LIGHT_TIMING_2X.totalMs).toBe(expected);
    });
  });

  describe('Variant B — 3x Speed Optimization (Preferred Candidate)', () => {
    it('provides clear cue and brand readability with snappy lights sequence', () => {
      expect(START_LIGHT_TIMING_3X.totalMs).toBe(3350);
      // Lights out cue readable for 700ms
      expect(START_LIGHT_TIMING_3X.launchMs - START_LIGHT_TIMING_3X.lightsOutMs).toBe(700);
      // Brand hold readable for 800ms
      expect(START_LIGHT_TIMING_3X.logoHoldMs).toBe(800);
    });

    it('progresses swiftly through all 5 lights, hold, lights-out, and launch', () => {
      const timing = START_LIGHT_TIMING_3X;
      expect(getStartLightsFrame(0, timing)).toEqual({ phase: 'awakening', litColumns: 0 });
      expect(getStartLightsFrame(timing.firstLightMs, timing)).toEqual({ phase: 'pressure', litColumns: 1 });
      expect(getStartLightsFrame(timing.firstLightMs + timing.lightIntervalMs, timing)).toEqual({ phase: 'pressure', litColumns: 2 });
      expect(getStartLightsFrame(timing.holdMs - 1, timing)).toEqual({ phase: 'pressure', litColumns: 4 });
      expect(getStartLightsFrame(timing.holdMs, timing)).toEqual({ phase: 'hold', litColumns: 5 });
      expect(getStartLightsFrame(timing.lightsOutMs, timing)).toEqual({ phase: 'lights-out', litColumns: 0 });
      expect(getStartLightsFrame(timing.launchMs, timing)).toEqual({ phase: 'launch', litColumns: 0 });
      expect(getStartLightsFrame(timing.totalMs, timing)).toEqual({ phase: 'complete', litColumns: 0 });
    });

    it('has totalMs equal to launchMs + logoHoldMs + revealDurationMs', () => {
      const expected = START_LIGHT_TIMING_3X.launchMs + START_LIGHT_TIMING_3X.logoHoldMs + START_LIGHT_TIMING_3X.revealDurationMs;
      expect(START_LIGHT_TIMING_3X.totalMs).toBe(expected);
    });
  });

  describe('Intro Controller Guard & Selection', () => {
    it('resolves default speed as 3x when unconfigured', () => {
      expect(getIntroTiming('3x').speed).toBe('3x');
      expect(getIntroTiming('2x').speed).toBe('2x');
      expect(getIntroTiming('1x').speed).toBe('1x');
    });

    it('renders with speed attribute on container', () => {
      const html3x = renderToStaticMarkup(<F1StartLightsPreloader speed="3x" />);
      expect(html3x).toContain('data-speed="3x"');
      expect(html3x).toContain('EFFET DE SOL (3X)');

      const html2x = renderToStaticMarkup(<F1StartLightsPreloader speed="2x" />);
      expect(html2x).toContain('data-speed="2x"');
      expect(html2x).toContain('EFFET DE SOL (2X)');
    });
  });
});
