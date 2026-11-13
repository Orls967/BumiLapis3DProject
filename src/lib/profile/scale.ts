import { EARTH_RADIUS_KM } from '../units';

export type ScaleMode = 'true' | 'exaggerated';

/**
 * Piecewise mapping altitude (km, + above sea level, − below) → display radius (Earth surface = 1)
 * for the exaggerated mode, giving atmosphere, ocean and crust a minimum visual thickness.
 * Must stay strictly monotonic (tested).
 */
export const EXAGGERATED_SCALE: readonly (readonly [altKm: number, radius: number])[] = [
  [-6371, 0],
  [-5150, 0.2],
  [-2891, 0.5],
  [-660, 0.74],
  [-410, 0.8],
  [-100, 0.875],
  [-35, 0.925],
  [-10.9, 0.965],
  [-3.7, 0.983],
  [0, 1],
  [12, 1.035],
  [50, 1.08],
  [85, 1.115],
  [100, 1.13],
  [600, 1.21],
  [1000, 1.25],
  [10000, 1.42],
  [65000, 2.4],
];

export function displayRadius(altKm: number, mode: ScaleMode): number {
  if (mode === 'true') return Math.max(0, (EARTH_RADIUS_KM + altKm) / EARTH_RADIUS_KM);
  const t = EXAGGERATED_SCALE;
  if (altKm <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (altKm <= t[i][0]) {
      const [a0, r0] = t[i - 1];
      const [a1, r1] = t[i];
      return r0 + ((altKm - a0) / (a1 - a0)) * (r1 - r0);
    }
  }
  const [aN, rN] = t[t.length - 1];
  return rN + ((altKm - aN) / EARTH_RADIUS_KM) * 0.05;
}

/** Inverse of displayRadius. */
export function altitudeFromRadius(radius: number, mode: ScaleMode): number {
  if (mode === 'true') return radius * EARTH_RADIUS_KM - EARTH_RADIUS_KM;
  const t = EXAGGERATED_SCALE;
  if (radius <= t[0][1]) return t[0][0];
  for (let i = 1; i < t.length; i++) {
    if (radius <= t[i][1]) {
      const [a0, r0] = t[i - 1];
      const [a1, r1] = t[i];
      return a0 + ((radius - r0) / (r1 - r0)) * (a1 - a0);
    }
  }
  return t[t.length - 1][0];
}
