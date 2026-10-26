import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('timezone preference', () => {
  it('rejects an invalid saved IANA identifier', async () => {
    vi.stubGlobal('localStorage', { getItem: () => 'Mars/Olympus', setItem: vi.fn() });
    const { useTimezoneStore } = await import('./useTimezoneStore');
    expect(useTimezoneStore.getState().preference).toBe('local');
  });
  it('persists a supported choice and ignores invalid updates', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem });
    const { useTimezoneStore } = await import('./useTimezoneStore');
    useTimezoneStore.getState().setPreference('Europe/London');
    useTimezoneStore.getState().setPreference('Mars/Olympus');
    expect(useTimezoneStore.getState().preference).toBe('Europe/London');
    expect(setItem).toHaveBeenCalledExactlyOnceWith('peds-timezone', 'Europe/London');
  });
});
