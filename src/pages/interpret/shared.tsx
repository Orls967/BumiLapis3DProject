import { Link } from 'react-router-dom';
import { grainGroupNames, type GrainGroup } from '@/content/environments';
import { lithologyById } from '@/content/lithologies';
import type { ObservationFeature, Rule } from '@/content/schema';
import { ui } from '@/content/ui';
import { roundings, sortings, trends, vocabName } from '@/content/vocab';
import { fmt } from '@/lib/format';
import type { Candidate } from '@/lib/interpret/engine';

const T = ui.interp;
const simple = new Map([...sortings, ...roundings, ...trends].map((v) => [v.id, v.name]));

/** Human-readable name of a rule value. */
export function valueName(feature: ObservationFeature, value: string): string {
  switch (feature) {
    case 'lithology':
      return lithologyById.get(value)?.name ?? value;
    case 'grainSize':
      return grainGroupNames[value as GrainGroup] ?? value;
    case 'structures':
      return vocabName('structures', value);
    case 'fossils':
      return vocabName('fossils', value);
    case 'color':
      return vocabName('colors', value);
    case 'geometry':
      return vocabName('geometries', value);
    case 'special':
      return vocabName('specials', value);
    default:
      return simple.get(value) ?? value;
  }
}

export const settingColor: Record<string, string> = { continental: '#d97706', transitional: '#16a34a', marine: '#2563eb' };

export function RuleList({ rules }: { rules: Rule[] }) {
  return (
    <ul className="grid gap-1">
      {rules.map((r, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className={`w-7 shrink-0 text-right font-bold tabular-nums ${r.weight > 0 ? 'text-ok' : 'text-bad'}`}>{r.weight > 0 ? `+${r.weight}` : `−${-r.weight}`}</span>
          <span className="min-w-0">
            <b>
              {T.form.features[r.feature]}: {valueName(r.feature, r.value)}
            </b>
            {r.diagnostic && <span className="chip ml-1.5 !py-0 text-[10px]">{T.result.diagnostic}</span>}
            <span className="text-muted"> — {r.note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${T.result.score} ${fmt(score * 100)}%`}>
      <div className="h-2.5 min-w-16 flex-1 overflow-hidden rounded-full bg-panel2">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${score * 100}%`, background: color }} />
      </div>
      <span className="w-11 text-right text-sm font-bold tabular-nums">{fmt(score * 100)}%</span>
    </div>
  );
}

export function CandidateCard({ c, place }: { c: Candidate; place: number }) {
  const R = T.result;
  return (
    <article className={`card p-3 ${place === 1 ? 'ring-2 ring-accent' : ''}`}>
      <header className="flex flex-wrap items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-sm font-extrabold text-accent-ink">{place}</span>
        <h3 className="min-w-0 flex-1 text-base font-extrabold">
          {c.env.name} <span className="text-xs font-normal text-muted">({c.env.nameEn})</span>
        </h3>
        <span className="chip" style={{ borderColor: settingColor[c.env.setting] }}>
          {R.settings[c.env.setting]}
        </span>
      </header>
      <div className="mt-2">
        <ScoreBar score={c.score} color={settingColor[c.env.setting]} />
        <p className="mt-0.5 text-xs text-muted tabular-nums">
          {c.raw} ÷ {c.maxPositive}
        </p>
      </div>
      <h4 className="label mb-1 mt-2">{R.supporting}</h4>
      {c.supporting.length ? <RuleList rules={c.supporting} /> : <p className="text-sm text-muted">{R.noSupporting}</p>}
      <h4 className="label mb-1 mt-2">{R.opposing}</h4>
      {c.opposing.length ? <RuleList rules={c.opposing} /> : <p className="text-sm text-muted">{R.noOpposing}</p>}
      <Link className="mt-2 inline-block text-sm font-semibold text-accent underline" to={`/interpretasi?lingkungan=${c.env.id}`}>
        {R.card} →
      </Link>
    </article>
  );
}
