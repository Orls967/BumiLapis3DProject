import { useRef } from 'react';

type Props = { label: string; tabs: readonly { id: string; label: string }[]; active: string; onChange: (id: string) => void };

/** Page-level tab buttons with roving focus (←/→, Home/End). */
export function PageTabs({ label, tabs, active, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (i: number) => {
    const n = (i + tabs.length) % tabs.length;
    onChange(tabs[n].id);
    refs.current[n]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="mt-3 flex flex-wrap gap-1.5">
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => void (refs.current[i] = el)}
          role="tab"
          aria-selected={t.id === active}
          tabIndex={t.id === active ? 0 : -1}
          className={`btn ${t.id === active ? 'btn-primary' : ''}`}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(i + 1);
            else if (e.key === 'ArrowLeft') go(i - 1);
            else if (e.key === 'Home') go(0);
            else if (e.key === 'End') go(tabs.length - 1);
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
