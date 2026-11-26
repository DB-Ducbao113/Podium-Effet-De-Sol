export function formatSynchronizedCountdown(
  targetEpochMs: number | null,
  nowEpochMs: number,
  lang: "vi" | "en",
): string {
  if (targetEpochMs === null || !Number.isFinite(targetEpochMs)) {
    return lang === "vi" ? "ĐÃ LÊN LỊCH" : "SCHEDULED";
  }
  const diff = targetEpochMs - nowEpochMs;
  if (diff <= 0) {
    return lang === "vi" ? "TUẦN ĐUA · ĐANG DIỄN RA" : "RACE WEEK · LIVE";
  }
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000) % 24;
  const m = Math.floor(diff / 60_000) % 60;
  const s = Math.floor(diff / 1_000) % 60;
  return `${String(d).padStart(2, "0")}D ${String(h).padStart(2, "0")}H ${String(m).padStart(2, "0")}M ${String(s).padStart(2, "0")}S`;
}
