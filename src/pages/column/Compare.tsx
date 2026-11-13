import { useState } from 'react';
import type { StratColumn } from '@/content/schema';
import { ui } from '@/content/ui';
import { fmtAuto } from '@/lib/format';
import { columnLayout, HEADER, StratColumnView } from '@/ui/StratColumnView';

type Line = { a: number; b: number };
const GAP = 110;

/** Two columns side by side at the same vertical scale with user-drawn correlation lines. */
export function Compare({ left, right, pxPerM }: { left: StratColumn; right: StratColumn; pxPerM: number }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, setPending] = useState<number | null>(null);
  const LA = columnLayout(false, false);
  const yOf = (c: StratColumn, m: number) => HEADER + (m - (c.beds[0]?.topM ?? 0)) * pxPerM;
  const bounds = (c: StratColumn) => [...new Set([...c.beds.map((b) => b.topM), ...(c.beds.length ? [c.beds[c.beds.length - 1].baseM] : [])])];
  const xa = LA.x0 + LA.lith * 0.9;
  const xb = LA.width + GAP + LA.x0;
  const height = Math.max(...[left, right].map((c) => yOf(c, c.beds[c.beds.length - 1]?.baseM ?? 0))) + 12;
  const dot = (side: 'a' | 'b', m: number, x: number, y: number) => (
    <button
      key={`${side}${m}`}
      className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent ${side === 'a' && pending === m ? 'bg-accent' : 'bg-panel'} hover:bg-accent`}
      style={{ left: x, top: y }}
      aria-label={`${ui.column.correlationPoint} ${fmtAuto(m)} m (${side === 'a' ? left.title : right.title})`}
      onClick={() => {
        if (side === 'a') setPending(m);
        else if (pending !== null) {
          setLines((l) => [...l.filter((x) => !(x.a === pending && x.b === m)), { a: pending, b: m }]);
          setPending(null);
        }
      }}
    />
  );
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <p className="min-w-0 flex-1 text-muted">{ui.column.compareHint}</p>
        <button className="btn btn-sm" disabled={!lines.length} onClick={() => setLines([])}>
          {ui.column.clearLines}
        </button>
      </div>
      <div className="relative" style={{ width: LA.width * 2 + GAP, height }}>
        <div className="absolute left-0 top-0">
          <StratColumnView column={left} pxPerM={pxPerM} />
        </div>
        <div className="absolute top-0" style={{ left: LA.width + GAP }}>
          <StratColumnView column={right} pxPerM={pxPerM} />
        </div>
        <svg className="pointer-events-none absolute left-0 top-0" width={LA.width * 2 + GAP} height={height} aria-hidden>
          {lines.map((l, i) => (
            <line key={i} x1={xa} y1={yOf(left, l.a)} x2={xb} y2={yOf(right, l.b)} stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="7 4" />
          ))}
        </svg>
        {bounds(left).map((m) => dot('a', m, LA.width + 12, yOf(left, m)))}
        {bounds(right).map((m) => dot('b', m, LA.width + GAP - 12, yOf(right, m)))}
      </div>
    </div>
  );
}
