import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { ui } from '@/content/ui';
import { fmt, fmtAuto } from '@/lib/format';
import { BASIN, FACIES, basinPresets, cellOf, createBasin, elevationNow, regimeOf, sampleWell, seaLevel, stepBasin, storedArea, xOf, type BasinParams, type BasinState } from '@/lib/sedsim/basin';
import { useColumns } from '@/store/columns';
import { useTheme } from '@/store/theme';
import { prefersReducedMotion, themeColors, useCanvas2D } from '@/ui/hooks';
import { SliderField } from '@/ui/SliderField';
import { StratColumnView } from '@/ui/StratColumnView';
import type { SedsimRequest, SedsimResponse } from '@/workers/sedsim.worker';

const T = ui.sed;
const B = T.basin;
const RUN_SECONDS = 22;
const SPEEDS = [0.5, 1, 2, 4];

type SliderDef = { key: keyof BasinParams; label: string; min: number; max: number; step: number; unit: string; presets: number[] };
const SLIDERS: SliderDef[] = [
  { key: 'supply', label: B.supply, min: 0, max: 12, step: 0.5, unit: 'm²/thn', presets: [1, 4.5, 8] },
  { key: 'amplitudeM', label: B.amplitude, min: 0, max: 50, step: 5, unit: 'm', presets: [0, 25, 50] },
  { key: 'periodKyr', label: B.period, min: 100, max: 800, step: 50, unit: T.kyr, presets: [100, 400, 800] },
  { key: 'trendMPerKyr', label: B.trend, min: -0.03, max: 0.05, step: 0.005, unit: `m/${T.kyr}`, presets: [-0.02, 0, 0.015] },
  { key: 'subsidence', label: B.subsidence, min: 0, max: 0.1, step: 0.01, unit: `m/${T.kyr}`, presets: [0, 0.02, 0.06] },
  { key: 'slope', label: B.slope, min: 0.4, max: 2.5, step: 0.1, unit: 'm/km', presets: [0.5, 1, 2] },
  { key: 'durationKyr', label: B.duration, min: 500, max: 3000, step: 100, unit: T.kyr, presets: [1000, 1500, 3000] },
];

/** Fixed vertical window of the section so that the picture does not jump while the model runs. */
function zRange(p: BasinParams): [number, number] {
  const slMax = Math.max(0, p.amplitudeM + Math.max(0, p.trendMPerKyr) * p.durationKyr);
  const slMin = Math.min(0, -p.amplitudeM + Math.min(0, p.trendMPerKyr) * p.durationKyr);
  const top = Math.max(p.slope * BASIN.shore0Km, slMax) + 12;
  const bottom = Math.min(-p.slope * (BASIN.lengthKm - BASIN.shore0Km) - p.subsidence * p.durationKyr, slMin) - 12;
  return [bottom, top];
}

function drawBasin(ctx: CanvasRenderingContext2D, W: number, H: number, s: BasinState, wellKm: number, dark: boolean) {
  const c = themeColors();
  const padL = 8;
  const padR = 8;
  const padT = 22;
  const padB = 22;
  const [z0, z1] = zRange(s.params);
  const X = (km: number) => padL + (km / BASIN.lengthKm) * (W - padL - padR);
  const Y = (z: number) => padT + ((z1 - z) / (z1 - z0)) * (H - padT - padB);
  const xi = (i: number) => (i < 0 ? X(0) : i >= s.nx ? X(BASIN.lengthKm) : X(xOf(s, i)));
  const sl = seaLevel(s.params, s.tKyr);

  // sky
  const sky = ctx.createLinearGradient(0, padT, 0, Y(sl));
  sky.addColorStop(0, dark ? '#0d1730' : '#dcecff');
  sky.addColorStop(1, dark ? '#1b2c52' : '#f3f8ff');
  ctx.fillStyle = sky;
  ctx.fillRect(X(0), padT, X(BASIN.lengthKm) - X(0), Y(sl) - padT);
  // sea
  const sea = ctx.createLinearGradient(0, Y(sl), 0, H - padB);
  sea.addColorStop(0, dark ? '#2b6cb0' : '#69a9e6');
  sea.addColorStop(1, dark ? '#12305c' : '#2f6fb5');
  ctx.fillStyle = sea;
  ctx.fillRect(X(0), Y(sl), X(BASIN.lengthKm) - X(0), H - padB - Y(sl));

  const col = (g: ArrayLike<number>, i: number) => Y(elevationNow(s, g, Math.min(s.nx - 1, Math.max(0, i))));
  // basement
  ctx.beginPath();
  ctx.moveTo(X(0), H - padB);
  for (let i = -1; i <= s.nx; i++) ctx.lineTo(xi(i), col(s.base, i));
  ctx.lineTo(X(BASIN.lengthKm), H - padB);
  ctx.closePath();
  ctx.fillStyle = dark ? '#3b3f4d' : '#8a8d98';
  ctx.fill();

  // packets between consecutive time lines, coloured by facies
  for (let k = 0; k < s.surfaces.length; k++) {
    const up = s.surfaces[k];
    const lo = k > 0 ? s.surfaces[k - 1] : s.base;
    const f = s.facies[k];
    for (let i = -1; i < s.nx; i++) {
      const a = Math.max(0, i);
      const b = Math.min(s.nx - 1, i + 1);
      if (up[a] - lo[a] < 1e-3 && up[b] - lo[b] < 1e-3) continue;
      const color = FACIES[f[up[a] - lo[a] >= up[b] - lo[b] ? a : b]].color;
      ctx.beginPath();
      ctx.moveTo(xi(i), col(up, i));
      ctx.lineTo(xi(i + 1), col(up, i + 1));
      ctx.lineTo(xi(i + 1), col(lo, i + 1));
      ctx.lineTo(xi(i), col(lo, i));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.7;
      ctx.fill();
      ctx.stroke();
    }
  }
  // time lines
  ctx.lineJoin = 'round';
  for (let k = 3; k < s.surfaces.length; k += 4) {
    ctx.beginPath();
    for (let i = -1; i <= s.nx; i++) (i === -1 ? ctx.moveTo : ctx.lineTo).call(ctx, xi(i), col(s.surfaces[k], i));
    ctx.strokeStyle = 'rgba(20,20,30,0.55)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // current surface
  ctx.beginPath();
  for (let i = -1; i <= s.nx; i++) {
    const y = Y(s.h[Math.min(s.nx - 1, Math.max(0, i))]);
    if (i === -1) ctx.moveTo(xi(i), y);
    else ctx.lineTo(xi(i), y);
  }
  ctx.strokeStyle = dark ? '#f8fafc' : '#1c1917';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // sea-level line
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(X(0), Y(sl));
  ctx.lineTo(X(BASIN.lengthKm), Y(sl));
  ctx.strokeStyle = dark ? '#93c5fd' : '#1d4ed8';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.setLineDash([]);

  // well
  const wi = cellOf(s, wellKm);
  const wx = X(wellKm);
  ctx.beginPath();
  ctx.moveTo(wx, Y(s.h[wi]) - 16);
  ctx.lineTo(wx, col(s.base, wi) + 6);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx - 6, Y(s.h[wi]) - 16);
  ctx.lineTo(wx + 6, Y(s.h[wi]) - 16);
  ctx.lineTo(wx, Y(s.h[wi]) - 5);
  ctx.closePath();
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  // labels
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.fillStyle = c.muted;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(B.land, X(0) + 4, 5);
  ctx.textAlign = 'right';
  ctx.fillText(B.sea, X(BASIN.lengthKm) - 4, 5);
  ctx.fillStyle = dark ? '#bfdbfe' : '#1e3a8a';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${B.seaLevel} ${sl >= 0 ? '+' : '−'}${fmt(Math.abs(sl), 0)} m`, X(BASIN.lengthKm) - 6, Y(sl) - 3);
  ctx.fillStyle = dark ? '#d4d4d8' : '#fafafa';
  ctx.textAlign = 'left';
  ctx.fillText(B.basement, X(0) + 6, H - padB - 4);
  ctx.fillStyle = c.muted;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  for (let km = 0; km <= BASIN.lengthKm; km += 25) ctx.fillText(`${km} km`, Math.min(W - 22, Math.max(18, X(km))), H - padB + 5);
  const ve = ((H - padT - padB) / (z1 - z0)) / ((W - padL - padR) / (BASIN.lengthKm * 1000));
  ctx.fillText(`${B.exaggeration} ≈ ${fmt(Math.round(ve / 10) * 10)}×`, W / 2, 5);
}

function Charts({ s }: { s: BasinState }) {
  const p = s.params;
  const W = 300;
  const Hh = 112;
  const m = { l: 34, r: 8, t: 8, b: 20 };
  const tx = scaleLinear([0, p.durationKyr], [m.l, W - m.r]);
  const planned = useMemo(() => Array.from({ length: 121 }, (_, k) => (k / 120) * p.durationKyr).map((t) => [t, seaLevel(p, t)] as [number, number]), [p]);
  const ext = planned.reduce(([a, b], [, v]) => [Math.min(a, v), Math.max(b, v)], [-5, 5]);
  const sy = scaleLinear([ext[0] - 3, ext[1] + 3], [Hh - m.b, m.t]);
  const path = line<[number, number]>().x((d) => tx(d[0])).y((d) => sy(d[1]));
  const px = scaleLinear([0, BASIN.lengthKm], [m.l, W - m.r]);
  const ty = scaleLinear([0, p.durationKyr], [Hh - m.b, m.t]);
  const shore = s.times.map((t, k) => [s.shorelines[k], t] as [number, number]).filter((d) => Number.isFinite(d[0]));
  const spath = line<[number, number]>().x((d) => px(d[0])).y((d) => ty(d[1]));
  const axis = 'fill-[var(--muted)] text-[9px]';
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <figure className="card p-2">
        <figcaption className="label mb-1">{B.chartSea}</figcaption>
        <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full" role="img" aria-label={B.chartSea}>
          <line x1={m.l} x2={W - m.r} y1={sy(0)} y2={sy(0)} stroke="var(--line)" />
          <line x1={m.l} x2={m.l} y1={m.t} y2={Hh - m.b} stroke="var(--line)" />
          <path d={path(planned) ?? ''} fill="none" stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
          <path d={path(planned.filter((d) => d[0] <= s.tKyr)) ?? ''} fill="none" stroke="#3b82f6" strokeWidth={2.2} />
          <circle cx={tx(s.tKyr)} cy={sy(seaLevel(p, s.tKyr))} r={4} fill="#3b82f6" stroke="var(--panel)" strokeWidth={1.5} />
          <text x={m.l - 4} y={sy(ext[1]) + 3} textAnchor="end" className={axis}>{fmt(ext[1])} m</text>
          <text x={m.l - 4} y={sy(ext[0]) + 3} textAnchor="end" className={axis}>{fmt(ext[0])} m</text>
          <text x={m.l} y={Hh - 5} className={axis}>0</text>
          <text x={W - m.r} y={Hh - 5} textAnchor="end" className={axis}>{fmt(p.durationKyr)} {T.kyr}</text>
        </svg>
      </figure>
      <figure className="card p-2">
        <figcaption className="label mb-1">{B.chartShore}</figcaption>
        <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full" role="img" aria-label={B.chartShore}>
          <line x1={m.l} x2={W - m.r} y1={Hh - m.b} y2={Hh - m.b} stroke="var(--line)" />
          <line x1={m.l} x2={m.l} y1={m.t} y2={Hh - m.b} stroke="var(--line)" />
          <line x1={px(BASIN.shore0Km)} x2={px(BASIN.shore0Km)} y1={m.t} y2={Hh - m.b} stroke="var(--line)" strokeDasharray="2 3" />
          <path d={spath(shore) ?? ''} fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinejoin="round" />
          {shore.length > 0 && <circle cx={px(shore[shore.length - 1][0])} cy={ty(shore[shore.length - 1][1])} r={4} fill="var(--accent)" stroke="var(--panel)" strokeWidth={1.5} />}
          <text x={m.l} y={Hh - 5} className={axis}>{B.land.toLowerCase()} 0 km</text>
          <text x={W - m.r} y={Hh - 5} textAnchor="end" className={axis}>{BASIN.lengthKm} km {B.sea.toLowerCase()}</text>
          <text x={m.l - 4} y={m.t + 6} textAnchor="end" className={axis}>{fmt(p.durationKyr)}</text>
          <text x={m.l - 4} y={Hh - m.b} textAnchor="end" className={axis}>0</text>
        </svg>
      </figure>
    </div>
  );
}

export default function BasinSim() {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const addColumn = useColumns((st) => st.add);
  const dark = useTheme((st) => st.dark);
  const preset = basinPresets.find((p) => p.id === search.get('preset')) ?? basinPresets[0];
  const [params, setParams] = useState<BasinParams>(preset.params);
  const [presetId, setPresetId] = useState<string | null>(preset.id);
  const [wellKm, setWellKm] = useState(preset.wellKm);
  const [speed, setSpeed] = useState(1);
  const [state, setState] = useState<BasinState>(() => createBasin(preset.params));
  const [playing, setPlaying] = useState(false);
  const worker = useRef<Worker | null>(null);
  const fallback = useRef<BasinState | null>(null);
  const send = (m: SedsimRequest) => worker.current?.postMessage(m);

  useEffect(() => {
    try {
      const w = new Worker(new URL('../../workers/sedsim.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<SedsimResponse>) => {
        setState(e.data.state);
        setPlaying(e.data.playing);
      };
      worker.current = w;
      return () => w.terminate();
    } catch {
      worker.current = null; // no worker support: the model is fast enough to finish on the main thread
    }
  }, []);

  // (re)start whenever the parameters change
  useEffect(() => {
    const still = prefersReducedMotion();
    const t = setTimeout(() => {
      if (worker.current) {
        send({ type: 'init', params, play: !still, runSeconds: RUN_SECONDS / speed });
        if (still) send({ type: 'finish' });
      } else {
        const st = createBasin(params);
        stepBasin(st, Infinity);
        fallback.current = st;
        setState(st);
      }
    }, 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  useEffect(() => send({ type: 'speed', runSeconds: RUN_SECONDS / speed }), [speed]);

  const [canvasRef, redraw] = useCanvas2D((ctx, w, h) => drawBasin(ctx, w, h, state, wellKm, dark));
  useEffect(redraw, [redraw, state, wellKm, dark]);

  const applyPreset = (id: string) => {
    const p = basinPresets.find((x) => x.id === id)!;
    setPresetId(id);
    setParams(p.params);
    setWellKm(p.wellKm);
    setSearch({ sim: 'cekungan', preset: id }, { replace: true });
  };
  const setParam = (k: keyof BasinParams) => (v: number) => {
    setPresetId(null);
    setParams((old) => ({ ...old, [k]: v }));
  };

  const well = useMemo(() => sampleWell(state, wellKm), [state, wellKm]);
  const info = regimeOf(state);
  const shore = state.shorelines[state.shorelines.length - 1];
  const done = state.steps >= state.totalSteps;
  const total = well.beds[well.beds.length - 1]?.baseM ?? 0;
  const sendWell = () => {
    const id = addColumn({ ...well, title: `${well.title} · ${presetId ? B.presetNames[presetId] : T.tabs.basin}` });
    navigate(`/kolom?kolom=${id}`);
  };
  const v100 = info.shorelineRateKmPerKyr * 100;

  return (
    <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)_17rem]">
      <aside className="order-2 grid content-start gap-3 lg:order-none">
        <section className="card p-3">
          <h2 className="label mb-2">{B.presets}</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {basinPresets.map((p) => (
              <button key={p.id} className="btn btn-sm !h-auto !min-h-11 py-1.5" aria-pressed={p.id === presetId} onClick={() => applyPreset(p.id)}>
                {B.presetNames[p.id]}
              </button>
            ))}
          </div>
        </section>
        <section className="card grid gap-3 p-3">
          <h2 className="label">{B.params}</h2>
          {SLIDERS.map((d) => (
            <SliderField key={d.key} label={d.label} value={params[d.key]} min={d.min} max={d.max} step={d.step} unit={d.unit} presets={d.presets.map((v) => ({ label: fmtAuto(v), value: v }))} onChange={setParam(d.key)} />
          ))}
        </section>
      </aside>

      <section className="order-1 min-w-0 lg:order-none">
        <div className="card overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block h-[44vh] min-h-[280px] w-full cursor-crosshair"
            role="img"
            aria-label={B.canvasLabel}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const km = ((e.clientX - r.left - 8) / (r.width - 16)) * BASIN.lengthKm;
              setWellKm(Math.round(Math.min(BASIN.lengthKm - 1, Math.max(1, km))));
            }}
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-line p-2">
            <div className="flex gap-1" role="toolbar" aria-label={T.tabs.basin}>
              <button
                className="btn btn-sm btn-primary min-w-24"
                onClick={() => {
                  if (playing) send({ type: 'pause' });
                  else if (done) send({ type: 'init', params, play: true, runSeconds: RUN_SECONDS / speed });
                  else send({ type: 'play' });
                }}
              >
                {playing ? `⏸ ${T.pause}` : `▶ ${T.play}`}
              </button>
              <button className="btn btn-sm" disabled={done} onClick={() => send({ type: 'step' })}>
                ⏭ {T.step}
              </button>
              <button className="btn btn-sm" onClick={() => send({ type: 'init', params, play: false, runSeconds: RUN_SECONDS / speed })}>
                ⟲ {T.reset}
              </button>
            </div>
            <div className="flex items-center gap-1" role="group" aria-label={T.speed}>
              <span className="text-xs text-muted">{T.speed}</span>
              {SPEEDS.map((v) => (
                <button key={v} className="btn btn-sm" aria-pressed={v === speed} onClick={() => setSpeed(v)}>
                  {fmtAuto(v)}×
                </button>
              ))}
            </div>
            <span className="chip ml-auto tabular-nums">
              {T.time}: {fmt(state.tKyr)} / {fmt(params.durationKyr)} {T.kyr}
            </span>
          </div>
        </div>

        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={B.facies}>
          {FACIES.map((f, k) => (
            <li key={f.id} className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-sm border border-black/30" style={{ background: f.color }} />
              {B.faciesNames[k]}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="h-0 w-5 border-t border-ink/70" />
            {B.timeline} ({fmt((params.durationKyr / BASIN.timelines) * 4)} {T.kyr})
          </li>
        </ul>

        <section className="card mt-3 border-l-4 !border-l-accent p-3" aria-live="polite">
          <h2 className="label mb-1">{B.explain}</h2>
          <p className="text-sm">{B.regime[info.regime]}</p>
          <p className="mt-1 text-sm text-muted">
            {Number.isFinite(shore) ? `${B.shorelineAt} ${fmt(shore)} km` : B.noShoreline}
            {Math.abs(v100) >= 0.4 && ` · ${v100 > 0 ? B.shoreAdvance : B.shoreRetreat} ${fmtAuto(Math.abs(v100))} km / 100 ${T.kyr}`}
            {' · '}
            {Math.abs(info.seaLevelRate) < 0.005 ? B.seaStill : `${info.seaLevelRate > 0 ? B.seaRising : B.seaFalling} ${fmtAuto(Math.abs(info.seaLevelRate * 100))} m / 100 ${T.kyr}`}
          </p>
        </section>

        <div className="mt-3">
          <Charts s={state} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {B.model} {B.mass} {fmt(state.influx)} m·km, {B.stored} {fmt(storedArea(state))} m·km.
        </p>
      </section>

      <aside className="order-3 grid content-start gap-3 lg:order-none">
        <section className="card grid gap-2 p-3">
          <h2 className="label">{B.well}</h2>
          <SliderField label={B.wellPos} value={wellKm} min={1} max={BASIN.lengthKm - 1} step={1} unit="km" presets={[30, 60, 90, 120].map((v) => ({ label: `${v}`, value: v }))} onChange={setWellKm} />
          <p className="text-xs text-muted">{B.wellHint}</p>
          {well.beds.length ? (
            <>
              <div className="flex gap-3">
                <div className="shrink-0 overflow-hidden rounded-lg border border-line">
                  <StratColumnView column={well} pxPerM={220 / Math.max(1, total)} compact lithWidth={64} />
                </div>
                <ol className="min-w-0 flex-1 text-xs">
                  {well.beds.map((b) => (
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
                <span aria-hidden>▤</span> {B.send}
              </button>
            </>
          ) : (
            <p className="text-sm text-muted">{B.wellEmpty}</p>
          )}
        </section>
      </aside>
    </div>
  );
}
