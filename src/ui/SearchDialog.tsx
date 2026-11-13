import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchIndex } from '@/content/searchIndex';
import { ui } from '@/content/ui';
import { search } from '@/lib/search';

const S = ui.search;

/** Global search (Ctrl/⌘+K) across layers, formations, glossary terms and environments. */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const items = useMemo(searchIndex, []);
  const results = useMemo(() => search(items, q), [items, q]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => setActive(0), [q]);
  const go = (i: number) => {
    const r = results[i];
    if (!r) return;
    navigate(r.to);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/55 p-3 pt-[10vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={S.button}
        className="glass mx-auto flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={input}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `search-r-${active}` : undefined}
          className="h-14 w-full shrink-0 border-b border-line bg-transparent px-4 text-base outline-none"
          placeholder={S.placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            }
            if (e.key === 'Enter') go(active);
          }}
        />
        <ul id="search-results" role="listbox" className="scroll-thin min-h-0 flex-1 overflow-y-auto p-1.5">
          {results.map((r, i) => (
            <li
              key={`${r.kind}-${r.to}`}
              id={`search-r-${i}`}
              role="option"
              aria-selected={i === active}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 ${i === active ? 'bg-accent text-accent-ink' : 'hover:bg-panel2'}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(i)}
            >
              <span className={`chip shrink-0 ${i === active ? '!border-black/30 !bg-black/15 !text-inherit' : ''}`}>{S.kinds[r.kind]}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{r.title}</span>
                <span className="block truncate text-xs opacity-75">{r.subtitle}</span>
              </span>
            </li>
          ))}
          {q.trim() && results.length === 0 && <li className="p-4 text-muted">{S.empty}</li>}
          {!q.trim() && <li className="p-4 text-sm text-muted">{S.hint}</li>}
        </ul>
      </div>
    </div>
  );
}
