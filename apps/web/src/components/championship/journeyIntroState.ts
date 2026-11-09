export type JourneyIntroTier = "T0" | "T1" | "T2" | "T3";

export function getJourneyIntroTier(input: {
  webglAvailable: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  effectiveType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}): JourneyIntroTier {
  if (
    !input.webglAvailable ||
    input.reducedMotion ||
    input.saveData ||
    /^(slow-2g|2g)$/i.test(input.effectiveType ?? "")
  )
    return "T0";
  if (
    (input.deviceMemory !== undefined && input.deviceMemory <= 4) ||
    (input.hardwareConcurrency !== undefined && input.hardwareConcurrency <= 4)
  )
    return "T1";
  if (
    input.deviceMemory !== undefined &&
    input.deviceMemory >= 8 &&
    input.hardwareConcurrency !== undefined &&
    input.hardwareConcurrency >= 8
  )
    return "T3";
  return "T2";
}