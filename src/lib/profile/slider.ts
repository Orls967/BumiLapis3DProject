/**
 * Non-linear (piecewise linear) mapping between slider position 0…1 and altitude in km,
 * so the thin atmosphere and crust are not squeezed. 0 = +10 000 km, 1 = centre of the Earth.
 */
export const JOURNEY_TOP_KM = 10000;
export const JOURNEY_BOTTOM_KM = -6371;

export const JOURNEY_STOPS: readonly (readonly [pos: number, altKm: number])[] = [
  [0, 10000],
  [0.1, 600],
  [0.19, 100],
  [0.245, 85],
  [0.3, 50],
  [0.37, 12],
  [0.46, 0],
  [0.54, -35],
  [0.6, -100],
  [0.67, -410],
  [0.72, -660],
  [0.85, -2891],
  [0.95, -5150],
  [1, -6371],
];

export function positionToAltitude(pos: number): number {
  const s = JOURNEY_STOPS;
  const p = Math.min(1, Math.max(0, pos));
  for (let i = 1; i < s.length; i++) {
    if (p <= s[i][0]) {
      const t = (p - s[i - 1][0]) / (s[i][0] - s[i - 1][0]);
      return s[i - 1][1] + t * (s[i][1] - s[i - 1][1]);
    }
  }
  return JOURNEY_BOTTOM_KM;
}

export function altitudeToPosition(altKm: number): number {
  const s = JOURNEY_STOPS;
  const a = Math.min(JOURNEY_TOP_KM, Math.max(JOURNEY_BOTTOM_KM, altKm));
  for (let i = 1; i < s.length; i++) {
    if (a >= s[i][1]) {
      const t = (s[i - 1][1] - a) / (s[i - 1][1] - s[i][1]);
      return s[i - 1][0] + t * (s[i][0] - s[i - 1][0]);
    }
  }
  return 1;
}
