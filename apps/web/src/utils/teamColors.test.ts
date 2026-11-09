import { describe, it, expect } from 'vitest';
import {
  resolveTeamId,
  getTeamTextColor,
  getTeamIdentityStyle,
} from './teamColors';

describe('teamColors', () => {
  describe('resolveTeamId', () => {
    it('returns null for empty or undefined input', () => {
      expect(resolveTeamId(undefined)).toBeNull();
      expect(resolveTeamId('')).toBeNull();
    });

    it('resolves exact team IDs', () => {
      expect(resolveTeamId('ferrari')).toBe('ferrari');
      expect(resolveTeamId('mclaren')).toBe('mclaren');
      expect(resolveTeamId('redbull')).toBe('redbull');
    });

    it('resolves driver names to their respective 2026 teams', () => {
      expect(resolveTeamId('hamilton')).toBe('ferrari');
      expect(resolveTeamId('norris')).toBe('mclaren');
      expect(resolveTeamId('verstappen')).toBe('redbull');
      expect(resolveTeamId('antonelli')).toBe('mercedes');
      expect(resolveTeamId('perez')).toBe('cadillac');
    });

    it('resolves partial matches', () => {
      expect(resolveTeamId('Scuderia Ferrari HP')).toBe('ferrari');
      expect(resolveTeamId('Oracle Red Bull Racing')).toBe('redbull');
      expect(resolveTeamId('Audi Revolut F1 Team')).toBe('audi');
    });
  });

  describe('getTeamTextColor', () => {
    it('returns dark-mode and light-mode compliant hex codes', () => {
      const ferrariLight = getTeamTextColor('ferrari', false);
      const ferrariDark = getTeamTextColor('ferrari', true);

      expect(ferrariLight).toBe('#dc2626');
      expect(ferrariDark).toBe('#ef4444');
    });

    it('falls back to default colors for unknown identifiers', () => {
      const fallbackLight = getTeamTextColor('unknown-team-xyz', false);
      const fallbackDark = getTeamTextColor('unknown-team-xyz', true);

      expect(fallbackLight).toBe('#1e293b');
      expect(fallbackDark).toBe('#f1f5f9');
    });
  });

  it('shares distinct team surface tokens across directories and results', () => {
    const ferrari = getTeamIdentityStyle('ferrari') as Record<string, string>;
    const mercedes = getTeamIdentityStyle('mercedes') as Record<string, string>;
    expect(ferrari['--team-color']).toBe('#ef4444');
    expect(mercedes['--team-color']).toBe('#2dd4bf');
    expect(ferrari['--team-surface']).not.toBe(mercedes['--team-surface']);
    expect(ferrari['--team-border']).toContain(ferrari['--team-color']);
  });
});
