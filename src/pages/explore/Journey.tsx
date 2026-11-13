import { useMemo } from 'react';
import { atmosphereShells, interiorShells, layerById } from '@/content/layers';
import { atmosphereProfile, interiorProfile } from '@/content/profiles';
import { ui } from '@/content/ui';
import { fmt, fmtAltitude, fmtAuto } from '@/lib/format';
import { layersAt, profileAt } from '@/lib/profile/interpolate';
import { altitudeToPosition, positionToAltitude } from '@/lib/profile/slider';
import { useEarth } from '@/store/earth';

const J = ui.explore.journey;
const STEPS = 2000;

function Readout({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div className="rounded-lg bg-panel2 px-2.5 py-1.5">
      <div className="label !text-[10px]">{k}</div>
      <div className="font-bold tabular-nums leading-tight">{v}</div>
      {note && <div className="text-[11px] leading-tight text-muted">{note}</div>}
    </div>
  );
}

/** Three small profile panels sharing the (non-linear) slider axis, with a line at the current position. */
export function ProfileChart({ altKm, height = 220 }: { altKm: number; height?: number }) {
  const W = 78;
  const series = useMemo(() => {
    const temp: [number, number, number][] = [];
    const pres: [number, number][] = [];
    const dens: [number, number][] = [];
    const alts: number[] = [];
    for (let i = 0; i <= 400; i++) alts.push(positionToAltitude(i / 400));
    for (const p of interiorProfile) alts.push(-p.depthKm + 1e-6, -p.depthKm - 1e-6);
    for (const p of atmosphereProfile) alts.push(p.altKm);
    alts.sort((a, b) => b - a);
    for (const a of alts) {
      const v = profileAt(a);
      const y = altitudeToPosition(a);
      if (v.tempC) temp.push([y, v.tempC[0], v.tempC[1]]);
      if (v.pressure) pres.push([y, Math.log10(Math.max(v.pressure.value * (v.pressure.unit === 'GPa' ? 1e7 : 1), 1e-3))]);
      if (v.density && v.density.unit === 'g/cm³') dens.push([y, v.density.value]);
    }
    return { temp, pres, dens };
  }, []);
  const yPix = (pos: number) => 4 + pos * (height - 8);
  const panel = (i: number, title: string, color: string, lo: number, hi: number, body: (x: (v: number) => number) => React.ReactNode, ticks: [number, string][]) => {
    const x0 = i * (W + 8);
    const x = (v: number) => x0 + 3 + ((v - lo) / (hi - lo)) * (W - 6);
    return (
      <g key={title}>
        <rect x={x0} y={0} width={W} height={height} rx={6} fill="var(--panel-2)" />
        {body(x)}
        <text x={x0 + W / 2} y={height + 13} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
          {title}
        </text>
        {ticks.map(([v, t]) => (
          <text key={t} x={x(v)} y={height + 25} textAnchor="middle" fontSize={8.5} fill="var(--muted)">
            {t}
          </text>
        ))}
      </g>
    );
  };
  const line = (pts: [number, number][], x: (v: number) => number) => pts.map(([y, v], k) => `${k ? 'L' : 'M'}${x(v).toFixed(1)},${yPix(y).toFixed(1)}`).join('');
  const cur = yPix(altitudeToPosition(altKm));
  const totalW = 3 * W + 16;
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${totalW} ${height + 30}`} className="w-full" role="img" aria-label={J.chart}>
        {panel(0, `${J.temperature} (°C)`, '#f97316', -100, 5800, (x) => (
          <>
            <path
              d={`${series.temp.map(([y, a], k) => `${k ? 'L' : 'M'}${x(a).toFixed(1)},${yPix(y).toFixed(1)}`).join('')}${[...series.temp].reverse().map(([y, , b]) => `L${x(b).toFixed(1)},${yPix(y).toFixed(1)}`).join('')}Z`}
              fill="#f97316"
              fillOpacity={0.35}
              stroke="#f97316"
              strokeWidth={1.2}
            />
          </>
        ), [[0, '0'], [5000, '5.000']])}
        {panel(1, `${J.pressure} (log)`, '#38bdf8', -3, 9.7, (x) => <path d={line(series.pres, x)} fill="none" stroke="#38bdf8" strokeWidth={1.8} />, [[3, '1 atm'], [9, '100 GPa']])}
        {panel(2, `${J.density} (g/cm³)`, '#a3e635', 0, 14, (x) => <path d={line(series.dens, x)} fill="none" stroke="#a3e635" strokeWidth={1.8} />, [[3, '3'], [10, '10']])}
        <line x1={0} x2={totalW} y1={yPix(altitudeToPosition(0))} y2={yPix(altitudeToPosition(0))} stroke="var(--muted)" strokeDasharray="2 3" strokeWidth={0.8} />
        <line x1={0} x2={totalW} y1={cur} y2={cur} stroke="var(--accent)" strokeWidth={1.6} />
        <circle cx={totalW - 3} cy={cur} r={3} fill="var(--accent)" />
      </svg>
      <figcaption className="text-[11px] leading-tight text-muted">{J.chartNote}</figcaption>
    </figure>
  );
}

/** Vertical journey slider with a live read-out card, presets and the synchronised profile chart. */
export function Journey({ onClose, compact = false }: { onClose: () => void; compact?: boolean }) {
  const depthKm = useEarth((s) => s.depthKm) ?? 0;
  const grouping = useEarth((s) => s.grouping);
  const setDepthKm = useEarth((s) => s.setDepthKm);
  const select = useEarth((s) => s.select);
  const v = profileAt(depthKm);
  const active = layersAt(depthKm, grouping);
  const main = active.find((l) => l.realm !== 'functional') ?? active[0];
  const pos = altitudeToPosition(depthKm);
  const track = [...atmosphereShells, ...interiorShells(grouping)];
  const set = (p: number) => setDepthKm(Math.round(positionToAltitude(p) * 100) / 100);

  const tempText = v.tempC
    ? v.tempC[0] === v.tempC[1]
      ? `${fmt(v.tempC[0], 1)} °C`
      : `≈ ${fmt(v.tempC[0], 0)} – ${fmt(v.tempC[1], 0)} °C`
    : main?.tempC
      ? `${fmt(main.tempC[0])} … ${fmt(main.tempC[1])} °C`
      : '—';
  const slider = (
    <div className={compact ? 'relative h-10 w-full shrink-0' : 'relative h-full w-12 shrink-0'}>
      <div className={`absolute overflow-hidden rounded-full ${compact ? 'inset-x-0 top-3 h-4' : 'inset-y-0 left-4 w-4'}`} aria-hidden>
        {track.map((l) => {
          const a = altitudeToPosition(l.topKm) * 100;
          const b = altitudeToPosition(l.bottomKm) * 100;
          return (
            <div
              key={l.id}
              className="absolute"
              style={compact ? { left: `${a}%`, width: `${b - a}%`, top: 0, bottom: 0, background: l.color } : { top: `${a}%`, height: `${b - a}%`, left: 0, right: 0, background: l.color }}
            />
          );
        })}
      </div>
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={Math.round(pos * STEPS)}
        aria-label={J.slider}
        aria-valuetext={fmtAltitude(depthKm)}
        aria-orientation={compact ? 'horizontal' : 'vertical'}
        onChange={(e) => set(Number(e.target.value) / STEPS)}
        className={`absolute ${compact ? 'inset-0 w-full' : 'inset-0 h-full w-12'}`}
        style={compact ? { opacity: 0.9 } : { writingMode: 'vertical-lr', opacity: 0.9 }}
      />
    </div>
  );

  return (
    <div className={`flex min-h-0 flex-1 ${compact ? 'flex-col gap-2 px-3 pb-3' : 'gap-2 p-3'}`}>
      {!compact && slider}
      <div className="scroll-thin flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-extrabold">{J.title}</h2>
            {!compact && <p className="text-[11px] leading-tight text-muted">{J.hint}</p>}
          </div>
          <button className="btn btn-sm" onClick={onClose} aria-label={J.close}>
            ✕
          </button>
        </div>
        {compact && slider}
        <div aria-live="polite" className="grid gap-1.5">
          <div className="rounded-xl border border-accent bg-accent-soft px-3 py-2">
            <div className="label !text-accent">{J.position}</div>
            <div className="text-lg font-extrabold tabular-nums leading-tight">{fmtAltitude(depthKm)}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {active.map((l) => (
                <button key={l.id} className="chip !text-ink" onClick={() => select(l.id)}>
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Readout k={J.temperature} v={tempText} note={v.tempC ? (depthKm <= 0 ? J.estimate : undefined) : J.noData} />
            <Readout
              k={J.pressure}
              v={v.pressure ? `${fmtAuto(v.pressure.value)} ${v.pressure.unit}` : '—'}
              note={v.pressure ? (depthKm <= 0 ? J.prem : undefined) : J.noData}
            />
            <Readout
              k={J.density}
              v={v.density ? `${fmtAuto(v.density.value)} ${v.density.unit}` : '—'}
              note={v.density ? (v.density.unit === 'kg/m³' ? J.idealGas : J.prem) : J.noData}
            />
            <Readout k={J.state} v={main?.state ? ui.explore.states[main.state] : '—'} note={main?.stateNote} />
          </div>
          {v.oceanZone && (
            <p className="rounded-lg bg-panel2 px-2.5 py-1.5 text-xs">
              <b>{J.oceanZone}:</b> zona {v.oceanZone.name} ({fmt(v.oceanZone.topM)}–{fmt(v.oceanZone.baseM)} m). {v.oceanZone.note}.
            </p>
          )}
          {!v.tempC && <p className="text-[11px] leading-tight text-muted">{J.noDataHint}</p>}
        </div>
        <div>
          <div className="label mb-1">{J.presets}</div>
          <div className="flex flex-wrap gap-1">
            {J.stops.map((p) => (
              <button key={p.label} className="btn btn-sm" aria-pressed={Math.abs(depthKm - p.km) < 0.01} onClick={() => setDepthKm(p.km)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {!compact && <ProfileChart altKm={depthKm} />}
      </div>
    </div>
  );
}

export const journeyLabel = (km: number) => `${km > 0 ? '+' : km < 0 ? '−' : ''}${fmtAuto(Math.abs(km))} km`;
export { layerById };
