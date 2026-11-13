import { describe, expect, it } from 'vitest';
import { atmosphereProfile, interiorProfile } from '@/content/profiles';
import { layersAt, profileAt } from './interpolate';
import { altitudeToPosition, JOURNEY_STOPS, positionToAltitude } from './slider';

describe('profileAt', () => {
  it('reproduces the interior table at its anchor depths', () => {
    for (const p of interiorProfile) {
      const v = profileAt(-p.depthKm);
      expect(v.pressure?.value).toBeCloseTo(p.pressureGPa, 6);
      expect(v.tempC?.[0]).toBeCloseTo(p.tempC[0], 6);
      expect(v.tempC?.[1]).toBeCloseTo(p.tempC[1], 6);
      // at the anchor we are on the upper side of the boundary
      expect(v.density?.value).toBeCloseTo(p.densityGcm3[0], 6);
    }
  });

  it('does not interpolate density across a discontinuity', () => {
    expect(profileAt(-2890.999).density!.value).toBeCloseTo(5.57, 2);
    expect(profileAt(-2891.001).density!.value).toBeCloseTo(9.9, 2);
    expect(profileAt(-35.001).density!.value).toBeCloseTo(3.38, 2);
    expect(profileAt(-5150.01).density!.value).toBeCloseTo(12.76, 2);
  });

  it('interpolates linearly between anchors', () => {
    const mid = profileAt(-(660 + 2891) / 2);
    expect(mid.pressure!.value).toBeCloseTo((23.8 + 136) / 2, 6);
    expect(mid.density!.value).toBeCloseTo((4.38 + 5.57) / 2, 6);
    expect(mid.tempC![1]).toBeCloseTo((1600 + 4000) / 2, 6);
  });

  it('reproduces the standard atmosphere anchors and halves pressure near 5.5 km', () => {
    for (const p of atmosphereProfile.slice(1)) {
      const v = profileAt(p.altKm);
      expect(v.tempC![0]).toBeCloseTo(p.tempC, 6);
      expect(v.pressure!.value).toBeCloseTo(p.pressureHPa, 6);
    }
    const half = profileAt(5.5).pressure!.value;
    expect(half).toBeGreaterThan(430);
    expect(half).toBeLessThan(560);
    expect(profileAt(0.001).density!.value).toBeCloseTo(1.225, 1);
  });

  it('returns no numbers above the standard-atmosphere table', () => {
    const v = profileAt(400);
    expect(v.tempC).toBeNull();
    expect(v.pressure).toBeNull();
  });

  it('reports ocean zones and active layers', () => {
    expect(profileAt(-0.1).oceanZone?.name).toBe('Epipelagik');
    expect(profileAt(-5).oceanZone?.name).toBe('Abisopelagik');
    expect(profileAt(-50).oceanZone).toBeNull();
    expect(layersAt(-3000, 'compositional').map((l) => l.id)).toEqual(['outer-core']);
    expect(layersAt(-200, 'mechanical').map((l) => l.id)).toEqual(['asthenosphere']);
    expect(layersAt(25, 'compositional').map((l) => l.id)).toEqual(['stratosphere', 'ozone-layer']);
    expect(layersAt(-6371, 'compositional').map((l) => l.id)).toEqual(['inner-core']);
  });
});

describe('journey slider scale', () => {
  it('is monotonic and round-trips', () => {
    for (let i = 1; i < JOURNEY_STOPS.length; i++) {
      expect(JOURNEY_STOPS[i][0]).toBeGreaterThan(JOURNEY_STOPS[i - 1][0]);
      expect(JOURNEY_STOPS[i][1]).toBeLessThan(JOURNEY_STOPS[i - 1][1]);
    }
    let prev = Infinity;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const alt = positionToAltitude(p);
      expect(alt).toBeLessThan(prev);
      prev = alt;
      expect(altitudeToPosition(alt)).toBeCloseTo(Math.min(1, p), 9);
    }
    expect(positionToAltitude(0)).toBe(10000);
    expect(positionToAltitude(1)).toBe(-6371);
  });

  it('gives the atmosphere below 100 km and the crust generous room', () => {
    expect(altitudeToPosition(0) - altitudeToPosition(100)).toBeGreaterThan(0.2);
    expect(altitudeToPosition(-35) - altitudeToPosition(0)).toBeGreaterThan(0.05);
  });
});
