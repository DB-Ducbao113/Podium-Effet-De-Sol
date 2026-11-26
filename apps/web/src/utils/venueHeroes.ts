// Venue photography for the Race Center round hero.
// Provenance and licence records: docs/asset-manifests/p4-venue-heroes.json
// Runtime plates: apps/web/public/images/championship/venues/

export type VenueHero = {
  venue: string;
  place: string;
  credit: string;
  license: string;
  licenseUrl?: string;
  sourcePage: string;
};

export const VENUE_HERO_BY_CIRCUIT: Record<string, VenueHero> = {
  "albert-park": {
    venue: "albert-park",
    place: "Melbourne, Australia",
    credit: "Kgbo",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3AMelbourne_CBD_at_night_seen_from_Carousel_venue%2C_Albert_Park%2C_Melbourne_01.jpg",
  },
  "baku": {
    venue: "baku",
    place: "Baku, Azerbaijan",
    credit: "GNL GAO",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ABaku%2C_night_view.jpg",
  },
  "catalunya": {
    venue: "catalunya",
    place: "Montmeló, Spain",
    credit: "Wilnel José Verdú Guerrero",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ACurvas_1-6_de_Circuit_de_Barcelona-Catalunya_Montmel%C3%B3_(2023).jpg",
  },
  "cota": {
    venue: "cota",
    place: "Austin, USA",
    credit: "Steve from Austin, TX, USA",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ASunset_at_Circuit_of_the_Americas_(26162172799).jpg",
  },
  "gilles-villeneuve": {
    venue: "gilles-villeneuve",
    place: "Montréal, Canada",
    credit: "Tsunami330",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ACircuit_Gilles_Villeneuve_NAPA_200.JPG",
  },
  "hermanos-rodriguez": {
    venue: "hermanos-rodriguez",
    place: "Mexico City, Mexico",
    credit: "ProtoplasmaKid",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3AVista_a%C3%A9rea_del_Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_01.jpg",
  },
  "hungaroring": {
    venue: "hungaroring",
    place: "Mogyoród, Hungary",
    credit: "Bjoertvedt",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3APest_county_Mogyor%C3%B3d_Hungariring_raceway_IMG_0210.JPG",
  },
  "interlagos": {
    venue: "interlagos",
    place: "São Paulo, Brazil",
    credit: "ProtoplasmaKid",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3AVista_a%C3%A9rea_del_Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace_02.jpg",
  },
  "las-vegas": {
    venue: "las-vegas",
    place: "Las Vegas, USA",
    credit: "Supercarwaar",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ALas_Vegas_Strip_by_night_(2).jpg",
  },
  "lusail": {
    venue: "lusail",
    place: "Lusail, Qatar",
    credit: "Trinidade",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3AGrand_Stand.JPG",
  },
  "madring": {
    venue: "madring",
    place: "Madrid, Spain",
    credit: "Barcex",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3AMadrid_-_Madrid_skyline_-_140314_195825.jpg",
  },
  "marina-bay": {
    venue: "marina-bay",
    place: "Singapore",
    credit: "Ong Chi Hang",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ASingapore_Marina_Bay_Night_View_-_panoramio.jpg",
  },
  "miami": {
    venue: "miami",
    place: "Miami Gardens, USA",
    credit: "CBP Photography",
    license: "Public domain",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3A200127-H-AT513-071.jpg",
  },
  "monaco": {
    venue: "monaco",
    place: "Monte Carlo, Monaco",
    credit: "Pierre Blaché from Paris, France",
    license: "CC0",
    licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3AMonaco_Fontvieille_(48928513252).jpg",
  },
  "monza": {
    venue: "monza",
    place: "Monza, Italy",
    credit: "Lucariolle",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3AMonza_2019_bis.jpg",
  },
  "red-bull-ring": {
    venue: "red-bull-ring",
    place: "Spielberg, Austria",
    credit: "Vanessa Machelett",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ALuftaufnahme_(c)Red_Bull_Ring.jpg",
  },
  "sepang": {
    venue: "sepang",
    place: "Sepang, Malaysia",
    credit: "Craig",
    license: "Public domain",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ASepang_international_circuit_qualifying1.jpg",
  },
  "shanghai": {
    venue: "shanghai",
    place: "Shanghai, China",
    credit: "Derrick Noh from NYC",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3A2009_Formula_1_Grand_Prix_of_China_-_Shanghai_Circuit_(3477893023).jpg",
  },
  "silverstone": {
    venue: "silverstone",
    place: "Silverstone, UK",
    credit: "Mike McBey",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ASilverstone%2C_England%2C_on_Grand_Prix_day_(38713135300).jpg",
  },
  "spa": {
    venue: "spa",
    place: "Stavelot, Belgium",
    credit: "United Autosports",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3A2022_4_Hours_of_Spa-Francorchamps_-_Circuit.jpg",
  },
  "suzuka": {
    venue: "suzuka",
    place: "Suzuka, Japan",
    credit: "shiraga from Osaka, JAPAN",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ASuzuka_Circuit_2006.jpg",
  },
  "yas-marina": {
    venue: "yas-marina",
    place: "Abu Dhabi, UAE",
    credit: "Nepenthes",
    license: "CC BY-SA 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.5",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3AYas_Marina_Circuit_005.JPG",
  },
  "zandvoort": {
    venue: "zandvoort",
    place: "Zandvoort, Netherlands",
    credit: "Quistnix",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File%3ACircuit_Park_Zandvoort_aerial_photo.jpg",
  },
};

export const venueHeroFor = (circuitId?: string): VenueHero | undefined =>
  circuitId ? VENUE_HERO_BY_CIRCUIT[circuitId] : undefined;

export const venueHeroSrcSet = (venue: string, orientation: "land" | "port", format: "avif" | "webp"): string =>
  orientation === "land"
    ? `/images/championship/venues/${venue}-land-960.${format} 960w, /images/championship/venues/${venue}-land-1600.${format} 1600w`
    : `/images/championship/venues/${venue}-port-600.${format} 600w, /images/championship/venues/${venue}-port-900.${format} 900w`;
