import { BLOCK_SIZE, type Model } from './model';

export type Tiles = Map<string, HTMLCanvasElement>;
export const Z_TOP = 260;

const patternCache = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern | string>>();
function fillFor(ctx: CanvasRenderingContext2D, tiles: Tiles, lithologyId: string): CanvasPattern | string {
  let m = patternCache.get(ctx);
  if (!m) patternCache.set(ctx, (m = new Map()));
  let p = m.get(lithologyId);
  if (!p) {
    const tile = tiles.get(lithologyId);
    p = (tile && ctx.createPattern(tile, 'repeat')) || '#999';
    m.set(lithologyId, p);
  }
  return p;
}

const LINE = { conformable: '#1b1b22', unconformity: '#7f1d1d', fault: '#dc2626', intrusive: '#1b1b22' } as const;

/**
 * Paint the vertical cross-section between two map points into a canvas.
 * Pixels above the ground surface stay transparent. Returns the canvas for chaining.
 */
export function drawSection(
  canvas: HTMLCanvasElement,
  model: Model,
  p0: readonly [number, number],
  p1: readonly [number, number],
  zMin: number,
  pxPerM: number,
  tiles: Tiles,
): HTMLCanvasElement {
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const W = Math.max(2, Math.round(len * pxPerM));
  const H = Math.max(2, Math.round((Z_TOP - zMin) * pxPerM));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  const yOf = (z: number) => (Z_TOP - z) * pxPerM;
  const lw = Math.max(1, pxPerM * 3);
  const marks: [number, number, string, number][] = [];
  for (let i = 0; i < W; i++) {
    const t = (i + 0.5) / W;
    const col = model.column(p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t);
    for (let k = 0; k < col.length; k++) {
      const iv = col[k];
      if (iv.top <= zMin) continue;
      const y0 = yOf(Math.min(iv.top, Z_TOP));
      const y1 = yOf(Math.max(iv.base, zMin));
      ctx.fillStyle = fillFor(ctx, tiles, model.units.get(iv.unitId)?.lithologyId ?? '');
      ctx.fillRect(i, y0, 1, y1 - y0 + 0.5);
      if (k > 0 && iv.base > zMin) marks.push([i, y1, LINE[iv.baseKind], iv.baseKind === 'conformable' || iv.baseKind === 'intrusive' ? lw : lw * 1.9]);
    }
    marks.push([i, yOf(col[col.length - 1].top), '#1b1b22', lw]);
  }
  for (const [x, y, color, w] of marks) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - w / 2, 1, w);
  }
  return canvas;
}

export type TopGrid = { n: number; tops: Float32Array; unitIds: string[] };

/** Sample the ground surface on an (n+1)² grid of nodes and the outcropping unit of each of the n² cells. */
export function sampleTop(model: Model, n: number): TopGrid {
  const tops = new Float32Array((n + 1) * (n + 1));
  const unitIds: string[] = new Array(n * n);
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) {
      const col = model.column((i / n) * BLOCK_SIZE, (j / n) * BLOCK_SIZE);
      tops[j * (n + 1) + i] = col[col.length - 1].top;
    }
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const col = model.column(((i + 0.5) / n) * BLOCK_SIZE, ((j + 0.5) / n) * BLOCK_SIZE);
      unitIds[j * n + i] = col[col.length - 1].unitId;
    }
  return { n, tops, unitIds };
}

/** Paint the simple geologic map (outcropping units) of the block top. */
export function drawMap(canvas: HTMLCanvasElement, model: Model, grid: TopGrid, size: number, tiles: Tiles): HTMLCanvasElement {
  if (canvas.width !== size) canvas.width = size;
  if (canvas.height !== size) canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const { n, unitIds } = grid;
  const c = size / n;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = fillFor(ctx, tiles, model.units.get(unitIds[j * n + i])?.lithologyId ?? '');
      ctx.fillRect(Math.floor(i * c), Math.floor(j * c), Math.ceil(c), Math.ceil(c));
    }
  ctx.fillStyle = '#1b1b22';
  const lw = Math.max(1.5, size / 300);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const u = unitIds[j * n + i];
      if (i + 1 < n && unitIds[j * n + i + 1] !== u) ctx.fillRect((i + 1) * c - lw / 2, j * c, lw, c + 0.5);
      if (j + 1 < n && unitIds[(j + 1) * n + i] !== u) ctx.fillRect(i * c, (j + 1) * c - lw / 2, c + 0.5, lw);
    }
  return canvas;
}

/** Clip the infinite line {c + n·offset + d·t} to the block footprint; returns null when it misses. */
export function sliceLine(azimuthDeg: number, offsetM: number): { p0: [number, number]; p1: [number, number]; n: [number, number] } | null {
  const a = (azimuthDeg * Math.PI) / 180;
  const n: [number, number] = [Math.cos(a), Math.sin(a)];
  const d: [number, number] = [n[1], -n[0]];
  const o: [number, number] = [BLOCK_SIZE / 2 + n[0] * offsetM, BLOCK_SIZE / 2 + n[1] * offsetM];
  let t0 = -Infinity;
  let t1 = Infinity;
  for (const k of [0, 1] as const) {
    if (Math.abs(d[k]) < 1e-9) {
      if (o[k] < 0 || o[k] > BLOCK_SIZE) return null;
      continue;
    }
    const a0 = (0 - o[k]) / d[k];
    const a1 = (BLOCK_SIZE - o[k]) / d[k];
    t0 = Math.max(t0, Math.min(a0, a1));
    t1 = Math.min(t1, Math.max(a0, a1));
  }
  if (!(t1 - t0 > 1)) return null;
  return { p0: [o[0] + d[0] * t0, o[1] + d[1] * t0], p1: [o[0] + d[0] * t1, o[1] + d[1] * t1], n };
}
