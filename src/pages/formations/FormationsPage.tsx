import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { basinStory, formationById, formations } from '@/content/formations';
import { lithologyById } from '@/content/lithologies';
import type { Formation } from '@/content/schema';
import { chronoAt, series } from '@/content/timescale';
import { ui } from '@/content/ui';
import { environmentNames } from '@/content/vocab';
import { fmt } from '@/lib/format';
import { RichText } from '@/ui/RichText';
import { SourceList } from '@/ui/SourceList';

const F = ui.formations;

const thicknessText = (f: Formation) =>
  !f.thicknessM ? F.fields.unknown : f.thicknessM[0] === 0 ? `${F.fields.upTo} ${fmt(f.thicknessM[1])} m` : `${fmt(f.thicknessM[0])} – ${fmt(f.thicknessM[1])} m`;

/** Series (epochs) that a formation's age range touches. */
const seriesOf = (f: Formation) => (f.ageMa ? series.filter((s) => f.ageMa![0] > s.topMa && f.ageMa![1] < s.baseMa).map((s) => s.name) : ['Pra-Tersier']);

function Chips({ f }: { f: Formation }) {
  return (
    <div className="flex flex-wrap gap-1">
      {f.lithologies.slice(0, 4).map((l) => (
        <span key={l} className="chip">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: lithologyById.get(l)?.color }} />
          {lithologyById.get(l)?.name ?? l}
        </span>
      ))}
    </div>
  );
}

function Detail({ f }: { f: Formation }) {
  const rel = (id: string | undefined) => (id ? formationById.get(id) : null);
  const below = rel(f.overlies);
  const above = rel(f.underlies);
  const chrono = f.ageMa ? chronoAt(f.ageMa) : null;
  const rows: [string, React.ReactNode][] = [
    [F.fields.basin, f.basin],
    [
      F.fields.age,
      <span key="a" className="inline-flex items-center gap-2">
        {chrono?.series && <span className="h-3.5 w-3.5 rounded-sm border border-black/30" style={{ background: chrono.series.color }} />}
        {f.age}
        {f.ageMa && <span className="text-muted">(≈ {fmt(f.ageMa[0], 1)} – {fmt(f.ageMa[1], 1)} juta tahun)</span>}
      </span>,
    ],
    [F.fields.thickness, <span key="t">{thicknessText(f)} <span className="text-muted">· {F.variable}</span></span>],
    [F.fields.lithology, <Chips key="l" f={{ ...f, lithologies: f.lithologies }} />],
    [
      F.fields.environment,
      f.environmentIds.length ? (
        <span key="e" className="flex flex-wrap gap-1">
          {f.environmentIds.map((e) => (
            <Link key={e} to={`/interpretasi?lingkungan=${e}`} className="chip !text-accent underline">
              {environmentNames[e] ?? e}
            </Link>
          ))}
        </span>
      ) : (
        '—'
      ),
    ],
    [
      F.fields.relations,
      <ul key="r" className="grid gap-0.5">
        {above && (
          <li>
            {F.fields.underlies}:{' '}
            <Link className="font-semibold text-accent underline" to={`/formasi/${above.id}`}>
              {above.name}
            </Link>{' '}
            {above.contactBelow && <span className="text-muted">({above.contactBelow === 'conformable' ? F.fields.conformable : F.fields.unconformable})</span>}
          </li>
        )}
        {below && (
          <li>
            {F.fields.overlies}:{' '}
            <Link className="font-semibold text-accent underline" to={`/formasi/${below.id}`}>
              {below.name}
            </Link>{' '}
            {f.contactBelow && <span className="text-muted">({f.contactBelow === 'conformable' ? F.fields.conformable : F.fields.unconformable})</span>}
          </li>
        )}
      </ul>,
    ],
    [F.fields.economic, f.economic?.length ? <ul key="x" className="list-disc pl-5">{f.economic.map((e) => <li key={e}><RichText text={e} /></li>)}</ul> : '—'],
    ...(f.typeLocality ? ([[F.fields.typeLocality, f.typeLocality]] as [string, React.ReactNode][]) : []),
  ];
  return (
    <div className="page max-w-3xl pb-12">
      <Link to="/formasi" className="text-sm font-semibold text-accent underline">
        {F.back}
      </Link>
      <header className="mt-2 flex flex-wrap items-start gap-2">
        <h1 className="page-title min-w-0 flex-1">{f.name}</h1>
        {!f.verified && <span className="chip chip-warn">⚠ {ui.common.needsVerification}</span>}
      </header>
      <p className="mt-2 leading-relaxed">
        <RichText text={f.description} />
      </p>
      <Link to={`/kolom?kolom=${basinStory.columnId}&formasi=${f.id}`} className="btn btn-primary mt-3">
        <span aria-hidden>▤</span> {F.seeInColumn}
      </Link>
      <dl className="card mt-4 px-4">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[11rem_1fr]">
            <dt className="label pt-0.5">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <section className="card mt-4 p-4">
        <h2 className="mb-2 font-extrabold">{ui.common.sources}</h2>
        <SourceList sources={f.sources} verified={f.verified} />
      </section>
    </div>
  );
}

export default function FormationsPage() {
  const { id } = useParams();
  const [basin, setBasin] = useState('');
  const [age, setAge] = useState('');
  const [lith, setLith] = useState('');
  const [env, setEnv] = useState('');
  const opts = useMemo(
    () => ({
      basins: [...new Set(formations.map((f) => f.basin))],
      ages: [...new Set(formations.flatMap(seriesOf))],
      liths: [...new Set(formations.map((f) => f.lithologies[0]))],
      envs: [...new Set(formations.flatMap((f) => f.environmentIds))],
    }),
    [],
  );
  if (id) {
    const f = formationById.get(id);
    return f ? <Detail f={f} /> : <div className="page">{F.notFound}</div>;
  }
  const list = [...formations]
    .reverse()
    .filter((f) => (!basin || f.basin === basin) && (!age || seriesOf(f).includes(age)) && (!lith || f.lithologies[0] === lith) && (!env || f.environmentIds.includes(env)));
  const select = (label: string, value: string, set: (v: string) => void, options: [string, string][]) => (
    <label className="grid gap-1">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => set(e.target.value)}>
        <option value="">{F.filters.all}</option>
        {options.map(([v, n]) => (
          <option key={v} value={v}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="page pb-12">
      <h1 className="page-title">{F.title}</h1>
      <p className="text-sm text-muted">{F.intro}</p>
      <section className="card mt-3 p-4">
        <h2 className="font-extrabold">{basinStory.title}</h2>
        <p className="mt-1 text-sm leading-relaxed">
          <RichText text={basinStory.text} />
        </p>
      </section>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {select(F.filters.basin, basin, setBasin, opts.basins.map((b) => [b, b]))}
        {select(F.filters.age, age, setAge, opts.ages.map((a) => [a, a]))}
        {select(F.filters.lithology, lith, setLith, opts.liths.map((l) => [l, lithologyById.get(l)?.name ?? l]))}
        {select(F.filters.environment, env, setEnv, opts.envs.map((e) => [e, environmentNames[e] ?? e]))}
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {list.length} {F.count}
      </p>
      {list.length === 0 && <p className="mt-2">{F.empty}</p>}
      <ul className="mt-2 grid gap-3 md:grid-cols-2">
        {list.map((f) => {
          const c = f.ageMa ? chronoAt(f.ageMa).series : null;
          return (
            <li key={f.id} className="card flex flex-col gap-2 p-4" style={{ borderLeft: `6px solid ${c?.color ?? '#94a3b8'}` }}>
              <div className="flex items-start gap-2">
                <h2 className="min-w-0 flex-1 text-lg font-extrabold leading-tight">
                  <Link to={`/formasi/${f.id}`} className="hover:underline">
                    {f.name}
                  </Link>
                </h2>
                {!f.verified && <span className="chip chip-warn">⚠ {ui.common.needsVerification}</span>}
              </div>
              <p className="text-sm text-muted">
                {f.age} · {thicknessText(f)}
              </p>
              <Chips f={f} />
              <p className="text-sm">{f.environmentIds.map((e) => environmentNames[e] ?? e).join(' · ') || '—'}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Link to={`/formasi/${f.id}`} className="btn btn-sm">
                  Detail
                </Link>
                <Link to={`/kolom?kolom=${basinStory.columnId}&formasi=${f.id}`} className="btn btn-sm">
                  ▤ {F.seeInColumn}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
