import { useEffect, useState } from 'react';
import { layerById, layerList } from '@/content/layers';
import type { EarthLayer } from '@/content/schema';
import { ui } from '@/content/ui';
import { fmt, fmtAuto, fmtRange } from '@/lib/format';
import { useEarth } from '@/store/earth';
import { Tabs } from '@/ui/Tabs';
import { RichText } from '@/ui/RichText';
import { SourceList } from '@/ui/SourceList';
import { derivedData } from './derived';

const P = ui.explore.panel;

export function rangeText(l: EarthLayer): string {
  if (l.topKm === l.bottomKm) return l.rangeNote ?? '—';
  const top = Math.max(l.topKm, l.bottomKm);
  const bot = Math.min(l.topKm, l.bottomKm);
  if (bot >= 0) return `${fmtAuto(bot)} – ${fmtAuto(top)} km ${ui.explore.above}`;
  if (top <= 0) return `${fmtAuto(-top)} – ${fmtAuto(-bot)} km ${ui.explore.below}`;
  return `${fmtAuto(-bot)} km ${ui.explore.below} – ${fmtAuto(top)} km ${ui.explore.above}`;
}

function Row({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 border-b border-line py-2 last:border-0">
      <dt className="label pt-0.5">{k}</dt>
      <dd>
        <div className="font-semibold tabular-nums">{v}</div>
        {note && <div className="text-sm text-muted">{note}</div>}
      </dd>
    </div>
  );
}

function DataTab({ layer }: { layer: EarthLayer }) {
  const d = derivedData(layer);
  const thickness = Math.abs(layer.topKm - layer.bottomKm);
  return (
    <dl>
      <Row k={P.range} v={rangeText(layer)} note={layer.topKm === layer.bottomKm ? undefined : layer.rangeNote} />
      {thickness > 0 && <Row k={P.thickness} v={`≈ ${fmtAuto(thickness)} km`} />}
      {(layer.tempC || layer.tempNote || d.tempC) && (
        <Row
          k={P.temperature}
          v={
            layer.tempC
              ? `≈ ${fmtRange(layer.tempC, 0, '°C')}`
              : d.tempC
                ? `≈ ${fmtRange(d.tempC, 0, '°C')}`
                : '—'
          }
          note={layer.tempNote ?? (d.tempC ? `${P.interpolated}; ${ui.common.estimate}` : undefined)}
        />
      )}
      {(layer.pressure || d.pressure) && (
        <Row
          k={P.pressure}
          v={(() => {
            const p = layer.pressure ?? d.pressure!;
            return `${fmtAuto(p.min)} – ${fmtAuto(p.max)} ${p.unit}`;
          })()}
          note={layer.pressure ? undefined : P.interpolated}
        />
      )}
      {(layer.densityGcm3 || d.density) && (
        <Row
          k={P.density}
          v={`${fmtRange(layer.densityGcm3 ?? d.density!, 2, 'g/cm³')}`}
          note={layer.densityGcm3 ? undefined : P.interpolated}
        />
      )}
      {layer.state && <Row k={P.state} v={ui.explore.states[layer.state]} note={layer.stateNote} />}
      {layer.share && <Row k={P.share} v={layer.share} />}
    </dl>
  );
}

function CompositionTab({ layer }: { layer: EarthLayer }) {
  const hasBars = layer.composition.some((c) => c.fraction !== undefined);
  const max = Math.max(...layer.composition.map((c) => c.fraction ?? 0), 0.0001);
  return (
    <div className="grid gap-3">
      <ul className="grid gap-2">
        {layer.composition.map((c) => (
          <li key={c.label}>
            <div className="flex justify-between gap-2 text-sm">
              <span className="font-semibold">{c.label}</span>
              {c.fraction !== undefined && <span className="tabular-nums text-muted">{fmt(c.fraction * 100, 2)}%</span>}
            </div>
            {c.fraction !== undefined && (
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-panel2" aria-hidden>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(1.5, (c.fraction / max) * 100)}%`, background: layer.color }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {layer.compositionNote && <p className="text-sm text-muted">{layer.compositionNote}</p>}
      {!hasBars && !layer.compositionNote && <p className="text-sm text-muted">{P.noBars}</p>}
      {layer.zones && (
        <div>
          <h4 className="label mb-1">{P.zones}</h4>
          <table className="w-full text-sm">
            <tbody>
              {layer.zones.map((z) => (
                <tr key={z.name} className="border-b border-line last:border-0">
                  <th scope="row" className="py-1.5 pr-2 text-left font-semibold">
                    {z.name}
                  </th>
                  <td className="whitespace-nowrap py-1.5 pr-2 tabular-nums text-muted">{z.range}</td>
                  <td className="py-1.5">{z.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
          <span>
            <RichText text={t} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function InfoPanel({ layer }: { layer: EarthLayer }) {
  const [tab, setTab] = useState(0);
  const select = useEarth((s) => s.select);
  const step = useEarth((s) => s.step);
  const grouping = useEarth((s) => s.grouping);
  const setDepthKm = useEarth((s) => s.setDepthKm);
  useEffect(() => setTab(0), [layer.id]);
  const list = layerList(grouping);
  const idx = list.findIndex((l) => l.id === layer.id);
  const parent = layer.variantOf ? layerById.get(layer.variantOf) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-start gap-3 px-4 pb-3 pt-1 md:pt-4">
        <span aria-hidden className="mt-1 h-10 w-3 shrink-0 rounded-full" style={{ background: layer.color }} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold leading-tight tracking-tight">{layer.name}</h2>
          <p className="text-sm text-muted">
            <span lang="en">{layer.nameEn}</span> · {ui.explore.list.realms[layer.realm]}
          </p>
        </div>
        <button className="btn btn-sm" onClick={() => select(null)} aria-label={P.close}>
          ✕
        </button>
      </header>
      <Tabs tabs={P.tabs} active={tab} onChange={setTab} label={layer.name}>
        {tab === 0 && (
          <div className="grid gap-3">
            <p>
              <RichText text={layer.summary} />
            </p>
            <div className="rounded-xl border border-accent bg-accent-soft p-3">
              <div className="label !text-accent">{P.keyFact}</div>
              <p className="mt-1 font-semibold">
                <RichText text={layer.keyFact} />
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="chip">{rangeText(layer)}</span>
              {layer.state && <span className="chip">{ui.explore.states[layer.state]}</span>}
              {parent && (
                <button className="chip" onClick={() => select(parent.id)}>
                  {P.variantOf} {parent.name}
                </button>
              )}
            </div>
          </div>
        )}
        {tab === 1 && <DataTab layer={layer} />}
        {tab === 2 && <CompositionTab layer={layer} />}
        {tab === 3 && <Bullets items={layer.insights} />}
        {tab === 4 && <Bullets items={layer.evidence} />}
        {tab === 5 && <SourceList sources={layer.sources} verified={layer.verified} />}
      </Tabs>
      <footer className="flex shrink-0 flex-wrap gap-2 border-t border-line p-3">
        <button className="btn btn-sm flex-1" disabled={idx <= 0} onClick={() => step(-1)}>
          ↑ {P.prevLayer}
        </button>
        <button className="btn btn-sm flex-1" disabled={idx < 0 || idx >= list.length - 1} onClick={() => step(1)}>
          ↓ {P.nextLayer}
        </button>
        {layer.topKm !== layer.bottomKm && (
          <button
            className="btn btn-sm w-full"
            onClick={() => setDepthKm(Math.max(-6371, Math.min(10000, (layer.topKm + layer.bottomKm) / 2)))}
          >
            ⇅ {P.seeJourney}
          </button>
        )}
      </footer>
    </div>
  );
}
