import type { EarthLayer } from '@/content/schema';
import { degToRad } from '../units';
import { displayRadius, type ScaleMode } from './scale';

export type ViewMode = 'closed' | 'wedge' | 'half' | 'explode';
export type GroupingMode = 'compositional' | 'mechanical';
export type ShellKind = 'interior' | 'atmosphere' | 'ocean';

export type ShellTarget = {
  id: string;
  kind: ShellKind;
  rOuter: number;
  rInner: number;
  /** Wedge opening in radians, centred on +Z. */
  cut: number;
  /** Explode offset along +Z. */
  offsetZ: number;
  /** 0 = hidden, 1 = shown. */
  opacity: number;
  /** Index among the shells of its own group (outermost = 0). */
  index: number;
  /** Atmosphere and ocean are drawn only as bands on the cut faces. */
  capsOnly: boolean;
};

export const EXPLODE_GAP = 0.46;
const STEP = 0.07;

export type ShellOptions = {
  layers: EarthLayer[];
  grouping: GroupingMode;
  scaleMode: ScaleMode;
  view: ViewMode;
  cutDeg: number;
  hidden: ReadonlySet<string>;
  showAtmosphere: boolean;
};

/** Pure description of every shell for the given view state. */
export function shellTargets(o: ShellOptions): ShellTarget[] {
  const out: ShellTarget[] = [];
  const baseCut = o.view === 'closed' ? 0 : o.view === 'wedge' ? degToRad(o.cutDeg) : Math.PI;
  for (const mode of ['compositional', 'mechanical'] as const) {
    const shells = o.layers.filter(
      (l) => l.realm === 'interior' && !l.variantOf && (l.grouping === mode || l.grouping === 'both'),
    );
    shells.forEach((l, i) => {
      if (l.grouping === 'both' && mode !== o.grouping) return;
      const last = i === shells.length - 1;
      let cut = baseCut;
      if (o.view === 'wedge') cut = last ? 0 : baseCut * (1 - STEP * i);
      if (o.view === 'explode' && last) cut = 0;
      out.push({
        id: l.id,
        kind: 'interior',
        rOuter: displayRadius(l.topKm, o.scaleMode),
        rInner: displayRadius(l.bottomKm, o.scaleMode),
        cut,
        offsetZ: o.view === 'explode' ? i * EXPLODE_GAP : 0,
        opacity: mode === o.grouping && !o.hidden.has(l.id) ? 1 : 0,
        index: i,
        capsOnly: false,
      });
    });
  }
  const ocean = o.layers.find((l) => l.id === 'ocean');
  if (ocean) {
    out.push({
      id: 'ocean',
      kind: 'ocean',
      rOuter: displayRadius(0, o.scaleMode),
      rInner: displayRadius(-3.7, o.scaleMode),
      cut: baseCut,
      offsetZ: 0,
      opacity: o.hidden.has('ocean') || o.view === 'closed' ? 0 : 1,
      index: 0,
      capsOnly: true,
    });
  }
  o.layers
    .filter((l) => l.realm === 'atmosphere')
    .forEach((l, i) => {
      out.push({
        id: l.id,
        kind: 'atmosphere',
        rOuter: displayRadius(l.topKm, o.scaleMode),
        rInner: displayRadius(l.bottomKm, o.scaleMode),
        cut: baseCut,
        offsetZ: 0,
        opacity: o.showAtmosphere && !o.hidden.has(l.id) && o.view !== 'closed' ? 1 : 0,
        index: i,
        capsOnly: true,
      });
    });
  return out;
}

export type Vec3 = readonly [number, number, number];

export type PickShell = Pick<ShellTarget, 'id' | 'rOuter' | 'rInner' | 'cut' | 'offsetZ' | 'opacity' | 'capsOnly'>;
export type PickHit = { id: string; t: number; point: Vec3; onCap: boolean };

function sphereHits(o: Vec3, d: Vec3, r: number): [number, number] | null {
  const b = o[0] * d[0] + o[1] * d[1] + o[2] * d[2];
  const c = o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - r * r;
  const disc = b * b - c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  return [-b - s, -b + s];
}

const inWedge = (x: number, z: number, cut: number) => cut > 1e-4 && Math.abs(Math.atan2(x, z)) < cut / 2;

/**
 * Analytic ray picking against the cut-away shells. `dir` must be normalised.
 * Mirrors exactly what the shaders draw: outer sphere outside the wedge, inner (back) sphere,
 * and the two planar cut faces of each shell.
 */
export function pickShell(origin: Vec3, dir: Vec3, shells: readonly PickShell[]): PickHit | null {
  let best: PickHit | null = null;
  const consider = (id: string, t: number, p: Vec3, onCap: boolean, bias = 0) => {
    if (t > 1e-6 && (!best || t - bias < best.t)) best = { id, t: t - bias, point: p, onCap };
  };
  for (const s of shells) {
    if (s.opacity < 0.5) continue;
    const o: Vec3 = [origin[0], origin[1], origin[2] - s.offsetZ];
    const at = (t: number): Vec3 => [o[0] + dir[0] * t, o[1] + dir[1] * t, o[2] + dir[2] * t];
    const world = (p: Vec3): Vec3 => [p[0], p[1], p[2] + s.offsetZ];
    if (!s.capsOnly) {
      const outer = sphereHits(o, dir, s.rOuter);
      if (outer && outer[0] > 0) {
        const p = at(outer[0]);
        if (!inWedge(p[0], p[2], s.cut)) consider(s.id, outer[0], world(p), false);
      }
      if (s.cut > 1e-4 && s.rInner > 1e-4) {
        const inner = sphereHits(o, dir, s.rInner);
        if (inner && inner[1] > 0) {
          const p = at(inner[1]);
          if (!inWedge(p[0], p[2], s.cut)) consider(s.id, inner[1], world(p), false);
        }
      }
    }
    if (s.cut > 1e-4) {
      for (const sign of [1, -1]) {
        const dx = sign * Math.sin(s.cut / 2);
        const dz = Math.cos(s.cut / 2);
        // plane contains the Y axis and (dx, 0, dz); normal = (dz, 0, -dx)
        const denom = dir[0] * dz - dir[2] * dx;
        if (Math.abs(denom) < 1e-9) continue;
        const t = -(o[0] * dz - o[2] * dx) / denom;
        if (t <= 0) continue;
        const p = at(t);
        if (p[0] * dx + p[2] * dz < 0) continue;
        const r = Math.hypot(p[0], p[1], p[2]);
        if (r < s.rInner || r > s.rOuter) continue;
        consider(s.id, t, world(p), true, s.capsOnly ? 1e-4 : 0);
      }
    }
  }
  return best;
}
