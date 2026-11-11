import { MODEL_B_LIVERIES } from './modelBExperience';

export const MODEL_B_PAINT_STORAGE_KEY = 'peds:model-b:paint:v1';
export const DEFAULT_MODEL_B_PAINT_ID = 'graphite';

export function getModelBPaintStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readModelBPaint(storage: Pick<Storage, 'getItem'> | null): string {
  try {
    const value = storage?.getItem(MODEL_B_PAINT_STORAGE_KEY);
    return MODEL_B_LIVERIES.some((paint) => paint.id === value)
      ? value!
      : DEFAULT_MODEL_B_PAINT_ID;
  } catch {
    return DEFAULT_MODEL_B_PAINT_ID;
  }
}

export function persistModelBPaint(storage: Pick<Storage, 'setItem'> | null, id: string): void {
  if (!MODEL_B_LIVERIES.some((paint) => paint.id === id)) return;
  try {
    storage?.setItem(MODEL_B_PAINT_STORAGE_KEY, id);
  } catch {
    // Private browsing or quota restrictions must not block painting.
  }
}
