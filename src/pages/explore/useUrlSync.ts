import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { layerById } from '@/content/layers';
import { useEarth } from '@/store/earth';
import type { ViewMode } from '@/lib/profile/shells';

const VIEWS: ViewMode[] = ['closed', 'wedge', 'half', 'explode'];

/** Keeps the shareable part of the globe state in the query string (inside the hash route). */
export function useUrlSync() {
  const [params, setParams] = useSearchParams();
  const ready = useRef(false);

  useEffect(() => {
    const s = useEarth.getState();
    const patch: Partial<ReturnType<typeof useEarth.getState>> = {};
    const view = params.get('tampilan') as ViewMode | null;
    if (view && VIEWS.includes(view)) patch.view = view;
    const cut = Number(params.get('sudut'));
    if (cut > 0 && cut <= 180) patch.cutDeg = cut;
    if (params.get('skala') === 'sebenarnya') patch.scaleMode = 'true';
    if (params.get('kelompok') === 'mekanis') patch.grouping = 'mechanical';
    const depth = params.get('kedalaman');
    if (depth !== null && depth !== '' && Number.isFinite(Number(depth))) patch.depthKm = Number(depth);
    if (Object.keys(patch).length) useEarth.setState({ ...patch, autoRotate: false });
    const layer = params.get('lapisan');
    if (layer && layerById.has(layer)) s.select(layer);
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedId = useEarth((s) => s.selectedId);
  const view = useEarth((s) => s.view);
  const cutDeg = useEarth((s) => s.cutDeg);
  const scaleMode = useEarth((s) => s.scaleMode);
  const grouping = useEarth((s) => s.grouping);
  const depthKm = useEarth((s) => s.depthKm);

  useEffect(() => {
    if (!ready.current) return;
    const p = new URLSearchParams();
    if (selectedId) p.set('lapisan', selectedId);
    if (view !== 'closed') p.set('tampilan', view);
    if (view === 'wedge' && cutDeg !== 90) p.set('sudut', String(Math.round(cutDeg)));
    if (scaleMode === 'true') p.set('skala', 'sebenarnya');
    if (grouping === 'mechanical') p.set('kelompok', 'mekanis');
    if (depthKm !== null) p.set('kedalaman', String(Math.round(depthKm)));
    setParams(p, { replace: true });
  }, [selectedId, view, cutDeg, scaleMode, grouping, depthKm, setParams]);
}
