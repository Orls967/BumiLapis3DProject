import type { EarthLayer } from '@/content/schema';

export type Derived = {
  tempC?: [number, number];
  pressure?: { min: number; max: number; unit: 'hPa' | 'GPa' };
  density?: [number, number];
};

/** Values interpolated from the profile table for layers without explicit numbers (wired up in M2). */
export function derivedData(_layer: EarthLayer): Derived {
  return {};
}
