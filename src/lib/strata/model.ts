import { lithologyById } from '@/content/lithologies';
import type { Bed, StratColumn } from '@/content/schema';
import { degToRad } from '../units';

/**
 * Simple deterministic model of a block of layered rock.
 * The block is described functionally: column(x, y) returns the vertical stack of unit
 * intervals at a map position. Each history operation wraps the previous column function.
 * Coordinates: x, y ∈ [0, BLOCK_SIZE] metres; z = elevation in metres (up positive).
 */
export const BLOCK_SIZE = 1000;
export const BLOCK_BOTTOM = -520;
export const DATUM = -440;

export type Unit = {
  id: string;
  name: string;
  lithologyId: string;
  thicknessM: number;
  environmentId?: string;
  /** Relative age label only; the block is a teaching model without absolute ages. */
  ageLabel?: string;
  description?: string;
};

export type BaseKind = 'conformable' | 'unconformity' | 'fault' | 'intrusive';
/** Vertical interval of one unit; intervals are ordered bottom → top and contiguous. */
export type Interval = { unitId: string; base: number; top: number; baseKind: BaseKind };

export type Op =
  | { type: 'deposit'; units: Unit[] }
  | { type: 'tilt'; angleDeg: number; azimuthDeg: number }
  | { type: 'fold'; amplitudeM: number; wavelengthM: number; axisAzimuthDeg: number }
  | { type: 'fault'; kind: 'normal' | 'reverse' | 'strike-slip'; dipDeg: number; strikeDeg: number; throwM: number; positionM: number }
  | { type: 'erode'; depthM: number }
  | { type: 'intrude'; kind: 'dike'; unit: Unit; positionM: number; widthM: number; strikeDeg: number }
  | { type: 'intrude'; kind: 'sill'; unit: Unit; levelM: number; thicknessM: number; fromM: number; toM: number; strikeDeg: number };

export type ColumnFn = (x: number, y: number) => Interval[];
export type Model = { column: ColumnFn; units: Map<string, Unit>; ops: Op[] };

export const BASEMENT: Unit = {
  id: 'basement',
  name: 'Batuan dasar',
  lithologyId: 'metamorphic',
  thicknessM: 0,
  ageLabel: 'tertua',
  description: 'Batuan dasar kristalin di bawah tumpukan sedimen.',
};

const C = BLOCK_SIZE / 2;
const EPS = 1e-6;
const topOf = (col: Interval[]) => col[col.length - 1].top;

function shift(col: Interval[], dz: number): Interval[] {
  return col.map((i) => ({ ...i, base: i.base + dz, top: i.top + dz }));
}
/** Keep the part of the column inside [lo, hi]. */
function clip(col: Interval[], lo: number, hi: number): Interval[] {
  const out: Interval[] = [];
  for (const i of col) {
    const base = Math.max(i.base, lo);
    const top = Math.min(i.top, hi);
    if (top - base > EPS) out.push({ ...i, base, top, baseKind: base > i.base + EPS ? 'conformable' : i.baseKind });
  }
  return out;
}
/** Replace everything between lo and hi with an intrusive unit. */
function carve(col: Interval[], lo: number, hi: number, unitId: string): Interval[] {
  const colTop = topOf(col);
  const h = Math.min(hi, colTop);
  if (h - lo <= EPS) return col;
  const below = clip(col, -Infinity, lo);
  const above = clip(col, h, Infinity).map((i, k) => (k === 0 ? { ...i, baseKind: 'intrusive' as const } : i));
  return [...below, { unitId, base: lo, top: h, baseKind: 'intrusive' }, ...above];
}

/** Signed horizontal distance from the block centre along an azimuth (degrees, 0 = +x, 90 = +y). */
const along = (x: number, y: number, azDeg: number) => {
  const a = degToRad(azDeg);
  return (x - C) * Math.cos(a) + (y - C) * Math.sin(a);
};

function maxTop(col: ColumnFn): number {
  let m = -Infinity;
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) m = Math.max(m, topOf(col((i / 8) * BLOCK_SIZE, (j / 8) * BLOCK_SIZE)));
  return m;
}

/** Build the block by applying the history operations in order. */
export function buildModel(ops: Op[]): Model {
  const units = new Map<string, Unit>([[BASEMENT.id, BASEMENT]]);
  let column: ColumnFn = () => [{ unitId: BASEMENT.id, base: -Infinity, top: DATUM, baseKind: 'conformable' }];
  let refLevel = DATUM;
  let disturbed = false;
  let deposits = 0;

  for (const op of ops) {
    const prev = column;
    switch (op.type) {
      case 'deposit': {
        const start = refLevel;
        const unconformable = disturbed && deposits > 0;
        const list = op.units.filter((u) => u.thicknessM > EPS);
        list.forEach((u) => units.set(u.id, u));
        column = (x, y) => {
          const col = [...prev(x, y)];
          let level = start;
          let first = true;
          for (const u of list) {
            level += u.thicknessM;
            const t = topOf(col);
            if (level - t > EPS) {
              col.push({ unitId: u.id, base: t, top: level, baseKind: first && unconformable ? 'unconformity' : 'conformable' });
              first = false;
            }
          }
          return col;
        };
        refLevel = start + list.reduce((s, u) => s + u.thicknessM, 0);
        disturbed = false;
        deposits++;
        break;
      }
      case 'tilt': {
        const k = Math.tan(degToRad(op.angleDeg));
        column = (x, y) => shift(prev(x, y), k * along(x, y, op.azimuthDeg));
        disturbed = disturbed || Math.abs(op.angleDeg) > 1e-3;
        break;
      }
      case 'fold': {
        const w = Math.max(op.wavelengthM, 1);
        // crest (amplitude > 0) or trough (amplitude < 0) runs through the block centre along the axis
        column = (x, y) => shift(prev(x, y), op.amplitudeM * Math.cos((2 * Math.PI * along(x, y, op.axisAzimuthDeg + 90)) / w));
        disturbed = disturbed || Math.abs(op.amplitudeM) > 1e-3;
        break;
      }
      case 'fault': {
        if (Math.abs(op.throwM) <= EPS) break;
        const nAz = op.strikeDeg + 90; // horizontal direction towards the hanging wall (down-dip)
        const a = degToRad(nAz);
        const nx = Math.cos(a);
        const ny = Math.sin(a);
        if (op.kind === 'strike-slip') {
          const sx = Math.cos(degToRad(op.strikeDeg)) * op.throwM;
          const sy = Math.sin(degToRad(op.strikeDeg)) * op.throwM;
          column = (x, y) => (along(x, y, nAz) - op.positionM > 0 ? prev(x - sx, y - sy) : prev(x, y));
        } else {
          const tan = Math.tan(degToRad(op.dipDeg));
          const dir = op.kind === 'normal' ? 1 : -1; // hanging wall moves down-dip (normal) or up-dip (reverse)
          const heave = (op.throwM / tan) * dir;
          const dz = -op.throwM * dir;
          const zTrace = refLevel; // the fault trace sits at s = 0 on the reference level
          column = (x, y) => {
            const s = along(x, y, nAz) - op.positionM;
            const zf = zTrace - s * tan;
            const foot = clip(prev(x, y), -Infinity, zf);
            const hang = clip(shift(prev(x - nx * heave, y - ny * heave), dz), zf, Infinity);
            if (hang.length) hang[0] = { ...hang[0], baseKind: 'fault' };
            if (foot.length === 0) {
              // keep the column contiguous down to −∞
              const src = prev(x, y)[0];
              return [{ ...src, top: Math.min(src.top, zf), base: -Infinity }, ...hang];
            }
            return [...foot, ...hang];
          };
        }
        disturbed = true;
        break;
      }
      case 'erode': {
        if (op.depthM <= EPS) break;
        const level = maxTop(prev) - op.depthM;
        column = (x, y) => {
          const c = clip(prev(x, y), -Infinity, level);
          return c.length ? c : [{ ...prev(x, y)[0], top: level }];
        };
        refLevel = level;
        disturbed = true;
        break;
      }
      case 'intrude': {
        units.set(op.unit.id, op.unit);
        if (op.kind === 'dike') {
          if (op.widthM <= EPS) break;
          column = (x, y) => {
            const col = prev(x, y);
            if (Math.abs(along(x, y, op.strikeDeg + 90) - op.positionM) > op.widthM / 2) return col;
            return [{ unitId: op.unit.id, base: -Infinity, top: topOf(col), baseKind: 'intrusive' }];
          };
        } else {
          if (op.thicknessM <= EPS) break;
          column = (x, y) => {
            const s = along(x, y, op.strikeDeg + 90);
            const col = prev(x, y);
            if (s < op.fromM || s > op.toM) return col;
            return carve(col, op.levelM, op.levelM + op.thicknessM, op.unit.id);
          };
        }
        break;
      }
    }
  }
  return { column, units, ops };
}

/** Scale the effect of one operation (used to animate the newest event from 0 to 1). */
export function scaleOp(op: Op, f: number): Op {
  switch (op.type) {
    case 'deposit':
      return { ...op, units: op.units.map((u) => ({ ...u, thicknessM: u.thicknessM * f })) };
    case 'tilt':
      return { ...op, angleDeg: op.angleDeg * f };
    case 'fold':
      return { ...op, amplitudeM: op.amplitudeM * f };
    case 'fault':
      return { ...op, throwM: op.throwM * f };
    case 'erode':
      return { ...op, depthM: op.depthM * f };
    case 'intrude':
      return op.kind === 'dike' ? { ...op, widthM: op.widthM * f } : { ...op, thicknessM: op.thicknessM * f };
  }
}

/** Unit at a point, or null in the air above the surface. */
export function unitAt(model: Model, x: number, y: number, z: number): Interval | null {
  const col = model.column(x, y);
  if (z > topOf(col)) return null;
  for (let i = col.length - 1; i >= 0; i--) if (z >= col[i].base) return col[i];
  return col[0];
}

export const surfaceAt = (model: Model, x: number, y: number) => topOf(model.column(x, y));

const CONTACT_NOTE: Record<BaseKind, string> = {
  conformable: '',
  unconformity: 'Dasar: bidang ketidakselarasan.',
  fault: 'Dasar: bidang sesar.',
  intrusive: 'Kontak intrusi.',
};

/** Drill a vertical well at (x, y): the sequence of units from the surface down to the block bottom. */
export function sampleWell(model: Model, x: number, y: number, title = 'Sumur virtual'): StratColumn {
  const col = clip(model.column(x, y), BLOCK_BOTTOM, Infinity);
  const surface = topOf(col);
  const merged: Interval[] = [];
  for (const i of col) {
    const last = merged[merged.length - 1];
    if (last && last.unitId === i.unitId && i.baseKind === 'conformable') last.top = i.top;
    else merged.push({ ...i });
  }
  const round = (v: number) => Math.round(v * 10) / 10;
  const beds: Bed[] = [];
  for (let k = merged.length - 1; k >= 0; k--) {
    const i = merged[k];
    const unit = model.units.get(i.unitId)!;
    const lith = lithologyById.get(unit.lithologyId);
    const topM = round(surface - i.top);
    const baseM = round(surface - i.base);
    if (baseM - topM < 0.05) continue;
    const kind = k === 0 ? 'conformable' : i.baseKind;
    beds.push({
      id: `w${merged.length - k}`,
      topM,
      baseM,
      lithologyId: unit.lithologyId,
      grainSize: lith?.grainSize ?? 'm-sand',
      structures: [],
      fossils: [],
      baseContact: kind === 'unconformity' ? 'unconformity' : 'sharp',
      description: [unit.name, unit.ageLabel ? `(${unit.ageLabel})` : '', CONTACT_NOTE[kind]].filter(Boolean).join(' '),
      ...(unit.environmentId ? { environmentId: unit.environmentId } : {}),
    });
  }
  // make depths exactly contiguous after rounding
  for (let k = 1; k < beds.length; k++) beds[k].topM = beds[k - 1].baseM;
  return {
    id: `sumur-${Math.round(x)}-${Math.round(y)}`,
    title: `${title} (x ${Math.round(x)} m, y ${Math.round(y)} m)`,
    kind: 'virtual-well',
    note: 'Dibor dari blok lapisan batuan 3D. Model ajar tanpa umur absolut.',
    beds: beds.filter((b) => b.baseM > b.topM),
    sources: [],
    verified: false,
  };
}

/** Unit ids met by a well, from top to bottom (handy for tests and the text equivalent). */
export const wellUnits = (model: Model, x: number, y: number) =>
  clip(model.column(x, y), BLOCK_BOTTOM, Infinity)
    .map((i) => i.unitId)
    .reverse();
