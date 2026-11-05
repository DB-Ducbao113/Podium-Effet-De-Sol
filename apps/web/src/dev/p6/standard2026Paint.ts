import type { PrecisionTeam } from './paintAtlas';

/**
 * Single paint token source for the standard, early-2026 livery on Model B.
 * These are calibrated visual-study swatches, NOT manufacturer paint codes.
 * The light/dark/detail tokens drive paint masks; their meaning is per-team.
 * Every camera angle must sample the same atlas and these same tokens.
 */
export interface Standard2026Paint {
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  side: string;
  cover: string;
  nose: string;
  wing: string;
  finish: 'gloss' | 'satin';
  dark: string;
  light: string;
  detail: string;
}

export const STANDARD_2026_PAINT: Record<PrecisionTeam, Readonly<Standard2026Paint>> = {
  mclaren: {
    primary: '#ef6e12', secondary: '#15191c', accent: '#2193ae',
    ink: '#f7f6f1', side: '#15191c', cover: '#15191c',
    nose: '#ef6e12', wing: '#15191c', finish: 'satin',
    dark: '#15191c', light: '#f7f6f1', detail: '#253796',
  },
  ferrari: {
    primary: '#d9182b', secondary: '#f2f0eb', accent: '#ffe045',
    ink: '#fffaf4', side: '#d9182b', cover: '#f2f0eb',
    nose: '#d9182b', wing: '#17191b', finish: 'gloss',
    dark: '#17191b', light: '#f2f0eb', detail: '#193987',
  },
  mercedes: {
    primary: '#c1c9c9', secondary: '#131719', accent: '#00a19c',
    ink: '#f4faf9', side: '#131719', cover: '#131719',
    nose: '#c1c9c9', wing: '#101416', finish: 'satin',
    dark: '#101416', light: '#c1c9c9', detail: '#0b7776',
  },
  redbull: {
    primary: '#14306e', secondary: '#152451', accent: '#ed1a3b',
    ink: '#fffaf4', side: '#14306e', cover: '#14306e',
    nose: '#14306e', wing: '#101a3d', finish: 'gloss',
    dark: '#101a3d', light: '#f1f2ee', detail: '#ffce00',
  },
  racingbulls: {
    primary: '#ecf0ee', secondary: '#1c4aa9', accent: '#d93439',
    ink: '#f7f9fb', side: '#ecf0ee', cover: '#ecf0ee',
    nose: '#ecf0ee', wing: '#1c4aa9', finish: 'gloss',
    dark: '#161a25', light: '#ecf0ee', detail: '#163f9b',
  },
  astonmartin: {
    primary: '#075744', secondary: '#11221f', accent: '#bfd82c',
    ink: '#f3f6ea', side: '#075744', cover: '#075744',
    nose: '#075744', wing: '#11221f', finish: 'satin',
    dark: '#11221f', light: '#f3f6ea', detail: '#bfd82c',
  },
  alpine: {
    primary: '#1959c6', secondary: '#f17eb6', accent: '#f17eb6',
    ink: '#f8f8fc', side: '#f17eb6', cover: '#1959c6',
    nose: '#1959c6', wing: '#f17eb6', finish: 'gloss',
    dark: '#1b1d24', light: '#f4f1f3', detail: '#f17eb6',
  },
  williams: {
    primary: '#1555bd', secondary: '#f1f2f0', accent: '#d32e37',
    ink: '#f8fbff', side: '#30a5d2', cover: '#1555bd',
    nose: '#1555bd', wing: '#11171e', finish: 'gloss',
    dark: '#11171e', light: '#f1f2f0', detail: '#30a5d2',
  },
  haas: {
    primary: '#e8e9e6', secondary: '#141719', accent: '#d51c2d',
    ink: '#f8f9f6', side: '#e8e9e6', cover: '#e8e9e6',
    nose: '#e8e9e6', wing: '#141719', finish: 'satin',
    dark: '#141719', light: '#e8e9e6', detail: '#d51c2d',
  },
  audi: {
    primary: '#aeb2b1', secondary: '#111315', accent: '#d92d35',
    ink: '#f6f7f5', side: '#aeb2b1', cover: '#111315',
    nose: '#aeb2b1', wing: '#111315', finish: 'satin',
    dark: '#111315', light: '#f6f7f5', detail: '#d92d35',
  },
  cadillac: {
    // February launch reference: physical left light, physical right dark.
    primary: '#e6e6e2', secondary: '#111315', accent: '#bcc0bf',
    ink: '#f7f7f3', side: '#e6e6e2', cover: '#e6e6e2',
    nose: '#e6e6e2', wing: '#111315', finish: 'satin',
    dark: '#111315', light: '#e6e6e2', detail: '#d4d7d5',
  },
};
