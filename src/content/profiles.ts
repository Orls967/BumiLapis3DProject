/**
 * Profile tables for the depth journey (BUMILAPIS.md Bagian 3.C4).
 * Density and pressure follow PREM; temperatures are estimates with large uncertainty.
 */
export type InteriorPoint = {
  depthKm: number;
  /** Density just above and just below this depth (two values at a discontinuity). */
  densityGcm3: [above: number, below: number];
  pressureGPa: number;
  tempC: [min: number, max: number];
  label?: string;
};

export const interiorProfile: InteriorPoint[] = [
  { depthKm: 0, densityGcm3: [2.6, 2.6], pressureGPa: 0, tempC: [15, 15], label: 'Permukaan' },
  { depthKm: 35, densityGcm3: [2.9, 3.38], pressureGPa: 1, tempC: [500, 900], label: 'Moho (benua)' },
  { depthKm: 410, densityGcm3: [3.54, 3.72], pressureGPa: 13.4, tempC: [1400, 1500], label: '410 km' },
  { depthKm: 660, densityGcm3: [3.99, 4.38], pressureGPa: 23.8, tempC: [1600, 1600], label: '660 km' },
  { depthKm: 2891, densityGcm3: [5.57, 9.9], pressureGPa: 136, tempC: [3500, 4000], label: 'Gutenberg' },
  { depthKm: 5150, densityGcm3: [12.17, 12.76], pressureGPa: 329, tempC: [5000, 5700], label: 'Lehmann' },
  { depthKm: 6371, densityGcm3: [13.09, 13.09], pressureGPa: 364, tempC: [5200, 5700], label: 'Pusat Bumi' },
];

export type AtmospherePoint = { altKm: number; tempC: number; pressureHPa: number };

/** U.S. Standard Atmosphere 1976 anchor points. */
export const atmosphereProfile: AtmospherePoint[] = [
  { altKm: 0, tempC: 15, pressureHPa: 1013 },
  { altKm: 11, tempC: -56.5, pressureHPa: 226 },
  { altKm: 20, tempC: -56.5, pressureHPa: 55 },
  { altKm: 32, tempC: -44.5, pressureHPa: 8.7 },
  { altKm: 47, tempC: -2.5, pressureHPa: 1.1 },
  { altKm: 51, tempC: -2.5, pressureHPa: 0.67 },
  { altKm: 71, tempC: -58.5, pressureHPa: 0.04 },
  { altKm: 85, tempC: -86, pressureHPa: 0.004 },
];

export const ATMOSPHERE_TABLE_TOP_KM = 85;

/** Ocean depth zones (m below sea level). */
export const oceanZones = [
  { name: 'Epipelagik', topM: 0, baseM: 200, note: 'Cahaya cukup untuk fotosintesis' },
  { name: 'Mesopelagik', topM: 200, baseM: 1000, note: 'Remang; termoklin' },
  { name: 'Batipelagik', topM: 1000, baseM: 4000, note: 'Gelap total, ≈4 °C' },
  { name: 'Abisopelagik', topM: 4000, baseM: 6000, note: 'Dataran abisal' },
  { name: 'Hadal', topM: 6000, baseM: 10900, note: 'Palung' },
];
