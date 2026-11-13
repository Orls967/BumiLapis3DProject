import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { lithologyById } from '@/content/lithologies';
import { paramInfo, scenarioById, scenarios, type ParamKey, type ScenarioParams } from '@/content/scenarios';
import { ui } from '@/content/ui';
import { environmentNames } from '@/content/vocab';
import { fmtAuto } from '@/lib/format';
import { BLOCK_SIZE, buildModel, sampleWell, scaleOp, type Unit } from '@/lib/strata/model';
import { useColumns } from '@/store/columns';
import { hasWebGL } from '@/ui/hooks';
import { QuizButton } from '@/ui/Quiz';
import { SliderField } from '@/ui/SliderField';
import { StratColumnView } from '@/ui/StratColumnView';
import type { SliceState } from '@/scene/strata/StrataBlock';
import { prefersReducedMotion } from '@/scene/earth/live';

const StrataBlock = lazy(() => import('@/scene/strata/StrataBlock'));
const T = ui.strata;

/** Smoothly follow a set of numeric targets; reports whether it is still moving. */
function useTween<K extends string>(target: Record<K, number>, speed = 7): [Record<K, number>, boolean] {
  const [value, setValue] = useState(target);
  const ref = useRef(value);
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) {
      ref.current = target;
      setValue(target);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let done = true;
      const next = { ...ref.current };
      for (const k of Object.keys(target) as K[]) {
        const d = target[k] - ref.current[k];
        if (Math.abs(d) < Math.max(1e-3, Math.abs(target[k]) * 1e-3)) next[k] = target[k];
        else {
          next[k] = ref.current[k] + d * Math.min(1, dt * speed);
          done = false;
        }
      }
      ref.current = next;
      setValue(next);
      if (done) setMoving(false);
      else {
        setMoving(true);
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(target), speed]);
  return [value, moving];
}

function OrderQuiz({ labels, onClose }: { labels: string[]; onClose: () => void }) {
  const Q = T.quizOrder;
  const shuffle = () => {
    const a = labels.map((l, i) => ({ l, i }));
    for (let k = 0; k < 6 && a.every((x, j) => x.i === j); k++) a.sort(() => Math.random() - 0.5);
    if (a.every((x, j) => x.i === j) && a.length > 1) a.reverse();
    return a;
  };
  const [order, setOrder] = useState(shuffle);
  const [result, setResult] = useState<boolean | null>(null);
  const move = (k: number, d: -1 | 1) => {
    const next = [...order];
    [next[k], next[k + d]] = [next[k + d], next[k]];
    setOrder(next);
    setResult(null);
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-3" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={Q.title} className="glass w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">{Q.title}</h2>
            <p className="text-sm text-muted">{Q.hint}</p>
          </div>
          <button className="btn btn-sm" onClick={onClose} aria-label={ui.common.close}>
            ✕
          </button>
        </div>
        <ol className="mt-3 grid gap-1.5">
          {order.map((o, k) => (
            <li key={o.i} className="flex items-center gap-1.5 rounded-xl border border-line bg-panel px-2 py-1">
              <span className="w-6 text-center font-bold text-accent">{k + 1}</span>
              <span className="min-w-0 flex-1 text-sm font-semibold">{o.l}</span>
              <button className="btn btn-sm" disabled={k === 0} onClick={() => move(k, -1)} aria-label={`${Q.up}: ${o.l}`}>
                ↑
              </button>
              <button className="btn btn-sm" disabled={k === order.length - 1} onClick={() => move(k, 1)} aria-label={`${Q.down}: ${o.l}`}>
                ↓
              </button>
            </li>
          ))}
        </ol>
        {result !== null && (
          <p role="status" className={`mt-2 rounded-xl p-2 text-sm font-semibold ${result ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'}`}>
            {result ? Q.right : Q.wrong}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            className="btn flex-1"
            onClick={() => {
              setOrder(shuffle());
              setResult(null);
            }}
          >
            {Q.shuffle}
          </button>
          <button className="btn btn-primary flex-1" onClick={() => setResult(order.every((o, k) => o.i === k))}>
            {Q.check}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StrataPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const addColumn = useColumns((s) => s.add);
  const webgl = useMemo(hasWebGL, []);
  const scenario = scenarioById.get(params.get('skenario') ?? '') ?? scenarios[7];
  const [p, setP] = useState<ScenarioParams>(scenario.defaults);
  const events = useMemo(() => scenario.build(p), [scenario, p]);
  const [step, setStep] = useState(events.length);
  const [playing, setPlaying] = useState(false);
  const [slice, setSlice] = useState<SliceState>({ on: false, azimuthDeg: 30, offsetM: 0 });
  const [well, setWell] = useState<{ x: number; y: number } | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [resetNonce, setResetNonce] = useState(0);
  const [quiz, setQuiz] = useState(false);

  useEffect(() => {
    setP(scenario.defaults);
    setStep(scenario.build(scenario.defaults).length);
    setWell(null);
    setUnitId(null);
    setPlaying(false);
  }, [scenario]);
  useEffect(() => {
    if (!playing) return;
    if (step >= events.length) return setPlaying(false);
    const t = setTimeout(() => setStep((s) => Math.min(events.length, s + 1)), 1700);
    return () => clearTimeout(t);
  }, [playing, step, events.length]);

  const [tw, moving] = useTween({ ...p, step }, 6);
  const [settled, setSettled] = useState(true);
  useEffect(() => {
    if (moving) return setSettled(false);
    const t = setTimeout(() => setSettled(true), 140);
    return () => clearTimeout(t);
  }, [moving, tw]);

  const model = useMemo(() => {
    const evs = scenario.build({ tilt: tw.tilt, amplitude: tw.amplitude, wavelength: tw.wavelength, throwM: tw.throwM, erosion: tw.erosion });
    const full = Math.floor(tw.step + 1e-6);
    const frac = tw.step - full;
    const ops = evs.slice(0, full).map((e) => e.op);
    if (frac > 1e-3 && evs[full]) ops.push(scaleOp(evs[full].op, frac));
    return buildModel(ops);
  }, [scenario, tw]);

  const units = useMemo(() => [...model.units.values()].reverse(), [model]);
  const unit: Unit | null = unitId ? (model.units.get(unitId) ?? null) : null;
  const wellColumn = useMemo(() => (well ? sampleWell(model, well.x, well.y) : null), [model, well]);
  const repeated = wellColumn ? new Set(wellColumn.beds.map((b) => b.description)).size < wellColumn.beds.length : false;
  const current = events[Math.min(events.length, Math.max(1, step)) - 1];
  const set = (k: ParamKey) => (v: number) => setP((old) => ({ ...old, [k]: v }));
  const sendWell = () => {
    if (!wellColumn) return;
    const id = addColumn({ ...wellColumn, title: `${wellColumn.title} · ${scenario.name}` });
    navigate(`/kolom?kolom=${id}`);
  };

  return (
    <div className="page pb-10">
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{T.title}</h1>
          <p className="text-sm text-muted">{T.intro}</p>
        </div>
        <button className="btn btn-sm" onClick={() => setQuiz(true)}>
          <span aria-hidden>⇅</span> {T.quizOrder.open}
        </button>
        <QuizButton module="strata" />
      </header>

      <div className="mt-3 grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)_20rem]">
        <aside className="grid content-start gap-3">
          <section className="card p-3">
            <h2 className="label mb-2">{T.scenario}</h2>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1 xl:grid-cols-2">
              {scenarios.map((s) => (
                <button key={s.id} className="btn btn-sm !h-auto !min-h-11 !justify-start py-1.5 text-left" aria-pressed={s.id === scenario.id} title={s.description} onClick={() => setParams({ skenario: s.id })}>
                  {s.name}
                </button>
              ))}
            </div>
          </section>
          <section className="card grid gap-3 p-3">
            <h2 className="label">{T.deformation}</h2>
            {scenario.params.map((k) => (
              <SliderField key={k} label={paramInfo[k].label} value={p[k]} min={paramInfo[k].min} max={paramInfo[k].max} step={paramInfo[k].step} unit={paramInfo[k].unit} presets={paramInfo[k].presets.map((v) => ({ label: `${v}${paramInfo[k].unit}`, value: v }))} onChange={set(k)} />
            ))}
          </section>
          <section className="card grid gap-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="label">{T.slice}</h2>
              <button className="btn btn-sm" role="switch" aria-checked={slice.on} onClick={() => setSlice((s) => ({ ...s, on: !s.on }))}>
                {slice.on ? '◉' : '○'} {T.sliceOn}
              </button>
            </div>
            <SliderField label={T.slicePos} value={slice.offsetM} min={-450} max={450} step={10} unit="m" disabled={!slice.on} onChange={(v) => setSlice((s) => ({ ...s, offsetM: v }))} presets={[{ label: 'Tengah', value: 0 }]} />
            <SliderField label={T.sliceRot} value={slice.azimuthDeg} min={0} max={180} step={5} unit="°" disabled={!slice.on} onChange={(v) => setSlice((s) => ({ ...s, azimuthDeg: v }))} presets={[0, 45, 90, 135].map((v) => ({ label: `${v}°`, value: v }))} />
          </section>
        </aside>

        <section className="min-w-0">
          <div className="card relative h-[52vh] min-h-[340px] overflow-hidden lg:h-[62vh]" style={{ background: 'radial-gradient(ellipse at 50% 35%, var(--panel) 0%, var(--panel-2) 100%)' }}>
            {webgl ? (
              <Suspense fallback={<div className="grid h-full place-items-center text-muted">{ui.common.loading}</div>}>
                <StrataBlock
                  model={model}
                  quality={settled ? 'high' : 'low'}
                  slice={slice}
                  well={well}
                  selectedUnitId={unitId}
                  resetNonce={resetNonce}
                  onPickUnit={setUnitId}
                  onHoverUnit={setHoverId}
                  onDrill={(x, y) => setWell({ x: Math.min(BLOCK_SIZE - 5, Math.max(5, x)), y: Math.min(BLOCK_SIZE - 5, Math.max(5, y)) })}
                  labels={{ top: '', scale: T.scale }}
                />
              </Suspense>
            ) : (
              <p className="p-4 text-sm text-muted">{ui.explore.noWebgl}</p>
            )}
            {hoverId && model.units.get(hoverId) && (
              <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/20 bg-black/80 px-2.5 py-1.5 text-sm font-bold text-white">{model.units.get(hoverId)!.name}</div>
            )}
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <button className="btn btn-sm glass" onClick={() => setWell({ x: 500, y: 500 })}>
                <span aria-hidden>⛏</span> {T.well.drillHere}
              </button>
              <button className="btn btn-sm glass" onClick={() => setResetNonce((n) => n + 1)}>
                ⟲ {T.resetView}
              </button>
            </div>
            <p className="pointer-events-none absolute bottom-2 left-3 max-w-[50%] text-[11px] leading-tight text-muted">{T.modelNote}</p>
          </div>

          <section className="card mt-3 p-3" aria-label={T.history}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="label">{T.history}</h2>
              <div className="flex gap-1" role="toolbar" aria-label={T.history}>
                <button className="btn btn-sm" onClick={() => (setPlaying(false), setStep(1))} aria-label={T.start}>
                  ⏮
                </button>
                <button className="btn btn-sm" disabled={step <= 1} onClick={() => (setPlaying(false), setStep((s) => Math.max(1, s - 1)))} aria-label={T.stepBack}>
                  ◀
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    if (!playing && step >= events.length) setStep(0);
                    setPlaying((v) => !v);
                  }}
                >
                  {playing ? `⏸ ${T.pause}` : `▶ ${T.play}`}
                </button>
                <button className="btn btn-sm" disabled={step >= events.length} onClick={() => (setPlaying(false), setStep((s) => Math.min(events.length, s + 1)))} aria-label={T.stepFwd}>
                  ▶
                </button>
              </div>
              <span className="chip" aria-live="polite">
                {T.step} {Math.min(step, events.length)} / {events.length}
              </span>
            </div>
            <ol className="mt-2 flex flex-wrap gap-1.5">
              {events.map((e, i) => (
                <li key={i}>
                  <button className="btn btn-sm" aria-pressed={i + 1 === step} style={{ opacity: i + 1 > step ? 0.5 : 1 }} onClick={() => (setPlaying(false), setStep(i + 1))}>
                    {i + 1}. {e.label}
                  </button>
                </li>
              ))}
            </ol>
            {current && (
              <p className="mt-2 text-sm">
                <b>{T.principle}:</b> {current.principle}
              </p>
            )}
            <p className="mt-1 text-sm text-muted">
              <b>{T.lesson}:</b> {scenario.lesson}
            </p>
          </section>
        </section>

        <aside className="grid content-start gap-3">
          <section className="card p-3">
            <h2 className="label mb-1">{T.unit.title}</h2>
            {unit ? (
              <dl className="grid gap-1 text-sm">
                <dt className="text-base font-extrabold">{unit.name}</dt>
                <dd>{unit.description}</dd>
                <dd>
                  <b>{T.unit.lithology}:</b> {lithologyById.get(unit.lithologyId)?.name}
                </dd>
                <dd>
                  <b>{T.unit.age}:</b> {unit.ageLabel ?? '—'}
                </dd>
                {unit.thicknessM > 0 && (
                  <dd>
                    <b>{T.unit.thickness}:</b> {fmtAuto(unit.thicknessM)} m
                  </dd>
                )}
                {unit.environmentId && (
                  <dd>
                    <b>{T.unit.environment}:</b> {environmentNames[unit.environmentId]}
                  </dd>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted">{T.unit.none}</p>
            )}
            <h3 className="label mb-1 mt-3">{T.units}</h3>
            <ul className="grid gap-0.5">
              {units.map((u) => (
                <li key={u.id}>
                  <button className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-panel2 ${u.id === unitId ? 'bg-accent font-bold text-accent-ink hover:bg-accent' : ''}`} onClick={() => setUnitId(u.id)}>
                    <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/30" style={{ background: lithologyById.get(u.lithologyId)?.color }} />
                    <span className="truncate">{u.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-3">
            <h2 className="label mb-1">{T.well.title}</h2>
            {wellColumn && well ? (
              <div className="grid gap-2">
                <p className="text-sm">
                  {T.well.at}: x {Math.round(well.x)} m, y {Math.round(well.y)} m · {T.well.total} {fmtAuto(wellColumn.beds[wellColumn.beds.length - 1]?.baseM ?? 0)} m
                </p>
                {repeated && <p className="rounded-lg bg-accent-soft p-2 text-sm font-semibold text-warn">{T.well.repeated}</p>}
                <div className="flex gap-3">
                  <div className="shrink-0 overflow-hidden rounded-lg border border-line">
                    <StratColumnView column={wellColumn} pxPerM={230 / Math.max(1, wellColumn.beds[wellColumn.beds.length - 1]?.baseM ?? 1)} compact lithWidth={64} />
                  </div>
                  <ol className="min-w-0 flex-1 text-xs" aria-label={T.well.table}>
                    {wellColumn.beds.map((b) => (
                      <li key={b.id} className="border-b border-line py-1 last:border-0">
                        <span className="tabular-nums text-muted">
                          {fmtAuto(b.topM)}–{fmtAuto(b.baseM)} m
                        </span>{' '}
                        {b.description}
                      </li>
                    ))}
                  </ol>
                </div>
                <button className="btn btn-primary" onClick={sendWell}>
                  <span aria-hidden>▤</span> {T.well.send}
                </button>
                <button className="btn btn-sm" onClick={() => setWell(null)}>
                  {T.well.clear}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">{T.well.hint}</p>
            )}
          </section>
        </aside>
      </div>
      {quiz && <OrderQuiz labels={events.map((e) => e.label)} onClose={() => setQuiz(false)} />}
    </div>
  );
}
