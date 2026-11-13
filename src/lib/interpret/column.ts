import type { Bed, Environment, GrainSize, Observation, StratColumn } from '@/content/schema';
import { GRAIN_SIZES } from '@/content/schema';
import { interpret, type Candidate } from './engine';

/** Interpretation of a whole stratigraphic column, interval by interval (BUMILAPIS.md 4.6). */
export type Trend = NonNullable<Observation['trend']>;
export type Interval = {
  /** Beds of the interval, top first (same order as the column). */
  beds: Bed[];
  topM: number;
  baseM: number;
  trend: Trend;
  observation: Observation;
  /** Empty for crystalline basement, which is not a depositional environment. */
  candidates: Candidate[];
  best: Candidate | null;
  formationIds: string[];
  /** Contact at the base of the interval. */
  baseContact: Bed['baseContact'];
};
export type Boundary = {
  /** Index of the interval above the boundary. */
  upper: number;
  change: 'transgression' | 'regression' | 'none';
  /** Walther's-law warning: neighbouring facies that do not normally lie side by side, without an erosion surface. */
  waltherWarning: boolean;
};
export type ColumnInterpretation = {
  /** Top first. */
  intervals: Interval[];
  /** boundaries[k] separates intervals[k] (above) from intervals[k+1] (below). */
  boundaries: Boundary[];
  /** Index of the deepest-water interval, or −1. */
  deepest: number;
  summary: 'transgressive-regressive' | 'transgressive' | 'regressive' | 'none';
};

const rank = (g: GrainSize) => GRAIN_SIZES.indexOf(g);
const GROUP: Record<string, 'clastic' | 'carbonate' | 'crystalline'> = { limestone: 'carbonate', dolomite: 'carbonate', marl: 'carbonate', igneous: 'crystalline', metamorphic: 'crystalline' };
const groupOf = (b: Bed) => GROUP[b.lithologyId] ?? 'clastic';
const isCoal = (b: Bed) => b.lithologyId === 'coal';
const meanRank = (b: Bed) => (rank(b.grainSize) + rank(b.grainSizeTop ?? b.grainSize)) / 2;
const breaks = (b: Bed) => b.baseContact === 'erosional' || b.baseContact === 'unconformity';

/** Grain-size trend of a bottom → top list of beds. */
export function trendOf(bedsUp: Bed[]): Trend {
  const seq: number[] = [];
  for (const b of bedsUp) {
    if (isCoal(b)) continue;
    seq.push(rank(b.grainSize), rank(b.grainSizeTop ?? b.grainSize));
  }
  if (seq.length < 2) return 'uniform';
  let ups = 0;
  let downs = 0;
  let changes = 0;
  let last = 0;
  for (let i = 1; i < seq.length; i++) {
    const d = seq[i] - seq[i - 1];
    if (d === 0) continue;
    if (d > 0) ups += d;
    else downs -= d;
    if (last !== 0 && Math.sign(d) !== last) changes++;
    last = Math.sign(d);
  }
  if (ups === 0 && downs === 0) return 'uniform';
  if (changes >= 3 && Math.min(ups, downs) / Math.max(ups, downs) >= 0.5) return 'cyclic';
  if (ups - downs >= 1 && ups >= 2 * downs) return 'coarsening-up';
  if (downs - ups >= 1 && downs >= 2 * ups) return 'fining-up';
  return changes >= 2 ? 'cyclic' : 'uniform';
}

/** Split a column into intervals (returned bottom → top, beds bottom → top inside). */
export function splitIntervals(column: StratColumn): Bed[][] {
  const up = [...column.beds].reverse();
  // 1. hard breaks: erosion surfaces, unconformities and changes of rock family
  const segments: Bed[][] = [];
  for (const b of up) {
    const cur = segments[segments.length - 1];
    if (!cur || breaks(b) || groupOf(b) !== groupOf(cur[cur.length - 1])) segments.push([b]);
    else cur.push(b);
  }
  const out: Bed[][] = [];
  for (const seg of segments) {
    // 2. monotone grain-size runs inside a segment (coal seams ride along)
    const runs: Bed[][] = [];
    let dir = 0;
    let prev: number | null = null;
    for (const b of seg) {
      const cur = runs[runs.length - 1];
      if (isCoal(b)) {
        if (cur) cur.push(b);
        else runs.push([b]);
        continue;
      }
      const m = meanRank(b);
      if (!cur || prev === null) {
        if (cur) cur.push(b);
        else runs.push([b]);
      } else {
        const d = Math.sign(m - prev);
        if (dir !== 0 && d !== 0 && d !== dir) {
          runs.push([b]);
          dir = 0;
        } else {
          cur.push(b);
          if (d !== 0) dir = d;
        }
      }
      prev = m;
    }
    const clastics = (r: Bed[]) => r.filter((b) => !isCoal(b)).length;
    // 3. three or more consecutive short runs are one rhythmic package (e.g. turbidites)
    const merged: Bed[][] = [];
    for (let i = 0; i < runs.length; ) {
      let j = i;
      while (j < runs.length && clastics(runs[j]) <= 2) j++;
      if (j - i >= 3) {
        merged.push(runs.slice(i, j).flat());
        i = j;
      } else {
        merged.push(runs[i]);
        i++;
      }
    }
    // 4. a leftover single bed joins the run below it when the contact is gradational
    const final: Bed[][] = [];
    for (const run of merged) {
      const below = final[final.length - 1];
      if (below && clastics(run) <= 1 && run[0].baseContact === 'gradational') below.push(...run);
      else final.push(run);
    }
    out.push(...final);
  }
  return out;
}

const uniq = <T,>(a: T[]) => [...new Set(a)];

/** Build the observation an interval offers to the rule engine. */
export function observe(bedsUp: Bed[]): { observation: Observation; trend: Trend } {
  const trend = trendOf(bedsUp);
  const lith = uniq(bedsUp.map((b) => b.lithologyId));
  const thick = new Map<GrainSize, number>();
  for (const b of bedsUp) if (!isCoal(b)) thick.set(b.grainSize, (thick.get(b.grainSize) ?? 0) + (b.baseM - b.topM));
  const dominant = [...thick.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const structures = uniq(bedsUp.flatMap((b) => b.structures));
  if (breaks(bedsUp[0]) && bedsUp[0].baseContact === 'erosional' && !structures.includes('erosional-base')) structures.push('erosional-base');
  let fossils = uniq(bedsUp.flatMap((b) => b.fossils));
  if (fossils.some((f) => f !== 'none')) fossils = fossils.filter((f) => f !== 'none');
  const special: string[] = [];
  if (lith.includes('coal')) special.push('coal');
  if (lith.includes('evaporite')) special.push('evaporite');
  if (lith.some((l) => GROUP[l] === 'carbonate')) special.push('carbonate');
  if (lith.includes('tuff')) special.push('volcanic');
  const hasSand = bedsUp.some((b) => !isCoal(b) && meanRank(b) >= rank('vf-sand'));
  const hasMud = bedsUp.some((b) => !isCoal(b) && meanRank(b) < rank('vf-sand'));
  if (trend === 'cyclic' && hasSand && hasMud) special.push('rhythmic');
  const observation: Observation = { lithology: lith, structures, fossils, trend, special };
  if (dominant) observation.grainSize = dominant;
  return { observation, trend };
}

const DEPTH_STEP = 0.75;

export function interpretColumn(column: StratColumn, envs: Environment[]): ColumnInterpretation {
  const byId = new Map(envs.map((e) => [e.id, e]));
  const intervals: Interval[] = splitIntervals(column)
    .map((bedsUp) => {
      const { observation, trend } = observe(bedsUp);
      const crystalline = bedsUp.every((b) => groupOf(b) === 'crystalline');
      const candidates = crystalline ? [] : interpret(observation, envs).top;
      const beds = [...bedsUp].reverse();
      return {
        beds,
        topM: beds[0].topM,
        baseM: beds[beds.length - 1].baseM,
        trend,
        observation,
        candidates,
        best: candidates[0] && candidates[0].score > 0 ? candidates[0] : null,
        formationIds: uniq(beds.map((b) => b.formationId).filter((f): f is string => !!f)),
        baseContact: bedsUp[0].baseContact,
      };
    })
    .reverse();

  const depth = (i: Interval) => (i.best ? i.best.env.relativeWaterDepth : null);
  const boundaries: Boundary[] = [];
  for (let k = 0; k + 1 < intervals.length; k++) {
    const upper = intervals[k];
    const lower = intervals[k + 1];
    const du = depth(upper);
    const dl = depth(lower);
    let change: Boundary['change'] = 'none';
    if (du !== null && dl !== null) {
      if (du - dl >= DEPTH_STEP) change = 'transgression';
      else if (dl - du >= DEPTH_STEP) change = 'regression';
    }
    let waltherWarning = false;
    if (upper.best && lower.best && upper.best.env.id !== lower.best.env.id && !(upper.baseContact === 'erosional' || upper.baseContact === 'unconformity')) {
      const a = byId.get(upper.best.env.id)!;
      const b = byId.get(lower.best.env.id)!;
      waltherWarning = !a.adjacent.includes(b.id) && !b.adjacent.includes(a.id);
    }
    boundaries.push({ upper: k, change, waltherWarning });
  }

  // deepest-water interval: thickest among those at the maximum depth
  let deepest = -1;
  intervals.forEach((iv, k) => {
    const d = depth(iv);
    if (d === null) return;
    const cur = deepest >= 0 ? depth(intervals[deepest])! : -Infinity;
    if (d > cur || (d === cur && iv.baseM - iv.topM > intervals[deepest].baseM - intervals[deepest].topM)) deepest = k;
  });
  let summary: ColumnInterpretation['summary'] = 'none';
  if (deepest >= 0) {
    const dMax = depth(intervals[deepest])!;
    const withDepth = intervals.map(depth).filter((d): d is number => d !== null);
    const oldest = withDepth[withDepth.length - 1];
    const youngest = withDepth[0];
    const rises = dMax - oldest >= DEPTH_STEP;
    const falls = dMax - youngest >= DEPTH_STEP;
    summary = rises && falls ? 'transgressive-regressive' : rises ? 'transgressive' : falls ? 'regressive' : 'none';
  }
  return { intervals, boundaries, deepest, summary };
}
