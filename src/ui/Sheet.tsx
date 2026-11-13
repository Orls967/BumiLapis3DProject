import { useRef, useState, type ReactNode } from 'react';
import { ui } from '@/content/ui';

type Snap = 'peek' | 'half' | 'full';
const HEIGHT: Record<Snap, string> = { peek: '132px', half: '46dvh', full: '86dvh' };
const ORDER: Snap[] = ['peek', 'half', 'full'];

/** Mobile bottom sheet with a draggable handle (peek / half / full). */
export function Sheet({ children, label }: { children: ReactNode; label: string }) {
  const [snap, setSnap] = useState<Snap>('half');
  const start = useRef<number | null>(null);
  const step = (dir: 1 | -1) => setSnap((s) => ORDER[Math.min(2, Math.max(0, ORDER.indexOf(s) + dir))]);
  return (
    <section
      aria-label={label}
      className="glass absolute inset-x-0 bottom-0 z-30 flex flex-col !rounded-b-none transition-[height] duration-300"
      style={{ height: HEIGHT[snap] }}
    >
      <button
        type="button"
        aria-label={ui.explore.panel.sheetHandle}
        className="flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center"
        onPointerDown={(e) => {
          start.current = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const dy = e.clientY - start.current;
          start.current = null;
          if (Math.abs(dy) < 8) setSnap((s) => (s === 'half' ? 'full' : 'half'));
          else step(dy < 0 ? 1 : -1);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') step(1);
          if (e.key === 'ArrowDown') step(-1);
        }}
      >
        <span className="h-1.5 w-12 rounded-full bg-line" />
      </button>
      {children}
    </section>
  );
}
