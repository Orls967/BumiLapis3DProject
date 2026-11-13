import { stratColumnSchema, type Bed, type GrainSize, type StratColumn } from '@/content/schema';
import { GRAIN_SIZES } from '@/content/schema';

export const grainIndex = (g: GrainSize) => GRAIN_SIZES.indexOf(g);

/** Stable JSON text for export. */
export function serializeColumn(column: StratColumn): string {
  return JSON.stringify(column, null, 2);
}

export type ParseResult = { ok: true; column: StratColumn } | { ok: false; errors: string[] };

/** Parse and validate imported JSON against the column schema. */
export function parseColumn(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`JSON tidak valid: ${(e as Error).message}`] };
  }
  const r = stratColumnSchema.safeParse(raw);
  if (!r.success) return { ok: false, errors: r.error.issues.map((i) => `${i.path.join('.') || '(akar)'}: ${i.message}`) };
  const errors = checkOrder(r.data.beds);
  return errors.length ? { ok: false, errors } : { ok: true, column: r.data };
}

/** Beds must be listed top → bottom without gaps or overlaps. */
export function checkOrder(beds: Bed[]): string[] {
  const errors: string[] = [];
  for (let i = 1; i < beds.length; i++) {
    if (Math.abs(beds[i].topM - beds[i - 1].baseM) > 1e-6)
      errors.push(`Lapisan ${beds[i].id}: puncak (${beds[i].topM} m) tidak sama dengan dasar lapisan di atasnya (${beds[i - 1].baseM} m).`);
  }
  if (new Set(beds.map((b) => b.id)).size !== beds.length) errors.push('Id lapisan harus unik.');
  return errors;
}

/** Re-stack beds from a start depth using their thicknesses (used by the editor after edits). */
export function restack(beds: Bed[], startM = 0): Bed[] {
  let top = startM;
  return beds.map((b) => {
    const t = Math.max(0.01, b.baseM - b.topM);
    const out = { ...b, topM: round(top), baseM: round(top + t) };
    top += t;
    return out;
  });
}
const round = (v: number) => Math.round(v * 1000) / 1000;

export const columnThickness = (c: StratColumn) => (c.beds.length ? c.beds[c.beds.length - 1].baseM - c.beds[0].topM : 0);

/** Grain-size trend of a run of beds (listed top → bottom), read upwards. */
export function grainTrend(beds: Bed[]): 'fining-up' | 'coarsening-up' | 'uniform' | 'cyclic' {
  // coal and evaporite are not clastic: their "grain size" says nothing about energy
  const clastic = beds.filter((b) => b.lithologyId !== 'coal' && b.lithologyId !== 'evaporite');
  if (clastic.length > 0 && clastic.length < beds.length) return grainTrend(clastic);
  if (beds.length === 0) return 'uniform';
  // sample (base, top) of each bed from the bottom upwards
  const seq: number[] = [];
  for (let i = beds.length - 1; i >= 0; i--) {
    seq.push(grainIndex(beds[i].grainSize), grainIndex(beds[i].grainSizeTop ?? beds[i].grainSize));
  }
  let up = 0;
  let down = 0;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] > seq[i - 1]) up += seq[i] - seq[i - 1];
    else if (seq[i] < seq[i - 1]) down += seq[i - 1] - seq[i];
  }
  const net = seq[seq.length - 1] - seq[0];
  if (up + down === 0) return 'uniform';
  if (up >= 3 && down >= 3 && Math.abs(net) <= 1) return 'cyclic';
  if (net >= 1 && up >= down * 1.5) return 'coarsening-up';
  if (net <= -1 && down >= up * 1.5) return 'fining-up';
  if (up > 0 && down > 0 && beds.length >= 4) return 'cyclic';
  return net > 0 ? 'coarsening-up' : net < 0 ? 'fining-up' : 'uniform';
}
