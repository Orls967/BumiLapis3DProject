import { describe, expect, it } from 'vitest';
import { stratColumnSchema, type GrainSize } from '@/content/schema';
import { BASIN, basinPresets, createBasin, regimeOf, runBasin, sampleWell, stepBasin, storedArea, type BasinParams } from './basin';
import { classify, depositionVelocity, erosionCurve, erosionVelocity } from './hjulstrom';
import { createTube, fergusonChurch, pileProfile, stepTube, stokesVelocity } from './settling';

const rank: Record<string, number> = { clay: 0, silt: 1, 'vf-sand': 2, 'f-sand': 3, 'm-sand': 4 };
const preset = (id: string) => basinPresets.find((p) => p.id === id)!;

describe('basin fill', () => {
  it('conserves sediment mass within 1 % for every preset', () => {
    for (const p of basinPresets) {
      const s = runBasin(p.params);
      expect(s.influx).toBeCloseTo(p.params.supply * p.params.durationKyr, 6);
      expect(Math.abs(storedArea(s) - s.influx) / s.influx).toBeLessThan(0.01);
    }
  });

  it('stays stable at the extremes of the UI parameter ranges', () => {
    const lo: BasinParams = { supply: 0, amplitudeM: 0, periodKyr: 100, trendMPerKyr: -0.03, subsidence: 0, slope: 0.4, durationKyr: 500 };
    const hi: BasinParams = { supply: 12, amplitudeM: 50, periodKyr: 100, trendMPerKyr: 0.05, subsidence: 0.1, slope: 2.5, durationKyr: 3000 };
    for (const params of [lo, hi, { ...hi, supply: 0 }, { ...lo, supply: 12, slope: 2.5 }]) {
      const s = runBasin(params);
      for (const v of s.h) {
        expect(Number.isFinite(v)).toBe(true);
        expect(Math.abs(v)).toBeLessThan(2000);
      }
      // time lines stay ordered: younger surfaces never lie below older ones
      for (let k = 1; k < s.surfaces.length; k++) for (let i = 0; i < s.nx; i++) expect(s.surfaces[k][i]).toBeGreaterThanOrEqual(s.surfaces[k - 1][i] - 1e-9);
      for (let i = 0; i < s.nx; i++) expect(s.surfaces[0][i]).toBeGreaterThanOrEqual(s.base[i] - 1e-9);
    }
  });

  it('delta preset progrades and its well coarsens upward', () => {
    const p = preset('delta');
    const s = runBasin(p.params);
    const shore = s.shorelines.filter(Number.isFinite);
    expect(shore[shore.length - 1]).toBeGreaterThan(shore[0] + 20);
    const col = sampleWell(s, p.wellKm);
    expect(stratColumnSchema.safeParse(col).success).toBe(true);
    const ranks = col.beds.map((b) => rank[b.grainSize as GrainSize]);
    expect(ranks.length).toBeGreaterThanOrEqual(3);
    // beds are listed top → bottom: grain size must not increase downward
    for (let k = 1; k < ranks.length; k++) expect(ranks[k]).toBeLessThanOrEqual(ranks[k - 1]);
    expect(ranks[0]).toBeGreaterThan(ranks[ranks.length - 1]);
    expect(regimeOf(s).regime).toBe('progradation');
  });

  it('transgression preset retrogrades and its well fines upward', () => {
    const p = preset('transgression');
    const s = runBasin(p.params);
    expect(s.shorelines[s.shorelines.length - 1]).toBeLessThan(s.shorelines[0] - 15);
    const col = sampleWell(s, p.wellKm);
    expect(stratColumnSchema.safeParse(col).success).toBe(true);
    const ranks = col.beds.map((b) => rank[b.grainSize as GrainSize]);
    expect(ranks.length).toBeGreaterThanOrEqual(2);
    for (let k = 1; k < ranks.length; k++) expect(ranks[k]).toBeGreaterThanOrEqual(ranks[k - 1]);
    expect(regimeOf(s).regime).toBe('retrogradation');
  });

  it('can be advanced in chunks with the same result as one run', () => {
    const p = preset('cycles').params;
    const a = runBasin(p);
    const b = createBasin(p);
    while (stepBasin(b, 777) > 0);
    expect(b.steps).toBe(a.steps);
    expect(Array.from(b.h)).toEqual(Array.from(a.h));
    expect(b.surfaces.length).toBe(a.surfaces.length);
    expect(a.surfaces.length).toBeGreaterThanOrEqual(BASIN.timelines);
  });
});

describe('settling velocity', () => {
  it('Ferguson–Church approaches Stokes for fine grains', () => {
    for (const d of [2e-6, 1e-5, 3e-5]) expect(fergusonChurch(d) / stokesVelocity(d)).toBeGreaterThan(0.93);
  });
  it('gives ≈ 0.13 m/s for 1 mm natural quartz sand and grows monotonically', () => {
    expect(fergusonChurch(1e-3)).toBeCloseTo(0.126, 2);
    let prev = 0;
    for (let e = -6; e <= -1.5; e += 0.25) {
      const w = fergusonChurch(10 ** e);
      expect(w).toBeGreaterThan(prev);
      prev = w;
    }
  });
  it('settling tube produces a graded bed (coarse at the bottom)', () => {
    const tube = createTube(
      [
        { id: 'c-sand', dMm: 0.7, share: 1 },
        { id: 'f-sand', dMm: 0.18, share: 1 },
        { id: 'silt', dMm: 0.03, share: 1 },
      ],
      600,
      1,
      7,
    );
    let guard = 0;
    while (stepTube(tube, 5) && guard++ < 10000);
    expect(tube.nSettled).toBe(600);
    const prof = pileProfile(tube, 4);
    expect(prof[0]).toBeGreaterThan(prof[1]);
    expect(prof[1]).toBeGreaterThan(prof[3]);
  });
});

describe('Hjulström diagram', () => {
  it('fine sand is the easiest size to erode', () => {
    const min = erosionCurve.reduce((a, b) => (b[1] < a[1] ? b : a));
    expect(min[0]).toBeGreaterThanOrEqual(0.1);
    expect(min[0]).toBeLessThanOrEqual(1);
    expect(erosionVelocity(0.002)).toBeGreaterThan(erosionVelocity(0.3));
  });
  it('classifies erosion, transport and deposition', () => {
    expect(classify(0.3, 100)).toBe('erosi');
    expect(classify(0.3, 5)).toBe('transportasi');
    expect(classify(10, 5)).toBe('pengendapan');
    // clay, once lifted, stays in suspension even in very slow flow
    expect(classify(0.002, 0.2)).toBe('transportasi');
    for (const d of [0.02, 0.1, 1, 10, 80]) expect(depositionVelocity(d)).toBeLessThan(erosionVelocity(d));
  });
});
