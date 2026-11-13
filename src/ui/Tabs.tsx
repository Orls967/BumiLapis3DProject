import { useId, useRef, type ReactNode } from 'react';

type Props = { tabs: string[]; active: number; onChange: (i: number) => void; children: ReactNode; label: string };

/** Accessible tab list (arrow keys move between tabs). */
export function Tabs({ tabs, active, onChange, children, label }: Props) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number) => {
    const n = (i + tabs.length) % tabs.length;
    onChange(n);
    refs.current[n]?.focus();
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label={label} className="scroll-thin flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 pb-2">
        {tabs.map((t, i) => (
          <button
            key={t}
            ref={(el) => void (refs.current[i] = el)}
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => onChange(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(i + 1);
              if (e.key === 'ArrowLeft') move(i - 1);
            }}
            className={`min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors ${
              i === active ? 'bg-accent text-accent-ink' : 'text-muted hover:bg-panel2 hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
        className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[0.92rem] leading-relaxed"
      >
        {children}
      </div>
    </div>
  );
}
