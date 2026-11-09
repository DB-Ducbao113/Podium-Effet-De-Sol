export type VenuePlate = "forest" | "street" | "desert" | "modern";

// Atmosphere artwork only: these plates are selected by circuit character and
// are never captioned as the real venue.
export const VENUE_PLATE_BY_CIRCUIT: Record<string, VenuePlate> = {
  "albert-park": "street",
  miami: "street",
  "gilles-villeneuve": "street",
  monaco: "street",
  baku: "street",
  "marina-bay": "street",
  "las-vegas": "street",
  suzuka: "forest",
  "red-bull-ring": "forest",
  silverstone: "forest",
  spa: "forest",
  hungaroring: "forest",
  zandvoort: "forest",
  monza: "forest",
  sepang: "forest",
  interlagos: "forest",
  lusail: "desert",
  "yas-marina": "desert",
  bahrain: "desert",
};

export const VENUE_PLATE_LABEL: Record<VenuePlate, { vi: string; en: string }> = {
  forest: {
    vi: "Không khí đường đua trong rừng · ảnh minh họa",
    en: "Forested circuit atmosphere · illustrative artwork",
  },
  street: {
    vi: "Không khí phố đêm · ảnh minh họa",
    en: "Night street atmosphere · illustrative artwork",
  },
  desert: {
    vi: "Không khí đường đua sa mạc · ảnh minh họa",
    en: "Desert circuit atmosphere · illustrative artwork",
  },
  modern: {
    vi: "Không khí đường đua hiện đại · ảnh minh họa",
    en: "Modern circuit atmosphere · illustrative artwork",
  },
};

export const venuePlateFor = (circuitId?: string): VenuePlate =>
  (circuitId && VENUE_PLATE_BY_CIRCUIT[circuitId]) || "modern";
