import { describe, it, expect } from 'vitest';
import { formatDriverRole, formatDriverYears } from './StudioBackdropTexture';

describe('StudioBackdropTexture Localization & Formatting Helpers', () => {
  it('preserves Vietnamese role when lang is vi', () => {
    const roleVi = '2026 Race Driver · 7x Vô Địch';
    expect(formatDriverRole(roleVi, 'vi')).toBe(roleVi);
  });

  it('translates common Vietnamese role terms to English when lang is en', () => {
    expect(formatDriverRole('2026 Race Driver · 7x Vô Địch', 'en')).toBe(
      '2026 Race Driver · 7x Champion',
    );
    expect(formatDriverRole('Nhà Vô Địch Thế Giới 2007', 'en')).toBe('World Champion 2007');
    expect(formatDriverRole('14 Chiến thắng cùng Ferrari', 'en')).toBe('14 Wins with Ferrari');
    expect(formatDriverRole('Huyền thoại tốc độ Ferrari', 'en')).toBe('Legend tốc độ Ferrari');
    expect(formatDriverRole('2026 Race Driver · Tân Binh', 'en')).toBe(
      '2026 Race Driver · Rookie Driver',
    );
    expect(formatDriverRole('Lãnh Đội', 'en')).toBe('Team Leader');
  });

  it('formats driver years correctly for vi and en', () => {
    expect(formatDriverYears('2019-Hiện tại', 'vi')).toBe('MÙA GIẢI: 2019-Hiện tại');
    expect(formatDriverYears('2019-Hiện tại', 'en')).toBe('SEASONS: 2019-Present');
    expect(formatDriverYears(undefined, 'vi')).toBe('');
  });
});
