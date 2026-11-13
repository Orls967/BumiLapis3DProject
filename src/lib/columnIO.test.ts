import { describe, expect, it } from 'vitest';
import { builtinColumns } from '@/content/columns';
import { grainTrend, parseColumn, restack, serializeColumn } from './columnIO';

describe('column import/export', () => {
  it('round-trips built-in columns: import → export gives identical data', () => {
    for (const c of builtinColumns) {
      const text = serializeColumn(c);
      const parsed = parseColumn(text);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.column).toEqual(c);
        const again = parseColumn(serializeColumn(parsed.column));
        expect(again.ok && again.column).toEqual(c);
        expect(serializeColumn(parsed.column)).toBe(serializeColumn((again as { column: typeof c }).column));
      }
    }
  });

  it('rejects invalid JSON, schema violations and gaps', () => {
    expect(parseColumn('{oops').ok).toBe(false);
    expect(parseColumn(JSON.stringify({ id: 'x' })).ok).toBe(false);
    const c = structuredClone(builtinColumns[0]);
    c.beds[1].topM += 1;
    expect(parseColumn(JSON.stringify(c)).ok).toBe(false);
  });

  it('restacks beds contiguously', () => {
    const beds = restack([...builtinColumns[0].beds].reverse());
    for (let i = 1; i < beds.length; i++) expect(beds[i].topM).toBeCloseTo(beds[i - 1].baseM);
    expect(beds[0].topM).toBe(0);
  });
});

describe('grainTrend', () => {
  const beds = builtinColumns[0].beds;
  it('reads the teaching column packages correctly', () => {
    expect(grainTrend(beds.slice(0, 4))).toBe('fining-up'); // fluvial
    expect(grainTrend(beds.slice(4, 8))).toBe('coarsening-up'); // delta (coal on top is clay-sized)
    expect(grainTrend(beds.slice(11, 18))).toBe('cyclic'); // turbidites
    expect(grainTrend(beds.slice(9, 10))).toBe('uniform');
  });
});
