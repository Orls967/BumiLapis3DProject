import { forwardRef, useId, useMemo } from 'react';
import { formationById } from '@/content/formations';
import { grainSizeInfo, lithologyById } from '@/content/lithologies';
import { GRAIN_SIZES, type Bed, type GrainSize, type StratColumn } from '@/content/schema';
import { chronoAt } from '@/content/timescale';
import { ui } from '@/content/ui';
import { vocabName } from '@/content/vocab';
import { fmtAuto } from '@/lib/format';
import { useTheme } from '@/store/theme';
import { patternMarkup } from './lithologyPatterns';
import { iconMarkup } from './symbolIcons';

export type ColumnLane = { topM: number; baseM: number; label: string; sub?: string; color?: string; warn?: boolean };

type Props = {
  column: StratColumn;
  pxPerM: number;
  selectedBedId?: string | null;
  onSelectBed?: (id: string) => void;
  highlightFormationId?: string | null;
  /** Extra lane on the right (e.g. interpretation per interval). */
  lanes?: ColumnLane[];
  /** Mini mode: lithology column only. */
  compact?: boolean;
  lithWidth?: number;
};

const WIDTH_FRACTION: Record<GrainSize, number> = {
  clay: 0.3,
  silt: 0.4,
  'vf-sand': 0.5,
  'f-sand': 0.58,
  'm-sand': 0.66,
  'c-sand': 0.74,
  'vc-sand': 0.81,
  granule: 0.87,
  pebble: 0.93,
  cobble: 0.97,
  boulder: 1,
};
const AXIS_TICKS: GrainSize[] = ['clay', 'silt', 'f-sand', 'm-sand', 'c-sand', 'pebble'];
export const HEADER = 34;

export function columnLayout(compact: boolean, hasLanes: boolean, lithWidth = 150) {
  const age = compact ? 0 : 30;
  const fm = compact ? 0 : 24;
  const axis = compact ? 0 : 46;
  const sym = compact ? 0 : 92;
  const interp = hasLanes ? 168 : 0;
  const x0 = age + fm + axis;
  return { age, fm, axis, sym, interp, x0, lith: lithWidth, width: x0 + lithWidth + sym + interp + 2 };
}

function wavy(x0: number, x1: number, y: number, amp = 2.2, wl = 9): string {
  const n = Math.max(2, Math.round(Math.abs(x1 - x0) / wl));
  const step = (x1 - x0) / n;
  let d = '';
  for (let i = 0; i < n; i++) d += ` q${(step / 2).toFixed(2)},${i % 2 ? amp : -amp} ${step.toFixed(2)},0`;
  return `L${x0.toFixed(1)},${y.toFixed(1)}${d}`;
}

function niceStep(span: number, px: number): number {
  const target = (span / px) * 46;
  const pow = 10 ** Math.floor(Math.log10(Math.max(target, 1e-6)));
  const n = target / pow;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
}

type Run<T> = { key: T; topM: number; baseM: number };
function runs<T>(beds: Bed[], keyOf: (b: Bed) => T | null): Run<T>[] {
  const out: Run<T>[] = [];
  for (const b of beds) {
    const k = keyOf(b);
    if (k === null) continue;
    const last = out[out.length - 1];
    if (last && last.key === k && Math.abs(last.baseM - b.topM) < 1e-6) last.baseM = b.baseM;
    else out.push({ key: k, topM: b.topM, baseM: b.baseM });
  }
  return out;
}

/** Interactive stratigraphic column drawn as a standalone SVG. */
export const StratColumnView = forwardRef<SVGSVGElement, Props>(function StratColumnView(
  { column, pxPerM, selectedBedId, onSelectBed, highlightFormationId, lanes, compact = false, lithWidth = 150 },
  ref,
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const dark = useTheme((s) => s.dark);
  const ink = dark ? '#e5e7eb' : '#1c1917';
  const muted = dark ? '#9aa5bd' : '#57534e';
  const paper = dark ? '#121829' : '#ffffff';
  const L = columnLayout(compact, !!lanes, lithWidth);
  const beds = column.beds;
  const top0 = beds[0]?.topM ?? 0;
  const total = beds.length ? beds[beds.length - 1].baseM - top0 : 0;
  const header = compact ? 4 : HEADER;
  const height = header + total * pxPerM + 10;
  const y = (m: number) => header + (m - top0) * pxPerM;
  const usedLith = useMemo(() => [...new Set(beds.map((b) => b.lithologyId))], [beds]);
  const w = (g: GrainSize) => WIDTH_FRACTION[g] * L.lith;
  const step = niceStep(total, total * pxPerM);

  const ageRuns = useMemo(() => {
    const sys = runs(beds, (b) => (b.ageMa ? (chronoAt(b.ageMa).system?.name ?? null) : null));
    const ser = runs(beds, (b) => (b.ageMa ? (chronoAt(b.ageMa).series?.name ?? null) : null));
    return { sys, ser };
  }, [beds]);
  const fmRuns = useMemo(() => runs(beds, (b) => b.formationId ?? null), [beds]);
  const colorOf = (name: string, kind: 'sys' | 'ser', b: Bed[]) => {
    const bed = b.find((x) => x.ageMa && (kind === 'sys' ? chronoAt(x.ageMa).system?.name : chronoAt(x.ageMa).series?.name) === name);
    const c = bed?.ageMa ? chronoAt(bed.ageMa) : null;
    return (kind === 'sys' ? c?.system?.color : c?.series?.color) ?? '#ccc';
  };
  const vText = (x: number, yMid: number, h: number, text: string, fill: string, size = 10) =>
    h > 26 ? (
      <text x={x} y={yMid} transform={`rotate(-90 ${x} ${yMid})`} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={700} fill={fill}>
        {text.length * size * 0.56 > h ? `${text.slice(0, Math.max(2, Math.floor(h / (size * 0.56)) - 1))}…` : text}
      </text>
    ) : null;

  return (
    <svg
      ref={ref}
      width={L.width}
      height={height}
      viewBox={`0 0 ${L.width} ${height}`}
      role="group"
      aria-label={column.title}
      fontFamily="Inter, system-ui, sans-serif"
      style={{ display: 'block', maxWidth: 'none' }}
    >
      <defs>
        {usedLith.map((id) => {
          const p = patternMarkup(id);
          return <pattern key={id} id={`${uid}-${id}`} width={p.size[0]} height={p.size[1]} patternUnits="userSpaceOnUse" dangerouslySetInnerHTML={{ __html: p.svg }} />;
        })}
      </defs>
      <rect width={L.width} height={height} fill={paper} />

      {!compact && (
        <g>
          <text x={L.x0 - 6} y={12} textAnchor="end" fontSize={9} fill={muted}>
            m
          </text>
          {AXIS_TICKS.map((g) => (
            <g key={g}>
              <line x1={L.x0 + w(g)} x2={L.x0 + w(g)} y1={header - 8} y2={height - 10} stroke={muted} strokeWidth={0.5} strokeDasharray="2 4" opacity={0.6} />
              <text x={L.x0 + w(g)} y={header - 12} textAnchor="middle" fontSize={8.5} fill={muted}>
                <title>{grainSizeInfo[g].name}</title>
                {grainSizeInfo[g].short}
              </text>
            </g>
          ))}
          <text x={L.x0} y={10} fontSize={8.5} fontWeight={700} fill={muted}>
            {ui.column.grainAxis} →
          </text>
          {Array.from({ length: Math.floor(total / step) + 1 }, (_, i) => top0 + i * step).map((m) => (
            <g key={m}>
              <line x1={L.x0 - 5} x2={L.x0} y1={y(m)} y2={y(m)} stroke={ink} strokeWidth={1} />
              <text x={L.x0 - 8} y={y(m) + 3} textAnchor="end" fontSize={9.5} fill={ink}>
                {fmtAuto(m)}
              </text>
            </g>
          ))}
          <line x1={L.x0} x2={L.x0} y1={header} y2={y(top0 + total)} stroke={ink} strokeWidth={1} />
          {ageRuns.sys.map((r) => (
            <g key={`s${r.topM}`}>
              <rect x={0} y={y(r.topM)} width={L.age / 2} height={(r.baseM - r.topM) * pxPerM} fill={colorOf(r.key, 'sys', beds)} stroke="#555" strokeWidth={0.5}>
                <title>{r.key}</title>
              </rect>
              {vText(L.age / 4, y((r.topM + r.baseM) / 2), (r.baseM - r.topM) * pxPerM, r.key, '#1c1917', 9)}
            </g>
          ))}
          {ageRuns.ser.map((r) => (
            <g key={`e${r.topM}`}>
              <rect x={L.age / 2} y={y(r.topM)} width={L.age / 2} height={(r.baseM - r.topM) * pxPerM} fill={colorOf(r.key, 'ser', beds)} stroke="#555" strokeWidth={0.5}>
                <title>{r.key}</title>
              </rect>
              {vText((L.age * 3) / 4, y((r.topM + r.baseM) / 2), (r.baseM - r.topM) * pxPerM, r.key, '#1c1917', 9)}
            </g>
          ))}
          {fmRuns.map((r) => {
            const f = formationById.get(r.key);
            const on = highlightFormationId === r.key;
            return (
              <g key={`f${r.topM}`}>
                <rect
                  x={L.age + 1}
                  y={y(r.topM)}
                  width={L.fm - 3}
                  height={(r.baseM - r.topM) * pxPerM}
                  fill={on ? '#fbbf24' : 'none'}
                  stroke={on ? '#b45309' : muted}
                  strokeWidth={on ? 1.6 : 0.6}
                >
                  <title>{f?.name ?? r.key}</title>
                </rect>
                {vText(L.age + L.fm / 2 - 0.5, y((r.topM + r.baseM) / 2), (r.baseM - r.topM) * pxPerM, (f?.name ?? r.key).replace('Formasi ', ''), on ? '#1c1917' : ink)}
              </g>
            );
          })}
        </g>
      )}

      {beds.map((b, i) => {
        const yt = y(b.topM);
        const yb = y(b.baseM);
        const wt = w(b.grainSizeTop ?? b.grainSize);
        const wb = w(b.grainSize);
        const lith = lithologyById.get(b.lithologyId);
        const rough = b.baseContact === 'erosional' || b.baseContact === 'unconformity';
        const x0 = L.x0;
        const bottom = rough ? `${wavy(x0 + wb, x0, yb)}` : `L${x0 + wb},${yb} L${x0},${yb}`;
        const d = `M${x0},${yt} L${x0 + wt},${yt} L${x0 + wb},${yb} ${rough ? bottom.replace(/^L[^ ]+/, '') : bottom} Z`;
        const selected = selectedBedId === b.id;
        const dim = highlightFormationId && b.formationId !== highlightFormationId;
        const h = yb - yt;
        const syms = [...b.structures.map((s) => ({ id: s, kind: 'structures' as const })), ...b.fossils.filter((f) => f !== 'none').map((s) => ({ id: s, kind: 'fossils' as const }))];
        const perRow = Math.floor(L.sym / 18);
        const rowsFit = Math.max(1, Math.floor(h / 17));
        const shown = h >= 9 ? syms.slice(0, perRow * rowsFit) : [];
        const label = `${lith?.name ?? b.lithologyId}, ${fmtAuto(b.topM)}–${fmtAuto(b.baseM)} m`;
        return (
          <g key={b.id} opacity={dim ? 0.35 : 1}>
            <path
              d={d}
              fill={`url(#${uid}-${b.lithologyId})`}
              stroke={selected ? '#f59e0b' : ink}
              strokeWidth={selected ? 2.6 : 0.8}
              strokeLinejoin="round"
              role={onSelectBed ? 'button' : undefined}
              tabIndex={onSelectBed ? 0 : undefined}
              aria-label={label}
              aria-pressed={onSelectBed ? selected : undefined}
              style={onSelectBed ? { cursor: 'pointer', outline: 'none' } : undefined}
              onClick={onSelectBed ? () => onSelectBed(b.id) : undefined}
              onKeyDown={
                onSelectBed
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectBed(b.id);
                      }
                    }
                  : undefined
              }
            >
              <title>{label}</title>
            </path>
            {i < beds.length - 1 || b.baseContact !== 'sharp' ? (
              b.baseContact === 'gradational' ? (
                <line x1={x0} x2={x0 + wb} y1={yb} y2={yb} stroke={paper} strokeWidth={1.4} strokeDasharray="5 4" pointerEvents="none" />
              ) : rough ? (
                <path
                  d={`M${x0 - (b.baseContact === 'unconformity' ? 6 : 0)},${yb} ${wavy(x0 - (b.baseContact === 'unconformity' ? 6 : 0), x0 + wb + (b.baseContact === 'unconformity' ? 10 : 0), yb).replace(/^L[^ ]+/, '')}`}
                  fill="none"
                  stroke={b.baseContact === 'unconformity' ? '#dc2626' : ink}
                  strokeWidth={b.baseContact === 'unconformity' ? 2.2 : 1.5}
                  pointerEvents="none"
                />
              ) : null
            ) : null}
            {!compact &&
              shown.map((s, k) => {
                const row = Math.floor(k / perRow);
                const rowsUsed = Math.ceil(shown.length / perRow);
                const sx = x0 + L.lith + 6 + (k % perRow) * 18;
                const sy = (yt + yb) / 2 - (rowsUsed * 17) / 2 + row * 17;
                return (
                  <g key={s.id} transform={`translate(${sx} ${sy})`}>
                    <title>{vocabName(s.kind, s.id)}</title>
                    <rect width={16} height={16} fill="transparent" />
                    <g dangerouslySetInnerHTML={{ __html: iconMarkup(s.id, s.kind === 'fossils' ? (dark ? '#7dd3fc' : '#0369a1') : ink) }} />
                  </g>
                );
              })}
          </g>
        );
      })}

      {lanes?.map((l, i) => {
        const x = L.x0 + L.lith + L.sym + 4;
        const h = (l.baseM - l.topM) * pxPerM;
        return (
          <g key={i}>
            <rect x={x} y={y(l.topM) + 1} width={L.interp - 8} height={Math.max(2, h - 2)} rx={5} fill={l.color ?? '#64748b'} fillOpacity={0.22} stroke={l.warn ? '#dc2626' : (l.color ?? muted)} strokeWidth={l.warn ? 2 : 1} />
            {h > 15 && (
              <text x={x + 7} y={y(l.topM) + Math.min(h / 2 + 4, 16)} fontSize={10.5} fontWeight={700} fill={ink}>
                {l.label}
              </text>
            )}
            {h > 30 && l.sub && (
              <text x={x + 7} y={y(l.topM) + 29} fontSize={9.5} fill={muted}>
                {l.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});

/** Legend for the lithologies, contacts and symbols that occur in the given columns. */
export function ColumnLegend({ columns }: { columns: StratColumn[] }) {
  const dark = useTheme((s) => s.dark);
  const ink = dark ? '#e5e7eb' : '#1c1917';
  const beds = columns.flatMap((c) => c.beds);
  const liths = [...new Set(beds.map((b) => b.lithologyId))];
  const structs = [...new Set(beds.flatMap((b) => b.structures))];
  const foss = [...new Set(beds.flatMap((b) => b.fossils))].filter((f) => f !== 'none');
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const C = ui.column;
  return (
    <div className="grid gap-3 text-sm">
      <div>
        <h3 className="label mb-1">{C.legendLith}</h3>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {liths.map((id) => {
            const p = patternMarkup(id);
            return (
              <li key={id} className="flex items-center gap-2">
                <svg width={34} height={18} aria-hidden>
                  <defs>
                    <pattern id={`${uid}-${id}`} width={p.size[0]} height={p.size[1]} patternUnits="userSpaceOnUse" dangerouslySetInnerHTML={{ __html: p.svg }} />
                  </defs>
                  <rect width={34} height={18} fill={`url(#${uid}-${id})`} stroke={ink} strokeWidth={0.8} />
                </svg>
                {lithologyById.get(id)?.name ?? id}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h3 className="label mb-1">{C.legendContacts}</h3>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {(
            [
              ['Tegas', <line key="a" x1={2} x2={32} y1={8} y2={8} stroke={ink} strokeWidth={1.2} />],
              ['Berangsur', <line key="b" x1={2} x2={32} y1={8} y2={8} stroke={ink} strokeWidth={1.2} strokeDasharray="5 4" />],
              ['Erosional', <path key="c" d="M2,8q3.75,-4 7.5,0t7.5,0t7.5,0t7.5,0" fill="none" stroke={ink} strokeWidth={1.5} />],
              ['Ketidakselarasan', <path key="d" d="M2,8q3.75,-4 7.5,0t7.5,0t7.5,0t7.5,0" fill="none" stroke="#dc2626" strokeWidth={2.2} />],
            ] as const
          ).map(([name, shape]) => (
            <li key={name} className="flex items-center gap-2">
              <svg width={34} height={16} aria-hidden>
                {shape}
              </svg>
              {name}
            </li>
          ))}
        </ul>
      </div>
      {(structs.length > 0 || foss.length > 0) && (
        <div>
          <h3 className="label mb-1">{C.legendSymbols}</h3>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[...structs.map((id) => ['structures', id] as const), ...foss.map((id) => ['fossils', id] as const)].map(([kind, id]) => (
              <li key={`${kind}-${id}`} className="flex items-center gap-2">
                <svg width={18} height={18} viewBox="0 0 16 16" aria-hidden dangerouslySetInnerHTML={{ __html: iconMarkup(id, kind === 'fossils' ? (dark ? '#7dd3fc' : '#0369a1') : ink) }} />
                {vocabName(kind, id)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted">
        {ui.column.grainAxis}: {GRAIN_SIZES.slice(0, 9).map((g) => `${grainSizeInfo[g].short} = ${grainSizeInfo[g].name.toLowerCase()}`).join('; ')}.
      </p>
    </div>
  );
}
