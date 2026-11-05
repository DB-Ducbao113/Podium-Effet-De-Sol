import type { WorldQuality } from './worldModel';

/** Conservative capability gates; frame-time adaptation occurs in the Canvas. */
export function selectWorldQuality(input: {
  reducedMotion: boolean;
  saveData: boolean;
  webgl2: boolean;
  width: number;
  memoryGB?: number;
}): WorldQuality {
  if (input.reducedMotion || !input.webgl2 || input.width < 851) return 'static';
  if (input.saveData) return 'static';
  if (input.memoryGB !== undefined && input.memoryGB <= 2) return 'static';
  if (input.memoryGB !== undefined && input.memoryGB <= 4) return 'low';
  if (input.width < 1180) return 'low';
  if (input.width < 1500) return 'balanced';
  return 'high';
}
