import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { environmentById, environments } from '@/content/environments';
import { formations } from '@/content/formations';
import type { Environment, StratColumn } from '@/content/schema';
import { ui } from '@/content/ui';
import { StratColumnView } from '@/ui/StratColumnView';
import { RuleList, settingColor } from './shared';

const T = ui.interp;
const K = T.catalog;

/** Schematic land → sea profile; x in 0–100, y is height above the baseline. */
const PROFILE: [number, number][] = [
  [0, 62],
  [6, 56],
  [12, 40],
  [22, 33],
  [36, 31],
  [47, 30],
  [56, 26],
  [72, 22],
  [80, 8],
  [88, 3],
  [100, 2],
];
const SEA_LEVEL = 30;
const POSITION: Record<string, number> = {
  glacial: 4,
  'alluvial-fan': 11,
  desert: 17,
  'braided-river': 22,
  lake: 28,
  'meandering-river': 35,
  delta: 45,
  'tidal-flat': 47.5,
  lagoon: 50,
  shoreface: 53,
  'carbonate-platform': 61,
  shelf: 68,
  'submarine-fan': 86,
  pelagic: 96,
};
function heightAt(x: number): number {
  for (let i = 1; i < PROFILE.length; i++) {
    if (x <= PROFILE[i][0]) {
      const [x0, y0] = PROFILE[i - 1];
      const [x1, y1] = PROFILE[i];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return PROFILE[PROFILE.length - 1][1];
}

function Locator({ env }: { env: Environment }) {
  const W = 260;
  const H = 86;
  const X = (x: number) => (x / 100) * W;
  const Y = (h: number) => H - 6 - h;
  const px = POSITION[env.id] ?? 50;
  const ground = PROFILE.map(([x, h]) => `${X(x)},${Y(h)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${K.position}: ${env.name}`}>
      <rect x={X(47)} y={Y(SEA_LEVEL)} width={W - X(47)} height={H - Y(SEA_LEVEL)} fill="#3b82f6" opacity={0.35} />
      <polygon points={`0,${H} ${ground} ${W},${H}`} fill="var(--muted)" opacity={0.55} />
      <polyline points={ground} fill="none" stroke="var(--ink)" strokeWidth={1.2} />
      <line x1={X(47)} x2={W} y1={Y(SEA_LEVEL)} y2={Y(SEA_LEVEL)} stroke="#3b82f6" strokeWidth={1} />
      <text x={3} y={10} className="fill-[var(--muted)] text-[9px]">{K.land}</text>
      <text x={W - 3} y={10} textAnchor="end" className="fill-[var(--muted)] text-[9px]">{K.sea}</text>
      <line x1={X(px)} x2={X(px)} y1={Y(heightAt(px)) - 20} y2={Y(heightAt(px)) - 2} stroke={settingColor[env.setting]} strokeWidth={2.5} />
      <circle cx={X(px)} cy={Y(heightAt(px)) - 24} r={6} fill={settingColor[env.setting]} stroke="var(--panel)" strokeWidth={1.5} />
    </svg>
  );
}

const miniColumn = (env: Environment): StratColumn => ({ id: `mini-${env.id}`, title: env.name, kind: 'example', beds: env.typicalSuccession, sources: [], verified: false });

function EnvCard({ env, focused }: { env: Environment; focused: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [focused]);
  const examples = formations.filter((f) => f.environmentIds.includes(env.id));
  const total = env.typicalSuccession[env.typicalSuccession.length - 1].baseM;
  return (
    <article ref={ref} id={`lingkungan-${env.id}`} className={`card scroll-mt-20 p-3 ${focused ? 'ring-2 ring-accent' : ''}`} style={{ borderTop: `4px solid ${settingColor[env.setting]}` }}>
      <header className="flex flex-wrap items-baseline gap-2">
        <h3 className="min-w-0 flex-1 text-lg font-extrabold">
          {env.name} <span className="text-xs font-normal text-muted">({env.nameEn})</span>
        </h3>
        <span className="chip">{T.result.settings[env.setting]}</span>
      </header>
      <p className="mt-1 text-sm">{env.description}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
        <div className="min-w-0">
          <h4 className="label mb-1">{K.diagnostics}</h4>
          <ul className="list-disc pl-5 text-sm">
            {env.diagnostics.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <h4 className="label mb-1 mt-3">{K.position}</h4>
          <Locator env={env} />
        </div>
        <figure>
          <figcaption className="label mb-1">{K.succession}</figcaption>
          <div className="overflow-hidden rounded-lg border border-line">
            <StratColumnView column={miniColumn(env)} pxPerM={200 / total} compact lithWidth={96} />
          </div>
        </figure>
      </div>
      <p className="mt-2 text-sm">
        <b>{K.neighbours}:</b>{' '}
        {env.adjacent.map((a, i) => (
          <span key={a}>
            {i > 0 && ', '}
            <Link className="text-accent underline" to={`/interpretasi?lingkungan=${a}`}>
              {environmentById.get(a)!.name}
            </Link>
          </span>
        ))}
      </p>
      <p className="mt-1 text-sm">
        <b>{K.examples}:</b>{' '}
        {examples.length
          ? examples.map((f, i) => (
              <span key={f.id}>
                {i > 0 && ', '}
                <Link className="text-accent underline" to={`/formasi/${f.id}`}>
                  {f.name}
                </Link>
              </span>
            ))
          : K.noExamples}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-semibold text-accent">
          {K.rules} ({env.rules.length})
        </summary>
        <div className="mt-1">
          <RuleList rules={env.rules} />
        </div>
      </details>
    </article>
  );
}

export default function EnvCatalog() {
  const [params] = useSearchParams();
  const focus = params.get('lingkungan');
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {environments.map((e) => (
        <EnvCard key={e.id} env={e} focused={e.id === focus} />
      ))}
    </div>
  );
}
