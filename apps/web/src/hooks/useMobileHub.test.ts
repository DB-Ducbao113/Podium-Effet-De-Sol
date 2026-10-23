import { describe, expect, it } from 'vitest';
import { isPrimaryPath } from './useMobileHub';

describe('adaptive primary routes', () => {
  it.each(['/', '/showroom', '/season/2024', '/season/2025', '/season/2026'])(
    'includes %s in the mobile hub',
    (path) => expect(isPrimaryPath(path)).toBe(true),
  );

  it.each(['/engineering', '/season/2026/race/1', '/drivers/norris', '/season/2030'])(
    'keeps %s as a secondary or invalid route',
    (path) => expect(isPrimaryPath(path)).toBe(false),
  );
});
