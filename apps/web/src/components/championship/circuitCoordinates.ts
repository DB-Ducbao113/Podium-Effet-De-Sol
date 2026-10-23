export interface CircuitGeoCoords {
  lat: number;
  lng: number;
  zoom: number;
}

export const CIRCUIT_COORDINATES: Record<string, CircuitGeoCoords> = {
  'albert-park': { lat: -37.8497, lng: 144.968, zoom: 15 },
  shanghai: { lat: 31.3389, lng: 121.22, zoom: 15 },
  suzuka: { lat: 34.8431, lng: 136.541, zoom: 15 },
  bahrain: { lat: 26.0325, lng: 50.5106, zoom: 15 },
  miami: { lat: 25.9581, lng: -80.2389, zoom: 15 },
  monaco: { lat: 43.7347, lng: 7.4206, zoom: 16 },
  'gilles-villeneuve': { lat: 45.5, lng: -73.5228, zoom: 15 },
  catalunya: { lat: 41.57, lng: 2.2611, zoom: 15 },
  'red-bull-ring': { lat: 47.2197, lng: 14.7647, zoom: 15 },
  silverstone: { lat: 52.0786, lng: -1.0169, zoom: 15 },
  spa: { lat: 50.4372, lng: 5.9714, zoom: 14 },
  hungaroring: { lat: 47.5789, lng: 19.2486, zoom: 15 },
  zandvoort: { lat: 52.3888, lng: 4.5409, zoom: 15 },
  monza: { lat: 45.6156, lng: 9.2811, zoom: 15 },
  baku: { lat: 40.3725, lng: 49.8533, zoom: 15 },
  'marina-bay': { lat: 1.2914, lng: 103.864, zoom: 15 },
  cota: { lat: 30.1328, lng: -97.6411, zoom: 15 },
  'hermanos-rodriguez': { lat: 19.4042, lng: -99.0907, zoom: 15 },
  interlagos: { lat: -23.7036, lng: -46.6997, zoom: 15 },
  'las-vegas': { lat: 36.1147, lng: -115.168, zoom: 15 },
  lusail: { lat: 25.49, lng: 51.4542, zoom: 15 },
  'yas-marina': { lat: 24.4672, lng: 54.6031, zoom: 15 },
  sepang: { lat: 2.7608, lng: 101.738, zoom: 15 },
  madring: { lat: 40.6172, lng: -3.5856, zoom: 15 },
};
