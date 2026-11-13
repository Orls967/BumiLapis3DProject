import { useState } from 'react';
import { ui } from '@/content/ui';

const R = 100;
const RC = (R * 3480) / 6371;
const RI = (R * 1221) / 6371;
const rad = (d: number) => (d * Math.PI) / 180;
const surf = (deg: number, r = R): [number, number] => [Math.sin(rad(deg)) * r, -Math.cos(rad(deg)) * r];

/** Curved mantle ray from the focus (top) to the surface at angular distance `deg`. */
function mantleRay(deg: number): string {
  const [x, y] = surf(deg);
  const mx = (0 + x) / 2;
  const my = (-R + y) / 2;
  return `M0,${-R} Q${(mx * 0.77).toFixed(1)},${(my * 0.77).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
}
/** P ray refracted through the core, emerging at `deg`. */
function coreRay(deg: number): string {
  const sign = Math.sign(deg);
  const a = Math.abs(deg);
  const [ex, ey] = surf(sign * (8 + (180 - a) * 0.55), RC);
  const [xx, xy] = surf(sign * (a - 22), RC);
  const [sx, sy] = surf(deg);
  return `M0,${-R} Q${(ex * 0.75).toFixed(1)},${(ey - 14).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} L${xx.toFixed(1)},${xy.toFixed(1)} L${sx.toFixed(1)},${sy.toFixed(1)}`;
}
const arc = (from: number, to: number, r: number) => {
  const [x0, y0] = surf(from, r);
  const [x1, y1] = surf(to, r);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${to > from ? 1 : 0} ${x1.toFixed(1)},${y1.toFixed(1)}`;
};

const S = ui.shadow;
const MANTLE = [20, 40, 60, 80, 100, 104];
const CORE = [143, 152, 162, 172];

/** Schematic animation of the P- and S-wave shadow zones that reveal the liquid outer core. */
export function ShadowZones() {
  const [wave, setWave] = useState<'p' | 's'>('s');
  const color = wave === 'p' ? '#38bdf8' : '#f472b6';
  const rays = [...MANTLE.flatMap((d) => [mantleRay(d), mantleRay(-d)]), ...(wave === 'p' ? CORE.flatMap((d) => [coreRay(d), coreRay(-d)]) : [])];
  return (
    <figure className="m-0 mt-3 rounded-xl border border-line bg-panel2 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <figcaption className="text-sm font-bold">{S.title}</figcaption>
        <div className="flex gap-1" role="group" aria-label={S.title}>
          <button className="btn btn-sm" aria-pressed={wave === 'p'} onClick={() => setWave('p')}>
            {S.p}
          </button>
          <button className="btn btn-sm" aria-pressed={wave === 's'} onClick={() => setWave('s')}>
            {S.s}
          </button>
        </div>
      </div>
      <svg viewBox="-135 -122 270 258" className="mx-auto w-full max-w-xs" role="img" aria-label={`${S.title}: ${wave === 'p' ? S.pShadow : S.sShadow}`}>
        <style>{`.bl-ray{stroke-dasharray:5 7;animation:bl-ray 1.6s linear infinite}@keyframes bl-ray{to{stroke-dashoffset:-24}}`}</style>
        <circle r={R} fill="#b4532a" />
        <circle r={RC} fill="#f59e0b" />
        <circle r={RI} fill="#fde68a" />
        {wave === 'p' ? (
          <>
            <path d={arc(104, 140, R + 9)} stroke="#94a3b8" strokeWidth={9} fill="none" />
            <path d={arc(-104, -140, R + 9)} stroke="#94a3b8" strokeWidth={9} fill="none" />
          </>
        ) : (
          <path d={arc(104, 256, R + 9)} stroke="#94a3b8" strokeWidth={9} fill="none" />
        )}
        {rays.map((d, i) => (
          <path key={`${wave}-${i}`} d={d} className="bl-ray" stroke={color} strokeWidth={1.6} fill="none" />
        ))}
        <circle cx={0} cy={-R} r={4.5} fill="#fff" stroke="#111" />
        <text x={0} y={-R - 9} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--ink)">
          {S.focus}
        </text>
        <text x={0} y={R + 30} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--muted)">
          {wave === 'p' ? S.pShadow : S.sShadow}
        </text>
        <text x={surf(104, R + 22)[0]} y={surf(104, R + 22)[1]} textAnchor="middle" fontSize={8} fill="var(--muted)">
          104°
        </text>
        {wave === 'p' && (
          <text x={surf(140, R + 22)[0]} y={surf(140, R + 22)[1] + 4} textAnchor="middle" fontSize={8} fill="var(--muted)">
            140°
          </text>
        )}
      </svg>
      <p className="mt-1 text-xs leading-snug text-muted">{S.note}</p>
    </figure>
  );
}
