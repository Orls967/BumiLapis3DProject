import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { glossary } from '@/content/glossary';
import { ui } from '@/content/ui';
import { RichText } from '@/ui/RichText';

const G = ui.glossary;
const norm = (s: string) => s.toLowerCase();

export default function GlossaryPage() {
  const [params] = useSearchParams();
  const focus = params.get('istilah');
  const [q, setQ] = useState('');
  const sorted = useMemo(() => [...glossary].sort((a, b) => a.term.localeCompare(b.term, 'id')), []);
  const list = sorted.filter((g) => !q.trim() || norm(`${g.term} ${g.termEn ?? ''} ${(g.aliases ?? []).join(' ')} ${g.definition}`).includes(norm(q.trim())));
  useEffect(() => {
    if (!focus) return;
    setQ('');
    const t = setTimeout(() => document.getElementById(`istilah-${focus}`)?.scrollIntoView({ block: 'center' }), 50);
    return () => clearTimeout(t);
  }, [focus]);
  let letter = '';
  return (
    <div className="page max-w-3xl pb-12">
      <h1 className="page-title">{G.title}</h1>
      <p className="mt-1 text-muted">{G.intro}</p>
      <div className="sticky top-0 z-10 -mx-1 mt-3 flex items-center gap-3 bg-bg px-1 py-2">
        <input className="input" type="search" placeholder={G.search} aria-label={G.search} value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="chip shrink-0" aria-live="polite">
          {list.length} {G.count}
        </span>
      </div>
      {list.length === 0 && <p className="mt-4 text-muted">{G.empty}</p>}
      <dl className="mt-2 grid gap-2">
        {list.map((g) => {
          const first = g.term[0].toUpperCase();
          const head = first !== letter;
          letter = first;
          return (
            <div key={g.id}>
              {head && <div className="label mt-3 border-b border-line pb-1 !text-base !text-accent">{first}</div>}
              <div
                id={`istilah-${g.id}`}
                className={`card mt-2 p-3 ${focus === g.id ? '!border-accent ring-2 ring-accent' : ''}`}
              >
                <dt className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-base font-extrabold">{g.term}</span>
                  {g.termEn && (
                    <span lang="en" className="text-sm italic text-muted">
                      {g.termEn}
                    </span>
                  )}
                </dt>
                <dd className="mt-1 leading-relaxed">
                  <RichText text={g.definition} skipId={g.id} />
                  {g.link && (
                    <Link to={g.link} className="ml-2 whitespace-nowrap text-sm font-semibold text-accent underline">
                      {G.open} →
                    </Link>
                  )}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
