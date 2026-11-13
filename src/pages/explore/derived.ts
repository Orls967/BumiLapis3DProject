import type { EarthLayer } from '@/content/schema';
import { profileAt } from '@/lib/profile/interpolate';

export type Derived = {
  tempC?: [number, number];
  pressure?: { min: number; max: number; unit: 'hPa' | 'GPa' };
  density?: [number, number];
};

/** Values interpolated from the profile table for interior layers without explicit numbers. */
export function derivedData(layer: EarthLayer): Derived {
  if (layer.realm !== 'interior' || layer.variantOf) return {};
  const top = profileAt(Math.min(layer.topKm, -0.0001) - 0.0001);
  const bottom = profileAt(layer.bottomKm);
  const out: Derived = {};
  if (top.tempC && bottom.tempC) out.tempC = [Math.round(top.tempC[0]), Math.round(bottom.tempC[1])];
  if (top.pressure && bottom.pressure) out.pressure = { min: top.pressure.value, max: bottom.pressure.value, unit: 'GPa' };
  if (top.density && bottom.density) out.density = [top.density.value, bottom.density.value];
  return out;
}
