import { describe, expect, it } from 'vitest';
import { builtinColumnById } from '@/content/columns';
import { environmentById, environments } from '@/content/environments';
import { formationById } from '@/content/formations';
import { lithologyById } from '@/content/lithologies';
import { environmentSchema, type Observation } from '@/content/schema';
import { colors, environmentNames, fossils, geometries, roundings, sortings, specials, structures, trends } from '@/content/vocab';
import { basinPresets, runBasin, sampleWell } from '@/lib/sedsim/basin';
import { interpretColumn, splitIntervals, trendOf } from './column';
import { interpret, scoreEnvironment } from './engine';
import { exampleObservations } from '@/content/examples';

const top = (obs: Observation) => interpret(obs, environments).top[0].env.id;

describe('environment content', () => {
  it('has 14 valid environments whose rules use known vocabulary', () => {
    expect(environments.length).toBe(14);
    expect(new Set(environments.map((e) => e.id))).toEqual(new Set(Object.keys(environmentNames)));
    const vocab: Record<string, Set<string>> = {
      lithology: new Set(lithologyById.keys()),
      grainSize: new Set(['mud', 'fine-sand', 'medium-sand', 'coarse-sand', 'gravel']),
      sorting: new Set(sortings.map((v) => v.id)),
      rounding: new Set(roundings.map((v) => v.id)),
      structures: new Set(structures.map((v) => v.id)),
      fossils: new Set(fossils.map((v) => v.id)),
      color: new Set(colors.map((v) => v.id)),
      trend: new Set(trends.map((v) => v.id)),
      geometry: new Set(geometries.map((v) => v.id)),
      special: new Set(specials.map((v) => v.id)),
    };
    for (const e of environments) {
      const r = environmentSchema.safeParse(e);
      expect(r.success, `${e.id}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true);
      for (const rule of e.rules) expect(vocab[rule.feature].has(rule.value), `${e.id}: ${rule.feature}=${rule.value}`).toBe(true);
      for (const a of e.adjacent) expect(environmentById.has(a), `${e.id} adjacent ${a}`).toBe(true);
      for (const b of e.typicalSuccession) expect(lithologyById.has(b.lithologyId)).toBe(true);
      expect(e.rules.some((x) => x.weight > 0)).toBe(true);
    }
  });
  it('adjacency (Walther) is symmetric', () => {
    for (const e of environments) for (const a of e.adjacent) expect(environmentById.get(a)!.adjacent, `${a} ↔ ${e.id}`).toContain(e.id);
  });
});

describe('rule engine: the eight observation cases of BUMILAPIS.md 4.6', () => {
  const expected: Record<string, string> = {
    turbidite: 'submarine-fan',
    delta: 'delta',
    meander: 'meandering-river',
    desert: 'desert',
    reef: 'carbonate-platform',
    tidal: 'tidal-flat',
    glacial: 'glacial',
    pelagic: 'pelagic',
  };
  for (const ex of exampleObservations) {
    it(`${ex.id} → ${expected[ex.id]}`, () => {
      expect(top(ex.observation)).toBe(expected[ex.id]);
    });
  }
  it('every score is traceable to the rules that produced it', () => {
    for (const ex of exampleObservations) {
      for (const c of interpret(ex.observation, environments).candidates) {
        const sum = [...c.supporting, ...c.opposing].reduce((s, r) => s + r.weight, 0);
        expect(sum).toBe(c.raw);
        expect(c.score).toBeCloseTo(c.maxPositive > 0 ? Math.min(1, Math.max(0, c.raw / c.maxPositive)) : 0, 10);
        for (const r of [...c.supporting, ...c.opposing]) expect(c.env.rules).toContain(r);
      }
    }
  });
  it('empty features do not punish and an empty form scores nothing', () => {
    const res = interpret({}, environments);
    expect(res.top.every((c) => c.score === 0)).toBe(true);
    expect(res.suggestions).toEqual([]);
    const a = scoreEnvironment(environmentById.get('delta')!, { trend: 'coarsening-up' });
    expect(a.score).toBe(1);
  });
  it('suggests observations that separate the two leading candidates', () => {
    const res = interpret({ lithology: ['sandstone'], trend: 'coarsening-up' }, environments);
    expect(res.suggestions.length).toBeGreaterThan(0);
    for (const s of res.suggestions) expect(s.difference).toBeGreaterThanOrEqual(3);
  });
});

describe('column interpretation', () => {
  it('finds the trends of the teaching column', () => {
    const col = builtinColumnById.get('teaching')!;
    const res = interpretColumn(col, environments);
    const find = (depthM: number) => res.intervals.find((i) => i.topM <= depthM && i.baseM > depthM)!;
    expect(find(120).trend).toBe('cyclic');
    expect(find(120).best!.env.id).toBe('submarine-fan');
    expect(find(75).best!.env.id).toBe('carbonate-platform');
    expect(find(40).trend).toBe('coarsening-up');
    expect(find(40).best!.env.id).toBe('delta');
    expect(find(10).trend).toBe('fining-up');
    expect(find(10).best!.env.id).toBe('meandering-river');
  });

  it('case 9: South Sumatra records transgression up to Gumai, then regression', () => {
    const col = builtinColumnById.get('south-sumatra')!;
    const res = interpretColumn(col, environments);
    expect(res.summary).toBe('transgressive-regressive');
    const deepest = res.intervals[res.deepest];
    expect(deepest.formationIds).toContain('gumai');
    expect(formationById.has('gumai')).toBe(true);
    const depths = res.intervals.map((i) => i.best?.env.relativeWaterDepth ?? null);
    const dMax = depths[res.deepest]!;
    // oldest sedimentary interval and youngest interval are both continental
    const sed = depths.filter((d): d is number => d !== null);
    expect(sed[sed.length - 1]).toBeLessThanOrEqual(0);
    expect(sed[0]).toBeLessThanOrEqual(0);
    expect(dMax).toBeGreaterThanOrEqual(2.5);
    // crystalline basement is not interpreted
    expect(res.intervals[res.intervals.length - 1].best).toBeNull();
  });

  it('simulation wells: progradation reads as coarsening-up, transgression as fining-up', () => {
    const delta = basinPresets.find((p) => p.id === 'delta')!;
    const well = sampleWell(runBasin(delta.params), delta.wellKm);
    expect(trendOf([...well.beds].reverse())).toBe('coarsening-up');
    expect(splitIntervals(well).length).toBe(1);
    const tr = basinPresets.find((p) => p.id === 'transgression')!;
    const well2 = sampleWell(runBasin(tr.params), tr.wellKm);
    expect(trendOf([...well2.beds].reverse())).toBe('fining-up');
  });

  it('warns when non-neighbouring facies touch without an erosion surface', () => {
    const base = { structures: [], fossils: [] };
    const col = {
      id: 'x',
      title: 'x',
      kind: 'user' as const,
      sources: [],
      verified: false,
      beds: [
        { ...base, id: 'a', topM: 0, baseM: 10, lithologyId: 'limestone', grainSize: 'c-sand' as const, fossils: ['coral', 'algae'], baseContact: 'sharp' as const },
        { ...base, id: 'b', topM: 10, baseM: 20, lithologyId: 'chert', grainSize: 'clay' as const, fossils: ['radiolaria'], baseContact: 'sharp' as const },
      ],
    };
    const res = interpretColumn(col, environments);
    expect(res.intervals.length).toBe(2);
    expect(res.boundaries[0].waltherWarning).toBe(true);
    const eroded = { ...col, beds: [{ ...col.beds[0], baseContact: 'erosional' as const }, col.beds[1]] };
    expect(interpretColumn(eroded, environments).boundaries[0].waltherWarning).toBe(false);
  });
});
