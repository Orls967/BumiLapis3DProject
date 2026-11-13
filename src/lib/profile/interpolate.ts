import { atmosphereProfile, ATMOSPHERE_TABLE_TOP_KM, interiorProfile, oceanZones } from '@/content/profiles';
import { layers } from '@/content/layers';
import type { EarthLayer } from '@/content/schema';
import { celsiusToKelvin, EARTH_RADIUS_KM } from '../units';

export type ProfileValue = {
  altKm: number;
  /** Temperature range in °C (min = max for the standard atmosphere); null outside the tables. */
  tempC: [number, number] | null;
  pressure: { value: number; unit: 'hPa' | 'GPa' } | null;
  /** Density in g/cm³ (interior) or kg/m³ (atmosphere, ideal gas). */
  density: { value: number; unit: 'g/cm³' | 'kg/m³' } | null;
  oceanZone: (typeof oceanZones)[number] | null;
};

const R_DRY_AIR = 287.05; // J/(kg·K)

function interior(depthKm: number): Omit<ProfileValue, 'altKm' | 'oceanZone'> {
  const p = interiorProfile;
  const d = Math.min(Math.max(depthKm, 0), EARTH_RADIUS_KM);
  let i = 1;
  while (i < p.length - 1 && d > p[i].depthKm) i++;
  const a = p[i - 1];
  const b = p[i];
  const t = (d - a.depthKm) / (b.depthKm - a.depthKm);
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    tempC: [mix(a.tempC[0], b.tempC[0]), mix(a.tempC[1], b.tempC[1])],
    pressure: { value: mix(a.pressureGPa, b.pressureGPa), unit: 'GPa' },
    // within a segment interpolate from "below a" to "above b": never across a discontinuity
    density: { value: mix(a.densityGcm3[1], b.densityGcm3[0]), unit: 'g/cm³' },
  };
}

function atmosphere(altKm: number): Omit<ProfileValue, 'altKm' | 'oceanZone'> {
  if (altKm > ATMOSPHERE_TABLE_TOP_KM) return { tempC: null, pressure: null, density: null };
  const p = atmosphereProfile;
  let i = 1;
  while (i < p.length - 1 && altKm > p[i].altKm) i++;
  const a = p[i - 1];
  const b = p[i];
  const t = (altKm - a.altKm) / (b.altKm - a.altKm);
  const temp = a.tempC + (b.tempC - a.tempC) * t;
  // pressure falls roughly exponentially with height: interpolate its logarithm
  const pressure = Math.exp(Math.log(a.pressureHPa) + (Math.log(b.pressureHPa) - Math.log(a.pressureHPa)) * t);
  return {
    tempC: [temp, temp],
    pressure: { value: pressure, unit: 'hPa' },
    density: { value: (pressure * 100) / (R_DRY_AIR * celsiusToKelvin(temp)), unit: 'kg/m³' },
  };
}

/** Temperature, pressure and density at an altitude (km; negative = depth below the surface). */
export function profileAt(altKm: number): ProfileValue {
  const base = altKm > 0 ? atmosphere(altKm) : interior(-altKm);
  const depthM = -altKm * 1000;
  const oceanZone = altKm <= 0 ? (oceanZones.find((z) => depthM >= z.topM && depthM <= z.baseM) ?? null) : null;
  return { altKm, ...base, oceanZone };
}

/** Value just above / just below an interior depth (differs only at discontinuities). */
export function densityAtBoundary(depthKm: number): [above: number, below: number] | null {
  const hit = interiorProfile.find((p) => p.depthKm === depthKm);
  return hit ? hit.densityGcm3 : null;
}

/** Layers that contain the given altitude, ordered as in the content file. */
export function layersAt(altKm: number, grouping: 'compositional' | 'mechanical'): EarthLayer[] {
  return layers.filter((l) => {
    if (l.variantOf || l.topKm === l.bottomKm) return false;
    if (l.realm === 'interior' && l.grouping !== grouping && l.grouping !== 'both') return false;
    if (l.id === 'magnetosphere' || l.id === 'biosphere') return false;
    const top = Math.max(l.topKm, l.bottomKm);
    const bot = Math.min(l.topKm, l.bottomKm);
    // the upper layer owns a shared boundary, matching the "above" density at discontinuities
    return altKm >= bot && (altKm < top || (altKm === top && top === 0 && l.realm === 'interior'));
  });
}
