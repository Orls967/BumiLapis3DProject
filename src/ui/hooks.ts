import { useEffect, useRef, useState, type RefObject } from 'react';

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

export const useIsMobile = () => useMediaQuery('(max-width: 899px)');

export function useEscape(handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const on = (e: KeyboardEvent) => e.key === 'Escape' && handler();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [handler, active]);
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export const prefersReducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Read theme colours (CSS custom properties) for canvas drawing. */
export function themeColors(el: Element = document.documentElement) {
  const cs = getComputedStyle(el);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return { bg: v('--bg', '#0a0e1a'), panel: v('--panel', '#121829'), panel2: v('--panel-2', '#1a2236'), line: v('--line', '#2b3550'), ink: v('--ink', '#eef2ff'), muted: v('--muted', '#a3aec8'), accent: v('--accent', '#fbbf24') };
}

/**
 * Canvas that follows its CSS size and device pixel ratio. `draw` is called with CSS-pixel
 * coordinates whenever the size changes or `redraw()` (the returned function) is invoked.
 */
export function useCanvas2D(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): [RefObject<HTMLCanvasElement | null>, () => void] {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const redraw = useRef(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (w === 0 || h === 0) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawRef.current(ctx, w, h);
  }).current;
  useEffect(() => {
    const c = ref.current;
    if (!c || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(redraw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [redraw]);
  return [ref, redraw];
}
