import { describe, expect, it } from 'vitest';
import { scenarios, scenarioById } from '@/content/scenarios';
import { stratColumnSchema } from '@/content/schema';
import { checkOrder } from '../columnIO';
import { BLOCK_BOTTOM, BLOCK_SIZE, buildModel, sampleWell, scaleOp, surfaceAt, unitAt, wellUnits, type Op } from './model';

const ops = (id: string, patch = {}) => {
  const s = scenarioById.get(id)!;
  return s.build({ ...s.defaults, ...patch }).map((e) => e.op);
};
const dedupe = (a: string[]) => a.filter((v, i) => i === 0 || v !== a[i - 1]);

describe('strata model', () => {
  it('layer cake: wells show the full sequence, oldest at the bottom', () => {
    const m = buildModel(ops('layer-cake'));
    expect(wellUnits(m, 300, 700)).toEqual(['F', 'E', 'D', 'C', 'B', 'A', 'basement']);
    const well = sampleWell(m, 300, 700);
    expect(stratColumnSchema.safeParse(well).success).toBe(true);
    expect(checkOrder(well.beds)).toEqual([]);
    expect(well.beds[0].topM).toBe(0);
    expect(well.beds[0].baseM).toBeCloseTo(80); // layer F
    expect(well.beds[well.beds.length - 1].baseM).toBeCloseTo(surfaceAt(m, 300, 700) - BLOCK_BOTTOM, 1);
  });

  it('keeps every column contiguous for all scenarios', () => {
    for (const s of scenarios) {
      const m = buildModel(s.build(s.defaults).map((e) => e.op));
      for (let i = 0; i <= 10; i++)
        for (let j = 0; j <= 10; j++) {
          const col = m.column((i / 10) * BLOCK_SIZE, (j / 10) * BLOCK_SIZE);
          expect(col[0].base, s.id).toBe(-Infinity);
          for (let k = 1; k < col.length; k++) expect(col[k].base, `${s.id} ${i},${j}`).toBeCloseTo(col[k - 1].top, 6);
          for (const iv of col) expect(iv.top, s.id).toBeGreaterThan(iv.base);
        }
    }
  });

  it('erosion truncates the top of the sequence', () => {
    const m = buildModel(ops('layer-cake', { erosion: 100 }));
    expect(wellUnits(m, 500, 500)[0]).toBe('E');
    expect(surfaceAt(m, 500, 500)).toBeCloseTo(surfaceAt(buildModel(ops('layer-cake')), 500, 500) - 100);
  });

  it('reverse fault repeats layers in a well that crosses the fault', () => {
    const m = buildModel(ops('reverse-fault'));
    let repeated = 0;
    for (let x = 50; x < BLOCK_SIZE; x += 50) {
      const seq = dedupe(wellUnits(m, x, 500));
      if (new Set(seq).size < seq.length) repeated++;
      // older over younger somewhere = repetition; never a gap in the footwall sequence
    }
    expect(repeated).toBeGreaterThan(2);
    const far = dedupe(wellUnits(m, 20, 500));
    expect(new Set(far).size).toBe(far.length);
  });

  it('normal fault removes layers in a well that crosses the fault, without repeats', () => {
    const m = buildModel(ops('normal-fault', { erosion: 0 }));
    const order = ['F', 'E', 'D', 'C', 'B', 'A', 'basement'];
    let missing = 0;
    for (let x = 50; x < BLOCK_SIZE; x += 25) {
      const seq = dedupe(wellUnits(m, x, 500));
      expect(new Set(seq).size, `no repeats at x=${x}`).toBe(seq.length);
      const idx = seq.map((u) => order.indexOf(u));
      for (let k = 1; k < idx.length; k++) expect(idx[k]).toBeGreaterThan(idx[k - 1]);
      if (idx.some((v, k) => k > 0 && v - idx[k - 1] > 1)) missing++;
    }
    expect(missing).toBeGreaterThan(2);
  });

  it('angular unconformity: flat cover over tilted, truncated beds with an unconformity contact', () => {
    const m = buildModel(ops('angular-unconformity'));
    const seqs = [100, 500, 900].map((x) => wellUnits(m, x, 500));
    for (const s of seqs) expect(s.slice(0, 3)).toEqual(['I', 'H', 'G']);
    expect(new Set(seqs.map((s) => s[3])).size).toBeGreaterThan(1); // different units subcrop below G
    const well = sampleWell(m, 500, 500);
    expect(well.beds[2].baseContact).toBe('unconformity');
    expect(well.beds.filter((b) => b.baseContact === 'unconformity')).toHaveLength(1);
    // the cover is flat
    expect(surfaceAt(m, 100, 500)).toBeCloseTo(surfaceAt(m, 900, 500));
  });

  it('folds expose the oldest beds in the core of an eroded anticline and the youngest in a syncline', () => {
    const order = ['basement', 'A', 'B', 'C', 'D', 'E', 'F'];
    const anti = buildModel(ops('anticline'));
    expect(order.indexOf(wellUnits(anti, 500, 500)[0])).toBeLessThan(order.indexOf(wellUnits(anti, 60, 500)[0]));
    const syn = buildModel(ops('syncline'));
    expect(order.indexOf(wellUnits(syn, 500, 500)[0])).toBeGreaterThan(order.indexOf(wellUnits(syn, 60, 500)[0]));
  });

  it('intrusions cut the layers and strike-slip offsets the dike', () => {
    const m = buildModel(ops('intrusion'));
    expect(wellUnits(m, 650, 350)).toEqual(['dike']);
    expect(wellUnits(m, 400, 600)).toContain('sill');
    expect(wellUnits(m, 850, 600)).not.toContain('sill');
    const ss = buildModel(ops('strike-slip'));
    const dikeX = (y: number) => {
      for (let x = 0; x <= BLOCK_SIZE; x += 5) if (wellUnits(ss, x, y)[0] === 'dike') return x;
      return -1;
    };
    expect(Math.abs(dikeX(480) - dikeX(520))).toBeGreaterThan(100);
  });

  it('unitAt agrees with wells and scaleOp(…, 0) is a no-op', () => {
    const list = ops('reverse-fault');
    const m = buildModel(list);
    expect(unitAt(m, 500, 500, 9999)).toBeNull();
    expect(unitAt(m, 500, 500, surfaceAt(m, 500, 500) - 1)?.unitId).toBe(wellUnits(m, 500, 500)[0]);
    const without = buildModel([list[0]]);
    const zeroed = buildModel([list[0], ...list.slice(1).map((o: Op) => scaleOp(o, 0))]);
    expect(wellUnits(zeroed, 400, 400)).toEqual(wellUnits(without, 400, 400));
  });
});

import { sliceLine } from './raster';

describe('sliceLine', () => {
  it('clips the slice to the block footprint', () => {
    const s = sliceLine(0, 0)!;
    expect(s.p0[0]).toBeCloseTo(500);
    expect(Math.abs(s.p1[1] - s.p0[1])).toBeCloseTo(1000);
    expect(sliceLine(0, 600)).toBeNull();
    const d = sliceLine(45, 0)!;
    expect(Math.hypot(d.p1[0] - d.p0[0], d.p1[1] - d.p0[1])).toBeCloseTo(1000 * Math.SQRT2, 3);
  });
});
