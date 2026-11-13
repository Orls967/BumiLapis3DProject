import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLog } from 'd3-scale';
import { line } from 'd3-shape';
import { ui } from '@/content/ui';
import { fmtAuto } from '@/lib/format';
import { HJULSTROM_RANGE, classify, depositionCurve, depositionVelocity, erosionCurve, erosionVelocity, type CurvePoint, type FlowClass } from '@/lib/sedsim/hjulstrom';
import { mulberry32 } from '@/lib/sedsim/settling';
import { useTheme } from '@/store/theme';
import { prefersReducedMotion, useCanvas2D } from '@/ui/hooks';
import { SliderField } from '@/ui/SliderField';

const F = ui.sed.flume;
const COLORS: Record<FlowClass, string> = { erosi: '#ef4444', transportasi: '#f59e0b', pengendapan: '#3b82f6' };
const GRAIN_PRESETS = [
  { label: 'Lempung', value: Math.log10(0.002) },
  { label: 'Lanau', value: Math.log10(0.02) },
  { label: 'Pasir halus', value: Math.log10(0.2) },
  { label: 'Pasir kasar', value: Math.log10(0.8) },
  { label: 'Kerikil', value: Math.log10(16) },
];
const N = 90;

function Diagram({ dMm, vCmS, onPick }: { dMm: number; vCmS: number; onPick: (dMm: number, vCmS: number) => void }) {
  const W = 420;
  const H = 300;
  const m = { l: 46, r: 10, t: 10, b: 36 };
  const x = useMemo(() => scaleLog(HJULSTROM_RANGE.dMm, [m.l, W - m.r]), [m.l, m.r]);
  const y = useMemo(() => scaleLog(HJULSTROM_RANGE.vCmS, [H - m.b, m.t]), [m.b, m.t]);
  const path = line<CurvePoint>().x((d) => x(d[0])).y((d) => y(Math.min(HJULSTROM_RANGE.vCmS[1], Math.max(HJULSTROM_RANGE.vCmS[0], d[1]))));
  const ero = path(erosionCurve) ?? '';
  const dep = path(depositionCurve) ?? '';
  const ticksX = [0.001, 0.01, 0.1, 1, 10, 100];
  const ticksY = [0.1, 1, 10, 100, 1000];
  const cls = classify(dMm, vCmS);
  const ref = useRef<SVGSVGElement>(null);
  const pick = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    const clamp = (v: number, [a, b]: readonly [number, number]) => Math.min(b, Math.max(a, v));
    onPick(clamp(x.invert(px), HJULSTROM_RANGE.dMm), clamp(y.invert(py), HJULSTROM_RANGE.vCmS));
  };
  const axis = 'fill-[var(--muted)] text-[10px]';
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full cursor-crosshair touch-none select-none"
      role="img"
      aria-label={`${F.diagram}: ${F.verdict[cls]}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e);
      }}
      onPointerMove={(e) => e.buttons > 0 && pick(e)}
    >
      <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} fill={COLORS.transportasi} opacity={0.2} />
      <path d={`${ero} L${W - m.r},${m.t} L${m.l},${m.t} Z`} fill={COLORS.erosi} opacity={0.3} />
      <path d={`${dep} L${W - m.r},${H - m.b} L${x(depositionCurve[0][0])},${H - m.b} Z`} fill={COLORS.pengendapan} opacity={0.34} />
      {ticksX.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} stroke="var(--line)" strokeWidth={0.6} />
          <text x={x(t)} y={H - m.b + 13} textAnchor="middle" className={axis}>{fmtAuto(t)}</text>
        </g>
      ))}
      {ticksY.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={0.6} />
          <text x={m.l - 5} y={y(t) + 3} textAnchor="end" className={axis}>{fmtAuto(t)}</text>
        </g>
      ))}
      {[0.0039, 0.0625, 2].map((t) => (
        <line key={t} x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} stroke="var(--muted)" strokeDasharray="2 4" strokeWidth={0.8} />
      ))}
      <text x={(x(0.001) + x(0.0039)) / 2} y={H - m.b - 5} textAnchor="middle" className={axis}>lempung</text>
      <text x={(x(0.0039) + x(0.0625)) / 2} y={H - m.b - 5} textAnchor="middle" className={axis}>lanau</text>
      <text x={(x(0.0625) + x(2)) / 2} y={H - m.b - 5} textAnchor="middle" className={axis}>pasir</text>
      <text x={(x(2) + x(100)) / 2} y={H - m.b - 5} textAnchor="middle" className={axis}>kerikil–kerakal</text>
      <path d={ero} fill="none" stroke={COLORS.erosi} strokeWidth={2.4} />
      <path d={dep} fill="none" stroke={COLORS.pengendapan} strokeWidth={2.4} />
      <text x={x(0.3)} y={y(350)} textAnchor="middle" className="fill-[var(--ink)] text-[12px] font-extrabold">{F.regions.erosi}</text>
      <text x={x(0.006)} y={y(4)} textAnchor="middle" className="fill-[var(--ink)] text-[12px] font-extrabold">{F.regions.transportasi}</text>
      <text x={x(12)} y={y(0.6)} textAnchor="middle" className="fill-[var(--ink)] text-[12px] font-extrabold">{F.regions.pengendapan}</text>
      <line x1={x(dMm)} x2={x(dMm)} y1={m.t} y2={H - m.b} stroke="var(--ink)" strokeWidth={0.8} strokeDasharray="3 3" />
      <line x1={m.l} x2={W - m.r} y1={y(vCmS)} y2={y(vCmS)} stroke="var(--ink)" strokeWidth={0.8} strokeDasharray="3 3" />
      <circle cx={x(dMm)} cy={y(vCmS)} r={8} fill={COLORS[cls]} stroke="var(--ink)" strokeWidth={2} />
      <text x={(m.l + W - m.r) / 2} y={H - 4} textAnchor="middle" className={axis}>{F.xAxis}</text>
      <text transform={`translate(11 ${(m.t + H - m.b) / 2}) rotate(-90)`} textAnchor="middle" className={axis}>{F.yAxis}</text>
    </svg>
  );
}

type P = { x: number; y: number; vy: number; bed: boolean; slot: number; ph: number };

export default function FlumeSim() {
  const dark = useTheme((s) => s.dark);
  const [logD, setLogD] = useState(Math.log10(0.2));
  const [logV, setLogV] = useState(Math.log10(30));
  const dMm = 10 ** logD;
  const vCmS = 10 ** logV;
  const cls = classify(dMm, vCmS);
  const live = useRef({ cls, vCmS, dMm });
  live.current = { cls, vCmS, dMm };
  const parts = useRef<P[]>([]);
  if (parts.current.length === 0) {
    const rnd = mulberry32(5);
    parts.current = Array.from({ length: N }, (_, i) => ({ x: rnd(), y: 0, vy: 0, bed: true, slot: i, ph: rnd() * 6.28 }));
  }
  const tRef = useRef(0);

  const [canvasRef, redraw] = useCanvas2D((ctx, W, H) => {
    const { cls: c, vCmS: v, dMm: d } = live.current;
    const bedY = H - 34;
    const r = Math.min(9, Math.max(1.6, 4 + 1.5 * Math.log10(d)));
    const g = ctx.createLinearGradient(0, 0, 0, bedY);
    g.addColorStop(0, dark ? '#1e3a66' : '#d4e9ff');
    g.addColorStop(1, dark ? '#102646' : '#a4cdf6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, bedY);
    ctx.fillStyle = dark ? '#57534e' : '#a8a29e';
    ctx.fillRect(0, bedY, W, H - bedY);
    // immobile substrate grains so that the bed reads as sediment
    ctx.fillStyle = dark ? '#78716c' : '#d6d3d1';
    for (let row = 0; row < 3; row++)
      for (let xx = (row % 2) * r; xx < W + r; xx += r * 2.1) {
        ctx.beginPath();
        ctx.arc(xx, bedY + r + row * r * 1.8, r, 0, Math.PI * 2);
        ctx.fill();
      }
    // flow streaks: longer and faster with velocity
    const k = Math.max(0, (Math.log10(v) + 1) / 4);
    ctx.strokeStyle = dark ? 'rgba(191,219,254,0.5)' : 'rgba(30,64,175,0.35)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 16; i++) {
      const yy = 30 + ((i * 53) % Math.max(20, bedY - 50));
      const len = 8 + 60 * k;
      const xx = ((i * 97 + tRef.current * (20 + 420 * k)) % (W + len)) - len;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + len, yy);
      ctx.stroke();
    }
    // arrow
    ctx.fillStyle = dark ? '#bfdbfe' : '#1e3a8a';
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`→ ${fmtAuto(v)} cm/dtk`, 8, 6);
    const color = dark ? '#fde68a' : '#b45309';
    for (const p of parts.current) {
      const px = p.x * W;
      const py = p.bed ? bedY - r - (p.slot % 3) * r * 1.5 : bedY - r - p.y * (bedY - 30);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = p.bed ? (dark ? '#d6d3d1' : '#78716c') : color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    ctx.fillStyle = COLORS[c];
    ctx.textAlign = 'right';
    ctx.fillText(F.regions[c], W - 8, 6);
    ctx.textAlign = 'left';
  });

  useEffect(() => {
    redraw();
    if (prefersReducedMotion()) {
      // static picture: place grains where the regime would leave them
      const c = live.current.cls;
      parts.current.forEach((p, i) => {
        p.bed = c === 'pengendapan' || (c === 'transportasi' && i % 2 === 0);
        p.y = 0.15 + ((i * 37) % 60) / 100;
      });
      redraw();
      return;
    }
    let raf = 0;
    let last = performance.now();
    const rnd = mulberry32(9);
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tRef.current += dt;
      const { cls: c, vCmS: v } = live.current;
      const k = Math.max(0.05, (Math.log10(v) + 1) / 4);
      for (const p of parts.current) {
        if (p.bed) {
          if (c === 'erosi' && rnd() < dt * 1.6) {
            p.bed = false;
            p.y = 0.02;
            p.vy = 0.5 + rnd() * 0.6;
          }
          continue;
        }
        p.x = (p.x + dt * (0.08 + 0.75 * k)) % 1;
        if (c === 'pengendapan') {
          p.vy = -0.45;
        } else {
          // suspended grains bob around a mean height
          const target = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(p.ph + tRef.current * 1.3));
          p.vy += (target - p.y) * dt * 4;
          p.vy *= 0.96;
        }
        p.y += p.vy * dt;
        if (p.y <= 0) {
          p.y = 0;
          if (c === 'pengendapan') p.bed = true;
          else p.vy = Math.abs(p.vy) * 0.5 + 0.1;
        }
        if (p.y > 0.95) p.y = 0.95;
      }
      redraw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [redraw, cls, dark]);

  const depV = depositionVelocity(dMm);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="grid content-start gap-3">
        <div className="card overflow-hidden">
          <canvas ref={canvasRef} className="block h-52 w-full" role="img" aria-label={F.canvasLabel} />
        </div>
        <div className="card grid gap-3 p-3">
          <SliderField label={F.velocity} value={logV} min={-1} max={3} step={0.02} unit="cm/dtk" format={(v) => fmtAuto(10 ** v)} presets={[1, 10, 100, 500].map((v) => ({ label: `${v}`, value: Math.log10(v) }))} onChange={setLogV} />
          <SliderField label={F.grain} value={logD} min={-3} max={2} step={0.02} unit="mm" format={(v) => fmtAuto(10 ** v)} presets={GRAIN_PRESETS} onChange={setLogD} />
        </div>
        <div className="card border-l-4 p-3" style={{ borderLeftColor: COLORS[cls] }} aria-live="polite">
          <h2 className="label mb-1">{F.result}</h2>
          <p className="text-sm font-semibold">{F.verdict[cls]}</p>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {F.erosionAt} ≈ {fmtAuto(erosionVelocity(dMm))} cm/dtk · {depV > 0 ? `${F.depositionAt} ≈ ${fmtAuto(depV)} cm/dtk` : F.never}
          </p>
        </div>
      </section>
      <section className="grid content-start gap-2">
        <div className="card p-3">
          <h2 className="label mb-1">{F.diagram}</h2>
          <Diagram dMm={dMm} vCmS={vCmS} onPick={(d, v) => (setLogD(Math.log10(d)), setLogV(Math.log10(v)))} />
          <p className="text-xs text-muted">{F.diagramHint}</p>
        </div>
        <p className="text-sm">{F.insight}</p>
        <p className="rounded-lg border border-line bg-panel2 p-2 text-xs text-muted">
          <span className="chip chip-warn mr-1.5">{ui.common.needsVerification}</span>
          {F.empirical}
        </p>
      </section>
    </div>
  );
}
