import { describe, it, expect } from 'vitest';
import { formatDateStr, formatSessionName } from './dateUtils';

describe('dateUtils', () => {
  describe('formatDateStr', () => {
    it('returns empty string when input is undefined or empty', () => {
      expect(formatDateStr(undefined, 'vi')).toBe('');
      expect(formatDateStr('', 'en')).toBe('');
    });

    it('formats ISO date ranges correctly for Vietnamese', () => {
      expect(formatDateStr('2026-10-02 – 2026-10-04', 'vi')).toBe('02 – 04 Thg 10 2026');
      expect(formatDateStr('2026-03-06 - 2026-03-08', 'vi')).toBe('06 – 08 Thg 3 2026');
    });

    it('formats ISO date ranges correctly for English', () => {
      expect(formatDateStr('2026-10-02 – 2026-10-04', 'en')).toBe('02 – 04 Oct 2026');
      expect(formatDateStr('2026-03-06 - 2026-03-08', 'en')).toBe('06 – 08 Mar 2026');
    });

    it('formats single ISO date correctly', () => {
      expect(formatDateStr('2026-10-04', 'vi')).toBe('04 Thg 10 2026');
      expect(formatDateStr('2026-10-04', 'en')).toBe('04 Oct 2026');
    });

    it('formats slash date strings correctly', () => {
      expect(formatDateStr('04/10/2026', 'vi')).toBe('04 Thg 10 2026');
      expect(formatDateStr('04/10/2026', 'en')).toBe('04 Oct 2026');
    });

    it('localizes text dates when lang is vi', () => {
      expect(formatDateStr('Fri 02 Oct', 'vi')).toBe('T6 02 Thg 10');
      expect(formatDateStr('Sunday 26 July', 'vi')).toBe('Chủ Nhật 26 Tháng 7');
    });

    it('preserves textual date when lang is not vi', () => {
      expect(formatDateStr('Fri 02 Oct', 'en')).toBe('Fri 02 Oct');
    });
  });

  describe('formatSessionName', () => {
    it('returns empty string if name is not provided', () => {
      expect(formatSessionName(undefined, 'vi')).toBe('');
    });

    it('translates F1 session names to Vietnamese when lang is vi', () => {
      expect(formatSessionName('Practice 1', 'vi')).toBe('Thử nghiệm 1 (FP1)');
      expect(formatSessionName('Qualifying', 'vi')).toBe('Đua phân hạng');
      expect(formatSessionName('Sprint Race', 'vi')).toBe('Đua Sprint');
      expect(formatSessionName('Race', 'vi')).toBe('Đua chính (Race)');
    });

    it('keeps original session name when lang is en', () => {
      expect(formatSessionName('Practice 1', 'en')).toBe('Practice 1');
      expect(formatSessionName('Qualifying', 'en')).toBe('Qualifying');
    });
  });
});
