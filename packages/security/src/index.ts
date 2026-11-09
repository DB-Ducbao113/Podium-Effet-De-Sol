const SAFE_VALUE = /^[\w./:+\-=<>TZ% ]{1,160}$/;

export function firstQueryValue(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

export function boundedInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number.parseInt(firstQueryValue(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, maximum);
}

export function validateQueryShape(
  query: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
  maximumParameters = 12,
): { ok: true } | { ok: false; reason: string } {
  const entries = Object.entries(query);
  if (entries.length > maximumParameters)
    return { ok: false, reason: "Too many parameters" };
  for (const [key, raw] of entries) {
    if (!allowedKeys.has(key))
      return { ok: false, reason: "Unsupported parameter" };
    const values = Array.isArray(raw) ? raw : [raw];
    if (values.length > 1)
      return { ok: false, reason: "Repeated parameters are not supported" };
    if (!SAFE_VALUE.test(String(values[0] ?? ""))) {
      return { ok: false, reason: "Invalid parameter value" };
    }
  }
  return { ok: true };
}

export function isOriginAllowed(
  origin: string,
  host: string,
  configured: readonly string[],
): boolean {
  if (!origin) return true;
  try {
    if (host && new URL(origin).host === host) return true;
  } catch {
    return false;
  }
  return configured.includes(origin);
}
