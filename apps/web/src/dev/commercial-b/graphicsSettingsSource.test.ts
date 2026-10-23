import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/dev/CommercialBReviewShowroom.tsx', 'utf8');

describe('B8 Graphics Settings layout contract', () => {
  it('resets advanced metrics whenever the panel closes', () => {
    expect(source).toContain('if (!open) setAdvanced(false)');
  });

  it('reserves a desktop side rail instead of covering the 3D stage', () => {
    expect(source).toContain("settingsOpen ? 'lg:w-[calc(100%_-_23rem)]' : 'w-full'");
    expect(source).toContain('data-testid="commercial-b-stage"');
  });

  it('keeps the collapsed control concise', () => {
    expect(source).toContain("lang === 'vi' ? 'Cài đặt đồ họa' : 'Graphics Settings'");
    expect(source).toContain('{profile}');
  });
});
