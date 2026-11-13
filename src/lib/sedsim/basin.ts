import type { Bed, GrainSize, StratColumn } from '@/content/schema';

/**
 * Basin-fill model: 1D diffusion of topography along a land → sea section (BUMILAPIS.md 4.5.1).
 *   ∂h/∂t = ∂/∂x ( K ∂h/∂x ) − σ(x),   K = K_LAND above sea level, K_MARINE·exp(−depth/40 m) below.
 * The basement is not erodible (fluxes are limited by the sediment available in each cell).
 * Units: x in km, elevations in m, time in kyr, sediment flux in m·km/kyr (area of section per time).
 * Stored time lines are kept in the non-subsiding frame g = h + σ·t so that subsidence never has
 * to be applied to them; only erosion clips them.
 */
export type BasinParams = {
  /** Sediment flux entering at the landward edge, m·km/kyr. */
  supply: number;
  /** Sea-level amplitude (m) and period (kyr) of the sinusoidal cycle. */
  amplitudeM: number;
  periodKyr: number;
  /** Linear sea-level trend, m/kyr (positive = rising). */
  trendMPerKyr: number;
  /** Maximum subsidence rate at the seaward edge, m/kyr. */
  subsidence: number;
  /** Initial slope of the surface, m/km. */
  slope: number;
  durationKyr: number;
};

export const BASIN = {
  lengthKm: 150,
  nx: 120,
  shore0Km: 55,
  kLand: 20,
  kMarine: 2,
  kDecayDepthM: 40,
  kDeepFraction: 0.05,
  /** Erosion deeper than this (m) is drawn as an erosional contact in wells. */
  erosionGapM: 1,
  timelines: 48,
  /** Water-depth thresholds (m) between facies; adjustable constants. */
  shorefaceMaxM: 10,
  transitionMaxM: 50,
} as const;

export type FaciesId = 'coastal-plain' | 'shoreface' | 'transition' | 'offshore';
export const FACIES: { id: FaciesId; lithologyId: string; grainSize: GrainSize; environmentId: string; color: string }[] = [
  { id: 'coastal-plain', lithologyId: 'sandstone', grainSize: 'm-sand', environmentId: 'delta', color: '#d98f3d' },
  { id: 'shoreface', lithologyId: 'sandstone', grainSize: 'f-sand', environmentId: 'shoreface', color: '#f2d56b' },
  { id: 'transition', lithologyId: 'siltstone', grainSize: 'silt', environmentId: 'shelf', color: '#9cc3a4' },
  { id: 'offshore', lithologyId: 'shale', grainSize: 'clay', environmentId: 'shelf', color: '#6f8fb3' },
];

export function faciesOf(waterDepthM: number): number {
  if (waterDepthM < 0) return 0;
  if (waterDepthM < BASIN.shorefaceMaxM) return 1;
  if (waterDepthM < BASIN.transitionMaxM) return 2;
  return 3;
}

export type BasinState = {
  params: BasinParams;
  nx: number;
  dxKm: number;
  dtKyr: number;
  steps: number;
  totalSteps: number;
  tKyr: number;
  /** Current surface elevation (m, relative to the sea-level datum at t = 0). */
  h: Float64Array;
  /** Subsidence rate per cell (m/kyr). */
  sigma: Float64Array;
  /** Initial surface (non-erodible basement) in the non-subsiding frame. */
  base: Float64Array;
  /** Time lines in the non-subsiding frame, oldest first; surfaces[k] ≥ surfaces[k−1] ≥ base. */
  surfaces: Float64Array[];
  /** Facies index of the packet below each time line, per cell. */
  facies: Uint8Array[];
  /** Metres removed from each time line by later erosion. */
  cut: Float32Array[];
  /** Per time line: time, sea level and shoreline position (km; NaN when no shoreline in the section). */
  times: number[];
  seaLevels: number[];
  shorelines: number[];
  /** Cumulative sediment area that entered the section, m·km. */
  influx: number;
  markEvery: number;
};

export const xOf = (s: Pick<BasinState, 'dxKm'>, i: number) => (i + 0.5) * s.dxKm;

export function seaLevel(p: BasinParams, tKyr: number): number {
  const cyc = p.amplitudeM !== 0 && p.periodKyr > 0 ? p.amplitudeM * Math.sin((2 * Math.PI * tKyr) / p.periodKyr) : 0;
  return cyc + p.trendMPerKyr * tKyr;
}
/** Rate of sea-level change, m/kyr. */
export function seaLevelRate(p: BasinParams, tKyr: number): number {
  const cyc = p.amplitudeM !== 0 && p.periodKyr > 0 ? ((p.amplitudeM * 2 * Math.PI) / p.periodKyr) * Math.cos((2 * Math.PI * tKyr) / p.periodKyr) : 0;
  return cyc + p.trendMPerKyr;
}

/** First position (km) where the surface drops below sea level, linearly interpolated. */
export function shorelineOf(h: ArrayLike<number>, sl: number, dxKm: number): number {
  if (h[0] < sl) return 0;
  for (let i = 1; i < h.length; i++) {
    if (h[i] < sl) {
      const f = (h[i - 1] - sl) / (h[i - 1] - h[i]);
      return (i - 0.5 + f) * dxKm;
    }
  }
  return NaN;
}

export function createBasin(params: BasinParams): BasinState {
  const nx = BASIN.nx;
  const dxKm = BASIN.lengthKm / nx;
  // explicit scheme: dt ≤ dx² / (2·K_max); keep a safety margin
  const dtMax = (0.4 * dxKm * dxKm) / Math.max(BASIN.kLand, BASIN.kMarine);
  const totalSteps = Math.max(BASIN.timelines, Math.ceil(params.durationKyr / dtMax));
  const dtKyr = params.durationKyr / totalSteps;
  const h = new Float64Array(nx);
  const sigma = new Float64Array(nx);
  for (let i = 0; i < nx; i++) {
    const x = (i + 0.5) * dxKm;
    h[i] = params.slope * (BASIN.shore0Km - x);
    sigma[i] = params.subsidence * (0.25 + 0.75 * (x / BASIN.lengthKm));
  }
  return {
    params,
    nx,
    dxKm,
    dtKyr,
    steps: 0,
    totalSteps,
    tKyr: 0,
    h,
    sigma,
    base: Float64Array.from(h),
    surfaces: [],
    facies: [],
    cut: [],
    times: [0],
    seaLevels: [seaLevel(params, 0)],
    shorelines: [shorelineOf(h, seaLevel(params, 0), dxKm)],
    influx: 0,
    markEvery: Math.max(1, Math.round(totalSteps / BASIN.timelines)),
  };
}

export const isDone = (s: BasinState) => s.steps >= s.totalSteps;

/** Advance the model by up to n time steps (mutates the state). Returns the number of steps taken. */
export function stepBasin(s: BasinState, n: number): number {
  const { nx, dxKm, dtKyr, h, sigma, params } = s;
  const flux = new Float64Array(nx + 1);
  let done = 0;
  for (; done < n && s.steps < s.totalSteps; done++) {
    const sl = seaLevel(params, s.tKyr);
    flux[0] = params.supply; // sediment enters at the landward edge
    flux[nx] = 0; // closed seaward edge
    const tNew = (s.steps + 1) * dtKyr;
    const cap = dxKm / dtKyr; // converts available sediment thickness (m) into a flux limit
    for (let i = 1; i < nx; i++) {
      const depth = sl - (h[i - 1] + h[i]) / 2;
      // marine transport weakens with water depth (below wave base little sediment moves)
      const k = depth < 0 ? BASIN.kLand : BASIN.kMarine * Math.max(BASIN.kDeepFraction, Math.exp(-depth / BASIN.kDecayDepthM));
      let q = (k * (h[i - 1] - h[i])) / dxKm;
      // the basement is not erodible: a cell can only pass on what it receives plus its own sediment
      if (q > 0) {
        const avail = Math.max(0, h[i - 1] + sigma[i - 1] * s.tKyr - s.base[i - 1]);
        q = Math.min(q, Math.max(0, flux[i - 1]) + avail * cap * (flux[i - 1] < 0 ? 0.5 : 1));
      } else if (q < 0) {
        const avail = Math.max(0, h[i] + sigma[i] * s.tKyr - s.base[i]);
        q = -Math.min(-q, avail * cap * 0.5);
      }
      flux[i] = q;
    }
    for (let i = 0; i < nx; i++) {
      const dh = ((flux[i] - flux[i + 1]) / dxKm) * dtKyr;
      h[i] += dh - sigma[i] * dtKyr;
      if (dh < 0) {
        // erosion: clip older time lines that now stick out above the surface
        const g = Math.max(s.base[i], h[i] + sigma[i] * tNew);
        for (let k = s.surfaces.length - 1; k >= 0 && s.surfaces[k][i] > g + 1e-9; k--) {
          s.cut[k][i] += s.surfaces[k][i] - g;
          s.surfaces[k][i] = g;
        }
      }
    }
    s.influx += params.supply * dtKyr;
    s.steps++;
    s.tKyr = tNew;
    if (s.steps % s.markEvery === 0 || s.steps === s.totalSteps) mark(s);
  }
  return done;
}

function mark(s: BasinState) {
  const sl = seaLevel(s.params, s.tKyr);
  const g = new Float64Array(s.nx);
  const f = new Uint8Array(s.nx);
  for (let i = 0; i < s.nx; i++) {
    g[i] = s.h[i] + s.sigma[i] * s.tKyr;
    f[i] = faciesOf(sl - s.h[i]);
  }
  s.surfaces.push(g);
  s.facies.push(f);
  s.cut.push(new Float32Array(s.nx));
  s.times.push(s.tKyr);
  s.seaLevels.push(sl);
  s.shorelines.push(shorelineOf(s.h, sl, s.dxKm));
}

export function runBasin(params: BasinParams): BasinState {
  const s = createBasin(params);
  stepBasin(s, Infinity);
  return s;
}

/** Sediment area now stored in the section, m·km (equals the influx for a closed section). */
export function storedArea(s: BasinState): number {
  let a = 0;
  for (let i = 0; i < s.nx; i++) a += (s.h[i] + s.sigma[i] * s.tKyr - (s.params.slope * (BASIN.shore0Km - xOf(s, i)))) * s.dxKm;
  return a;
}

/** Present-day elevation of a stored surface (or the basement) at cell i. */
export const elevationNow = (s: BasinState, g: ArrayLike<number>, i: number) => g[i] - s.sigma[i] * s.tKyr;

export type Packet = { topM: number; baseM: number; facies: number; tKyr: number; gapBelow: boolean };

/** Vertical stack of preserved packets at cell i, top first; depths in metres below the surface. */
export function packetsAt(s: BasinState, i: number): Packet[] {
  const out: Packet[] = [];
  const n = s.surfaces.length;
  if (n === 0) return out;
  const top = s.surfaces[n - 1][i];
  for (let k = n - 1; k >= 0; k--) {
    const upper = s.surfaces[k][i];
    const lower = k > 0 ? s.surfaces[k - 1][i] : s.base[i];
    if (upper - lower > 1e-4) out.push({ topM: top - upper, baseM: top - lower, facies: s.facies[k][i], tKyr: s.times[k + 1], gapBelow: k > 0 && s.cut[k - 1][i] >= BASIN.erosionGapM });
  }
  return out;
}

export const cellOf = (s: BasinState, xKm: number) => Math.min(s.nx - 1, Math.max(0, Math.floor(xKm / s.dxKm)));

const FACIES_TEXT = ['Dataran pantai / sungai: pasir dan lanau', 'Muka pantai: pasir', 'Transisi lepas pantai: lanau dan pasir halus', 'Paparan / lepas pantai: lempung'];

/** Synthetic stratigraphic column at position x (km) for the Kolom module. */
export function sampleWell(s: BasinState, xKm: number, title = 'Sumur simulasi'): StratColumn {
  const packets = packetsAt(s, cellOf(s, xKm));
  const beds: Bed[] = [];
  const r = (v: number) => Math.round(v * 10) / 10;
  let lastFacies = -1;
  for (const p of packets) {
    const last = beds[beds.length - 1];
    const f = FACIES[p.facies];
    const lastPacketGap = (last as (Bed & { _gap?: boolean }) | undefined)?._gap;
    if (last && last.lithologyId === f.lithologyId && last.grainSize === f.grainSize && !lastPacketGap) {
      last.baseM = r(p.baseM);
    } else {
      if (last) last.baseContact = lastPacketGap ? 'erosional' : Math.abs(lastFacies - p.facies) === 1 ? 'gradational' : 'sharp';
      beds.push({
        id: `s${beds.length + 1}`,
        topM: r(p.topM),
        baseM: r(p.baseM),
        lithologyId: f.lithologyId,
        grainSize: f.grainSize,
        structures: [],
        fossils: [],
        baseContact: 'sharp',
        description: FACIES_TEXT[p.facies],
        environmentId: f.environmentId,
      });
    }
    (beds[beds.length - 1] as Bed & { _gap?: boolean })._gap = p.gapBelow;
    lastFacies = p.facies;
  }
  const clean = beds
    .map((b) => {
      const { _gap, ...rest } = b as Bed & { _gap?: boolean };
      void _gap;
      return rest as Bed;
    })
    .filter((b) => b.baseM - b.topM >= 0.1);
  for (let k = 1; k < clean.length; k++) clean[k].topM = clean[k - 1].baseM;
  if (clean.length) clean[0].topM = 0;
  return {
    id: `simulasi-${Math.round(xKm)}km`,
    title: `${title} (x ${Math.round(xKm)} km)`,
    kind: 'simulation',
    note: 'Kolom sintetis dari simulasi pengisian cekungan (difusi 1D). Litologi diturunkan dari kedalaman air saat pengendapan.',
    beds: clean,
    sources: [],
    verified: false,
  };
}

export type Regime = 'progradation' | 'retrogradation' | 'aggradation' | 'forced-regression' | 'start';

/** What the shoreline is doing right now and why (drives the explanation box). */
export function regimeOf(s: BasinState): { regime: Regime; shorelineRateKmPerKyr: number; seaLevelRate: number } {
  const n = s.shorelines.length;
  const rate = seaLevelRate(s.params, s.tKyr);
  if (n < 3) return { regime: 'start', shorelineRateKmPerKyr: 0, seaLevelRate: rate };
  const back = Math.min(3, n - 1);
  const a = s.shorelines[n - 1 - back];
  const b = s.shorelines[n - 1];
  const dt = s.times[n - 1] - s.times[n - 1 - back];
  const v = Number.isFinite(a) && Number.isFinite(b) && dt > 0 ? (b - a) / dt : 0;
  const tol = 0.004; // km/kyr
  let regime: Regime = 'aggradation';
  if (v > tol) regime = rate < -0.01 ? 'forced-regression' : 'progradation';
  else if (v < -tol) regime = 'retrogradation';
  return { regime, shorelineRateKmPerKyr: v, seaLevelRate: rate };
}

export type BasinPreset = { id: string; params: BasinParams; wellKm: number };
export const basinPresets: BasinPreset[] = [
  { id: 'delta', params: { supply: 4.5, amplitudeM: 0, periodKyr: 400, trendMPerKyr: 0, subsidence: 0.02, slope: 1.2, durationKyr: 1500 }, wellKm: 105 },
  { id: 'transgression', params: { supply: 1.5, amplitudeM: 0, periodKyr: 400, trendMPerKyr: 0.015, subsidence: 0.02, slope: 1, durationKyr: 1500 }, wellKm: 50 },
  { id: 'cycles', params: { supply: 5, amplitudeM: 25, periodKyr: 400, trendMPerKyr: 0, subsidence: 0.05, slope: 1, durationKyr: 1600 }, wellKm: 80 },
  { id: 'starved', params: { supply: 0.8, amplitudeM: 0, periodKyr: 400, trendMPerKyr: 0, subsidence: 0.06, slope: 1, durationKyr: 1500 }, wellKm: 52 },
];
