/** Grain settling velocity (BUMILAPIS.md 4.5.2). SI units: diameter in m, result in m/s. */
export const WATER = { densityKgM3: 1000, kinematicViscosityM2S: 1.0e-6 } as const; // water at 20 °C
export const QUARTZ_DENSITY = 2650;
const G = 9.81;

export type SettlingOptions = { grainDensity?: number; fluidDensity?: number; nu?: number; c1?: number; c2?: number };

/** Stokes' law, valid for fine grains (particle Reynolds number < ~1). */
export function stokesVelocity(dM: number, o: SettlingOptions = {}): number {
  const rhoF = o.fluidDensity ?? WATER.densityKgM3;
  const rhoS = o.grainDensity ?? QUARTZ_DENSITY;
  const mu = (o.nu ?? WATER.kinematicViscosityM2S) * rhoF;
  return ((rhoS - rhoF) * G * dM * dM) / (18 * mu);
}

/** Ferguson & Church (2004): one equation for all sizes; C1 = 18, C2 = 1.0 for natural grains. */
export function fergusonChurch(dM: number, o: SettlingOptions = {}): number {
  const rhoF = o.fluidDensity ?? WATER.densityKgM3;
  const R = ((o.grainDensity ?? QUARTZ_DENSITY) - rhoF) / rhoF;
  const nu = o.nu ?? WATER.kinematicViscosityM2S;
  const c1 = o.c1 ?? 18;
  const c2 = o.c2 ?? 1.0;
  return (R * G * dM * dM) / (c1 * nu + Math.sqrt(0.75 * c2 * R * G * dM * dM * dM));
}

export const particleReynolds = (dM: number, w: number, nu: number = WATER.kinematicViscosityM2S) => (w * dM) / nu;

/** Deterministic pseudo-random generator so that simulations are reproducible in tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TubeClass = { id: string; dMm: number; share: number };
export type TubeState = {
  heightM: number;
  tS: number;
  /** Per particle: class index, horizontal position 0..1, height above the tube floor (m), settled flag, settle order. */
  cls: Uint8Array;
  x: Float32Array;
  y: Float32Array;
  settled: Uint8Array;
  order: Int32Array;
  w: Float32Array;
  nSettled: number;
  classes: TubeClass[];
};

/** Fill a tube of still water with a well-mixed suspension. */
export function createTube(classes: TubeClass[], n: number, heightM: number, seed = 1): TubeState {
  const rnd = mulberry32(seed);
  const total = classes.reduce((s, c) => s + c.share, 0);
  const cls = new Uint8Array(n);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let r = rnd() * total;
    let k = 0;
    while (k < classes.length - 1 && r > classes[k].share) r -= classes[k++].share;
    cls[i] = k;
    x[i] = rnd();
    y[i] = (0.02 + 0.98 * rnd()) * heightM;
    // ±10 % size scatter inside a class
    w[i] = fergusonChurch((classes[k].dMm / 1000) * (0.9 + 0.2 * rnd()));
  }
  return { heightM, tS: 0, cls, x, y, settled: new Uint8Array(n), order: new Int32Array(n).fill(-1), w, nSettled: 0, classes };
}

/** Advance the tube by dt seconds of model time. Returns true while grains are still falling. */
export function stepTube(s: TubeState, dtS: number): boolean {
  const n = s.cls.length;
  // collect arrivals of this step and settle them in order of arrival time
  const arrivals: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (s.settled[i]) continue;
    const fall = s.w[i] * dtS;
    if (fall >= s.y[i]) arrivals.push([s.y[i] / s.w[i], i]);
    else s.y[i] -= fall;
  }
  arrivals.sort((a, b) => a[0] - b[0]);
  for (const [, i] of arrivals) {
    s.y[i] = 0;
    s.settled[i] = 1;
    s.order[i] = s.nSettled++;
  }
  s.tS += dtS;
  return s.nSettled < n;
}

/** Mean class index of the settled pile in `bins` slices from bottom to top (graded bedding check). */
export function pileProfile(s: TubeState, bins: number): number[] {
  const sum = new Array<number>(bins).fill(0);
  const cnt = new Array<number>(bins).fill(0);
  for (let i = 0; i < s.cls.length; i++) {
    if (!s.settled[i]) continue;
    const b = Math.min(bins - 1, Math.floor((s.order[i] / Math.max(1, s.nSettled)) * bins));
    sum[b] += s.classes[s.cls[i]].dMm;
    cnt[b]++;
  }
  return sum.map((v, k) => (cnt[k] ? v / cnt[k] : NaN));
}
