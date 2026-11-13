import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { environmentById, environments } from '@/content/environments';
import { exampleObservations } from '@/content/examples';
import { grainSizeInfo, lithologies } from '@/content/lithologies';
import { GRAIN_SIZES, type Observation, type ObservationFeature } from '@/content/schema';
import { ui } from '@/content/ui';
import { colors, fossils, geometries, roundings, sortings, specials, structures, trends, type VocabItem } from '@/content/vocab';
import { fmt } from '@/lib/format';
import { interpret } from '@/lib/interpret/engine';
import { CandidateCard, ScoreBar, settingColor, valueName } from './shared';

const T = ui.interp;
const F = T.form;
const SEDIMENTARY = lithologies.filter((l) => l.id !== 'igneous' && l.id !== 'metamorphic');
const MULTI: { key: 'lithology' | 'structures' | 'fossils' | 'special'; items: VocabItem[] }[] = [
  { key: 'lithology', items: SEDIMENTARY.map((l) => ({ id: l.id, name: l.name })) },
  { key: 'structures', items: structures },
  { key: 'fossils', items: fossils },
  { key: 'special', items: specials },
];
const SINGLE: { key: 'grainSize' | 'sorting' | 'rounding' | 'color' | 'trend' | 'geometry'; items: VocabItem[] }[] = [
  { key: 'grainSize', items: GRAIN_SIZES.map((g) => ({ id: g, name: `${grainSizeInfo[g].name} (${grainSizeInfo[g].mm} mm)` })) },
  { key: 'sorting', items: sortings },
  { key: 'rounding', items: roundings },
  { key: 'trend', items: trends },
  { key: 'color', items: colors },
  { key: 'geometry', items: geometries },
];

export default function FormInterp() {
  const [params, setParams] = useSearchParams();
  const initial = exampleObservations.find((e) => e.id === params.get('contoh'));
  const [obs, setObs] = useState<Observation>(initial?.observation ?? {});
  const [exampleId, setExampleId] = useState<string | null>(initial?.id ?? null);
  const result = useMemo(() => interpret(obs, environments), [obs]);
  const any = result.filled.length > 0;

  const change = (next: Observation) => {
    setObs(next);
    setExampleId(null);
  };
  const toggle = (key: (typeof MULTI)[number]['key'], id: string) => {
    const cur = obs[key] ?? [];
    const list = cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id];
    const next = { ...obs, [key]: list };
    if (list.length === 0) delete next[key];
    change(next);
  };
  const setSingle = (key: (typeof SINGLE)[number]['key'], value: string) => {
    const next = { ...obs } as Record<string, unknown>;
    if (value) next[key] = value;
    else delete next[key];
    change(next as Observation);
  };
  const applySuggestion = (feature: ObservationFeature, value: string) => {
    if (MULTI.some((m) => m.key === feature)) toggle(feature as (typeof MULTI)[number]['key'], value);
    // grain-size suggestions are groups, not classes: leave the choice of class to the user
    else if (feature !== 'grainSize') setSingle(feature as (typeof SINGLE)[number]['key'], value);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="grid content-start gap-3" aria-label={F.title}>
        <div className="card p-3">
          <h2 className="label mb-2">{F.examples}</h2>
          <div className="flex flex-wrap gap-1.5">
            {exampleObservations.map((e) => (
              <button
                key={e.id}
                className="btn btn-sm !h-auto !min-h-9 py-1 text-left"
                aria-pressed={e.id === exampleId}
                onClick={() => {
                  setObs(e.observation);
                  setExampleId(e.id);
                  setParams({ mode: 'formulir', contoh: e.id }, { replace: true });
                }}
              >
                {e.label}
              </button>
            ))}
            <button className="btn btn-sm btn-ghost" onClick={() => (change({}), setParams({ mode: 'formulir' }, { replace: true }))}>
              ✕ {F.clear}
            </button>
          </div>
        </div>
        <form className="card grid gap-4 p-3" onSubmit={(e) => e.preventDefault()}>
          <div>
            <h2 className="text-base font-extrabold">{F.title}</h2>
            <p className="text-sm text-muted">{F.hint}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SINGLE.map(({ key, items }) => (
              <label key={key} className="grid gap-1 text-sm font-semibold">
                {F.features[key]}
                <select className="min-h-11 rounded-xl border border-line bg-panel px-2 font-normal" value={(obs[key] as string | undefined) ?? ''} onChange={(e) => setSingle(key, e.target.value)}>
                  <option value="">{F.any}</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {MULTI.map(({ key, items }) => (
            <fieldset key={key}>
              <legend className="mb-1 text-sm font-semibold">{F.features[key]}</legend>
              <div className="flex flex-wrap gap-1.5">
                {items.map((i) => {
                  const on = obs[key]?.includes(i.id) ?? false;
                  return (
                    <button key={i.id} type="button" role="checkbox" aria-checked={on} aria-pressed={on} className="btn btn-sm !h-auto !min-h-9 py-1 text-left" onClick={() => toggle(key, i.id)}>
                      {i.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </form>
      </section>

      <section className="grid content-start gap-3" aria-live="polite" aria-label={T.result.title}>
        <h2 className="text-base font-extrabold">{T.result.title}</h2>
        {!any ? (
          <p className="card p-4 text-sm text-muted">{T.result.empty}</p>
        ) : (
          <>
            {result.top.map((c, i) => (
              <CandidateCard key={c.env.id} c={c} place={i + 1} />
            ))}
            <p className="text-xs text-muted">{T.result.formula}.</p>
            {result.suggestions.length > 0 && (
              <div className="card border-l-4 !border-l-accent p-3">
                <h3 className="label mb-1">{T.result.suggestions}</h3>
                <p className="mb-2 text-sm text-muted">{T.result.suggestionsHint}</p>
                <ul className="grid gap-1.5">
                  {result.suggestions.map((s) => (
                    <li key={`${s.feature}:${s.value}`} className="flex flex-wrap items-center gap-2 text-sm">
                      <button className="btn btn-sm" onClick={() => applySuggestion(s.feature, s.value)} disabled={s.feature === 'grainSize'}>
                        + {F.features[s.feature]}: {valueName(s.feature, s.value)}
                      </button>
                      <span className="text-muted">
                        {T.result.favours} <b className="text-ink">{environmentById.get(s.favours)!.name}</b> — {s.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <details className="card p-3">
              <summary className="cursor-pointer text-sm font-semibold">{T.result.all}</summary>
              <ul className="mt-2 grid gap-1.5">
                {result.candidates.map((c) => (
                  <li key={c.env.id} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] items-center gap-2 text-sm">
                    <span className="truncate">{c.env.name}</span>
                    <ScoreBar score={c.score} color={settingColor[c.env.setting]} />
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                {result.filled.length} / 10 · {fmt(result.candidates.filter((c) => c.score > 0).length)} &gt; 0
              </p>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
