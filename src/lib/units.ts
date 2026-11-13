export const EARTH_RADIUS_KM = 6371;
export const HPA_PER_GPA = 1e7;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const degToRad = (d: number) => (d * Math.PI) / 180;
export const radToDeg = (r: number) => (r * 180) / Math.PI;
export const celsiusToKelvin = (c: number) => c + 273.15;
