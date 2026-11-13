import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { builtinColumns } from '@/content/columns';
import { environments } from '@/content/environments';
import { formationById } from '@/content/formations';
import { ui } from '@/content/ui';
import { trends } from '@/content/vocab';
import { fmtAuto } from '@/lib/format';
import { interpretColumn, type Interval } from '@/lib/interpret/column';
import { findColumn, useColumns } from '@/store/columns';
import { StratColumnView, type ColumnLane } from '@/ui/StratColumnView';
import { RuleList, ScoreBar, settingColor } from './shared';

const T = ui.interp;
const C = T.column;
const trendName = new Map(trends.map((t) => [t.id, t.name]));

function DepthChart({ intervals, total, deepest }: { intervals: Interval[]; total: number; deepest: number }) {
  const W = 150;
  const H = 190;
  const m = { l: 8, r: 8, t: 18, b: 6 };
  const x = (d: number) => m.l + ((d + 1) / 6) * (W - m.l - m.r);
  const y = (depthM: number) => m.t + (depthM / total) * (H - m.t - m.b);
  const pts: string[] = [];
  for (const iv of intervals) {
    if (!iv.best) continue;
    const d = iv.best.env.relativeWaterDepth;
    pts.push(`${x(d)},${y(iv.topM)}`, `${x(d)},${y(iv.baseM)}`);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={C.depthChart}>
      <text x={m.l} y={11} className="fill-[var(--muted)] text-[10px]">{C.depthAxis[0]}</text>
      <text x={W - m.r} y={11} textAnchor="end" className="fill-[var(--muted)] text-[10px]">{C.depthAxis[1]}</text>
      <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} fill="var(--panel-2)" rx={4} />
      <line x1={x(0.25)} x2={x(0.25)} y1={m.t} y2={H - m.b} stroke="var(--line)" strokeDasharray="3 3" />
      {intervals.map((iv, k) =>
        iv.best ? (
          <rect key={k} x={m.l} y={y(iv.topM)} width={x(iv.best.env.relativeWaterDepth) - m.l} height={Math.max(1, y(iv.baseM) - y(iv.topM))} fill={settingColor[iv.best.env.setting]} opacity={k === deepest ? 0.75 : 0.4} />
        ) : null,
      )}
      <polyline points={pts.join(' ')} fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

export default function ColumnInterp() {
  const [params, setParams] = useSearchParams();
  const stored = useColumns((s) => s.columns);
  const column = findColumn(params.get('kolom'), stored) ?? builtinColumns[1] ?? builtinColumns[0];
  const res = useMemo(() => interpretColumn(column, environments), [column]);
  const total = column.beds[column.beds.length - 1]?.baseM ?? 0;
  const lanes: ColumnLane[] = res.intervals.map((iv, k) => ({
    topM: iv.topM,
    baseM: iv.baseM,
    label: iv.best ? iv.best.env.name : '—',
    sub: iv.best ? `${Math.round(iv.best.score * 100)}%` : undefined,
    color: iv.best ? settingColor[iv.best.env.setting] : undefined,
    warn: !!res.boundaries[k]?.waltherWarning,
  }));
  const deepest = res.deepest >= 0 ? res.intervals[res.deepest] : null;
  const names = (iv: Interval) => iv.formationIds.map((f) => formationById.get(f)?.name ?? f).join(', ');

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid min-w-0 flex-1 basis-full gap-1 text-sm font-semibold sm:basis-0">
          {C.pick}
          <select className="min-h-11 rounded-xl border border-line bg-panel px-2 font-normal" value={column.id} onChange={(e) => setParams({ mode: 'kolom', kolom: e.target.value }, { replace: true })}>
            <optgroup label={ui.column.builtin}>
              {builtinColumns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </optgroup>
            {stored.length > 0 && (
              <optgroup label={ui.column.mine}>
                {stored.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <Link className="btn" to={`/kolom?kolom=${column.id}`}>
          ▤ {C.openColumn}
        </Link>
      </div>

      {column.beds.length === 0 ? (
        <p className="card p-4 text-muted">{C.none}</p>
      ) : (
        <>
          <section className="card flex gap-4 border-l-4 !border-l-accent p-3" aria-live="polite">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{C.summary[res.summary]}</p>
              {deepest?.best && (
                <p className="mt-1 text-sm text-muted">
                  {C.deepest}: {fmtAuto(deepest.topM)}–{fmtAuto(deepest.baseM)} m{names(deepest) && ` (${names(deepest)})`} — {deepest.best.env.name}.
                </p>
              )}
              <p className="mt-1 text-xs text-muted">{C.waltherNote}</p>
            </div>
            <figure className="hidden w-40 shrink-0 sm:block">
              <figcaption className="label mb-1">{C.depthChart}</figcaption>
              <DepthChart intervals={res.intervals} total={total} deepest={res.deepest} />
            </figure>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div className="card scroll-thin min-w-0 overflow-auto p-2" style={{ maxHeight: '80vh' }}>
              <StratColumnView column={column} pxPerM={Math.max(560, res.intervals.length * 64) / Math.max(1, total)} lanes={lanes} />
            </div>

            <section aria-label={C.intervals}>
              <h2 className="mb-2 text-base font-extrabold">{C.intervals}</h2>
              <ol className="grid gap-2">
                {res.intervals.map((iv, k) => {
                  const b = res.boundaries[k];
                  return (
                    <li key={k} className="grid gap-2">
                      <article className="card p-3" style={iv.best ? { borderLeft: `4px solid ${settingColor[iv.best.env.setting]}` } : undefined}>
                        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-sm font-extrabold tabular-nums">
                            {fmtAuto(iv.topM)}–{fmtAuto(iv.baseM)} m
                          </h3>
                          {names(iv) && <span className="chip">{names(iv)}</span>}
                          <span className="text-xs text-muted">
                            {C.trend}: {trendName.get(iv.trend)}
                          </span>
                        </header>
                        {iv.best ? (
                          <>
                            <p className="mt-1 text-base font-extrabold">{iv.best.env.name}</p>
                            <ScoreBar score={iv.best.score} color={settingColor[iv.best.env.setting]} />
                            {iv.candidates.length > 1 && (
                              <p className="mt-1 text-xs text-muted">
                                {C.alternatives}:{' '}
                                {iv.candidates
                                  .slice(1)
                                  .map((c) => `${c.env.name} ${Math.round(c.score * 100)}%`)
                                  .join(' · ')}
                              </p>
                            )}
                            <details className="mt-1">
                              <summary className="cursor-pointer text-sm font-semibold text-accent">
                                {C.evidence} ({iv.best.supporting.length + iv.best.opposing.length})
                              </summary>
                              <div className="mt-1">
                                <RuleList rules={[...iv.best.supporting, ...iv.best.opposing]} />
                              </div>
                            </details>
                          </>
                        ) : (
                          <p className="mt-1 text-sm text-muted">{iv.candidates.length === 0 ? C.basement : C.unknown}</p>
                        )}
                      </article>
                      {b && (b.change !== 'none' || b.waltherWarning) && (
                        <div className="grid gap-1 px-2">
                          {b.change !== 'none' && <p className={`text-sm font-bold ${b.change === 'transgression' ? 'text-[#3b82f6]' : 'text-warn'}`}>{b.change === 'transgression' ? C.transgression : C.regression}</p>}
                          {b.waltherWarning && (
                            <p role="note" className="rounded-lg border border-warn/50 bg-accent-soft p-2 text-sm">
                              ⚠ {C.walther}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
