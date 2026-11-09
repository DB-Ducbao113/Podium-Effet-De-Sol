function championshipTab(
  pathname: string,
  search: string,
): "results" | "calendar" | null {
  if (!pathname.startsWith("/season/")) return null;
  const query = new URLSearchParams(search);
  const tab = query.get("tab");
  if (tab !== "results" && tab !== "calendar") return null;
  if (query.has("round")) return null;
  if (["classic", "completed", "upcoming"].includes(query.get("view") ?? ""))
    return null;
  return tab;
}

// Mobile opens Results and Calendar directly in a dedicated championship hub,
// without the Home / Showroom sections of the all-in-one page.
export function isChampionshipMobileHubRoute(
  pathname: string,
  search: string,
): boolean {
  return championshipTab(pathname, search) !== null;
}

export function isChampionshipJourneyRoute(
  pathname: string,
  search: string,
): boolean {
  // The immersive globe journey belongs to Results only; Calendar keeps its original 2D layout.
  return championshipTab(pathname, search) === "results";
}
