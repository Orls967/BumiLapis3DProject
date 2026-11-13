import { useEffect, useMemo, useRef, useState } from 'react';
import { grainSizeInfo } from '@/content/lithologies';
import type { GrainSize } from '@/content/schema';
import { ui } from '@/content/ui';
import { fmtAuto } from '@/lib/format';
import { createTube, fergusonChurch, stepTube, stokesVelocity, type TubeState } from '@/lib/sedsim/settling';
import { useTheme } from '@/store/theme';
import { prefersReducedMotion, useCanvas2D } from '@/ui/hooks';

const T = ui.sed;
const U = T.tube;
const HEIGHT_M = 1;
const N = 520;
const CLASSES: { id: GrainSize; color: string; r: number }[] = [
  { id: 'c-sand', color: '#f59e0b', r: 5.2 },
  { id: 'm-sand', color: '#fcd34d', r: 4.3 },
  { id: 'f-sand', color: '#fde68a', r: 3.5 },
  { id: 'vf-sand', color: '#a7f3d0', r: 2.8 },
  { id: 'silt', color: '#93c5fd', r: 2.2 },
  { id: 'clay', color: '#c4b5fd', r: 1.6 },
];
const SPEEDS = [1, 10, 100, 1000, 10000];

function fmtDuration(sec: number): string {
  if (sec < 60) return `${fmtAuto(sec)} dtk`;
  if (sec < 3600) return `${fmtAuto(sec / 60)} mnt`;
  if (sec < 86400) return `${fmtAuto(sec / 3600)} jam`;
  return `${fmtAuto(sec / 86400)} hari`;
}
const fmtVel = (w: number) => (w >= 0.01 ? `${fmtAuto(w * 100)} cm/dtk` : w >= 1e-5 ? `${fmtAuto(w * 1000)} mm/dtk` : `${fmtAuto(w * 1e6)} µm/dtk`);

export default function TubeSim() {
  const dark = useTheme((s) => s.dark);
  const [enabled, setEnabled] = useState<boolean[]>([true, false, true, false, true, true]);
  const [speed, setSpeed] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [, setFrame] = useState(0);
  const active = useMemo(() => CLASSES.filter((_, i) => enabled[i]), [enabled]);
  const tube = useRef<TubeState | null>(null);
  const init = () => {
    tube.current = createTube(
      active.map((c) => ({ id: c.id, dMm: grainSizeInfo[c.id].midMm, share: 1 })),
      N,
      HEIGHT_M,
      11,
    );
    setFrame((f) => f + 1);
  };
  useEffect(() => {
    init();
    setPlaying(!prefersReducedMotion() && active.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const [canvasRef, redraw] = useCanvas2D((ctx, W, H) => {
    const s = tube.current;
    if (!s) return;
    const tw = Math.min(220, W - 80);
    const x0 = (W - tw) / 2;
    const top = 26;
    const bottom = H - 16;
    const pileMax = (bottom - top) * 0.3;
    const waterBottom = bottom;
    // water
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, dark ? '#1e3a66' : '#cfe6ff');
    g.addColorStop(1, dark ? '#0f2444' : '#9cc8f5');
    ctx.fillStyle = g;
    ctx.fillRect(x0, top, tw, bottom - top);
    // settled pile: stack grains in arrival order, row by row
    const settledIdx: number[] = [];
    for (let i = 0; i < s.cls.length; i++) if (s.settled[i]) settledIdx.push(i);
    settledIdx.sort((a, b) => s.order[a] - s.order[b]);
    const totalArea = Array.from(s.cls).reduce((a, k) => a + active[k].r * active[k].r * 4, 0);
    const scale = Math.min(1, (pileMax * tw) / Math.max(1, totalArea));
    let area = 0;
    for (const i of settledIdx) {
      const c = active[s.cls[i]];
      const y = waterBottom - (area * scale) / tw - c.r * 0.9;
      area += c.r * c.r * 4;
      ctx.beginPath();
      ctx.arc(x0 + c.r + s.x[i] * (tw - 2 * c.r), y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    const pileTop = waterBottom - (area * scale) / tw;
    // falling grains
    const fallSpan = pileTop - top - 6;
    for (let i = 0; i < s.cls.length; i++) {
      if (s.settled[i]) continue;
      const c = active[s.cls[i]];
      ctx.beginPath();
      ctx.arc(x0 + c.r + s.x[i] * (tw - 2 * c.r), top + 4 + (1 - s.y[i] / s.heightM) * fallSpan, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
    }
    // glass
    ctx.strokeStyle = dark ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, top - 8);
    ctx.lineTo(x0, bottom);
    ctx.lineTo(x0 + tw, bottom);
    ctx.lineTo(x0 + tw, top - 8);
    ctx.stroke();
    // scale bar
    ctx.fillStyle = dark ? '#a3aec8' : '#57534e';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const f of [0, 0.5, 1]) {
      const y = top + f * (bottom - top);
      ctx.fillRect(x0 - 8, y - 0.5, 6, 1);
      ctx.fillText(`${fmtAuto((1 - f) * HEIGHT_M * 100)} cm`, x0 - 11, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(U.notToScale, W / 2, 4);
  });

  useEffect(() => {
    redraw();
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = tube.current;
      if (s) {
        const more = stepTube(s, dt * speed);
        redraw();
        setFrame((f) => f + 1);
        if (!more) return setPlaying(false);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, redraw, dark]);

  const s = tube.current;
  const done = !!s && s.nSettled >= s.cls.length;
  const stepOnce = () => {
    setPlaying(false);
    if (s) stepTube(s, speed / 4);
    redraw();
    setFrame((f) => f + 1);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="card overflow-hidden">
        <canvas ref={canvasRef} className="block h-[56vh] min-h-[340px] w-full" role="img" aria-label={U.canvasLabel} />
        <div className="flex flex-wrap items-center gap-2 border-t border-line p-2">
          <div className="flex gap-1" role="toolbar" aria-label={T.tabs.tube}>
            <button
              className="btn btn-sm btn-primary min-w-24"
              onClick={() => {
                if (done) init();
                setPlaying((v) => !v || done);
              }}
            >
              {playing ? `⏸ ${T.pause}` : `▶ ${T.play}`}
            </button>
            <button className="btn btn-sm" disabled={done} onClick={stepOnce}>
              ⏭ {T.step}
            </button>
            <button className="btn btn-sm" onClick={() => (setPlaying(false), init(), redraw())}>
              ⟲ {T.reset}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label={T.speed}>
            <span className="text-xs text-muted">{T.speed}</span>
            {SPEEDS.map((v) => (
              <button key={v} className="btn btn-sm" aria-pressed={v === speed} onClick={() => setSpeed(v)}>
                {fmtAuto(v)}×
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid content-start gap-3">
        <p className="text-sm">{U.intro}</p>
        <div className="card p-3">
          <h2 className="label mb-2">{U.mix}</h2>
          <div className="flex flex-wrap gap-1.5">
            {CLASSES.map((c, i) => (
              <button key={c.id} className="btn btn-sm" role="switch" aria-checked={enabled[i]} aria-pressed={enabled[i]} onClick={() => setEnabled((e) => e.map((v, k) => (k === i ? !v : v)))}>
                <span className="h-3 w-3 rounded-full border border-black/40" style={{ background: c.color }} />
                {grainSizeInfo[c.id].name}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-3" aria-live="polite">
          <p className="text-sm tabular-nums">
            <b>{U.elapsed}:</b> {fmtDuration(s?.tS ?? 0)} · <b>{U.settled}:</b> {s?.nSettled ?? 0} / {s?.cls.length ?? 0}
          </p>
          {done && <p className="mt-1 text-sm font-semibold text-ok">{U.done}</p>}
        </div>
        <div className="card overflow-x-auto p-3">
          <h2 className="label mb-2">{U.table}</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-2">{U.colClass}</th>
                <th className="py-1 pr-2">{U.colD}</th>
                <th className="py-1 pr-2">{U.colW}</th>
                <th className="py-1 pr-2">{U.colStokes}</th>
                <th className="py-1">{U.colTime}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {CLASSES.map((c) => {
                const d = grainSizeInfo[c.id].midMm / 1000;
                const w = fergusonChurch(d);
                return (
                  <tr key={c.id} className="border-t border-line">
                    <td className="py-1 pr-2">
                      <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border border-black/40" style={{ background: c.color }} />
                      {grainSizeInfo[c.id].name}
                    </td>
                    <td className="py-1 pr-2">{fmtAuto(d * 1000)} mm</td>
                    <td className="py-1 pr-2">{fmtVel(w)}</td>
                    <td className="py-1 pr-2 text-muted">{fmtVel(stokesVelocity(d))}</td>
                    <td className="py-1">{fmtDuration(HEIGHT_M / w)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">{U.stokesNote}</p>
        </div>
      </section>
    </div>
  );
}
