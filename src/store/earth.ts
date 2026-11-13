import { create } from 'zustand';
import type { ScaleMode } from '@/lib/profile/scale';
import type { GroupingMode, ViewMode } from '@/lib/profile/shells';
import { layerById, layerList } from '@/content/layers';

export type OverlayKey = 'atmosphere' | 'plates' | 'magnetosphere' | 'ozone' | 'karman' | 'discontinuities' | 'markers';

export type EarthState = {
  selectedId: string | null;
  hoveredId: string | null;
  scaleMode: ScaleMode;
  grouping: GroupingMode;
  view: ViewMode;
  cutDeg: number;
  hidden: Record<string, boolean>;
  overlays: Record<OverlayKey, boolean>;
  /** Altitude (km) of the depth-journey marker, or null when the journey is off. */
  depthKm: number | null;
  /** Incremented to request a camera reset / fly. */
  cameraNonce: number;
  autoRotate: boolean;
  tourStep: number | null;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setScaleMode: (m: ScaleMode) => void;
  setGrouping: (g: GroupingMode) => void;
  setView: (v: ViewMode) => void;
  setCutDeg: (d: number) => void;
  toggleHidden: (id: string) => void;
  toggleOverlay: (k: OverlayKey) => void;
  setDepthKm: (km: number | null) => void;
  resetView: () => void;
  stopAutoRotate: () => void;
  setTourStep: (i: number | null) => void;
  step: (dir: 1 | -1) => void;
};

/** Map a layer id to its counterpart when the grouping mode changes. */
function remapSelection(id: string | null, grouping: GroupingMode): string | null {
  if (!id) return id;
  const layer = layerById.get(id);
  if (!layer || layer.realm !== 'interior' || layer.grouping === 'both' || layer.grouping === grouping) return id;
  const map: Record<string, string> = {
    'continental-crust': 'lithosphere',
    'oceanic-crust': 'lithosphere',
    'upper-mantle': 'asthenosphere',
    'lower-mantle': 'mesosphere-mantle',
    lithosphere: 'continental-crust',
    asthenosphere: 'upper-mantle',
    'mesosphere-mantle': 'lower-mantle',
  };
  return map[id] ?? null;
}

export const useEarth = create<EarthState>((set, get) => ({
  selectedId: null,
  hoveredId: null,
  scaleMode: 'exaggerated',
  grouping: 'compositional',
  view: 'closed',
  cutDeg: 90,
  hidden: {},
  overlays: {
    atmosphere: true,
    plates: false,
    magnetosphere: false,
    ozone: false,
    karman: false,
    discontinuities: true,
    markers: false,
  },
  depthKm: null,
  cameraNonce: 0,
  autoRotate: true,
  tourStep: null,
  select: (id) => {
    const s = get();
    if (id === s.selectedId) return;
    const patch: Partial<EarthState> = { selectedId: id, autoRotate: false };
    if (id) {
      const layer = layerById.get(id);
      // a closed globe hides everything but the surface: open it so the selection is visible
      if (layer && s.view === 'closed' && layer.id !== 'continental-crust' && layer.realm !== 'functional')
        patch.view = 'wedge';
      if (layer && s.hidden[id]) patch.hidden = { ...s.hidden, [id]: false };
      if (layer?.id === 'magnetosphere') patch.overlays = { ...s.overlays, magnetosphere: true };
      if (layer?.id === 'ozone-layer') patch.overlays = { ...s.overlays, ozone: true };
      if (layer?.realm === 'atmosphere') patch.overlays = { ...s.overlays, atmosphere: true };
    }
    set(patch);
  },
  hover: (id) => get().hoveredId !== id && set({ hoveredId: id }),
  setScaleMode: (scaleMode) => set({ scaleMode }),
  setGrouping: (grouping) => set((s) => ({ grouping, selectedId: remapSelection(s.selectedId, grouping) })),
  setView: (view) => set({ view, autoRotate: false }),
  setCutDeg: (cutDeg) => set({ cutDeg, view: cutDeg <= 0 ? 'closed' : 'wedge', autoRotate: false }),
  toggleHidden: (id) => set((s) => ({ hidden: { ...s.hidden, [id]: !s.hidden[id] } })),
  toggleOverlay: (k) => set((s) => ({ overlays: { ...s.overlays, [k]: !s.overlays[k] } })),
  setDepthKm: (depthKm) => set({ depthKm, autoRotate: false }),
  resetView: () =>
    set((s) => ({
      cameraNonce: s.cameraNonce + 1,
      view: 'closed',
      cutDeg: 90,
      selectedId: null,
      depthKm: null,
      hidden: {},
      autoRotate: true,
      tourStep: null,
    })),
  stopAutoRotate: () => get().autoRotate && set({ autoRotate: false }),
  setTourStep: (tourStep) => set({ tourStep }),
  step: (dir) => {
    const s = get();
    const list = layerList(s.grouping);
    const i = list.findIndex((l) => l.id === s.selectedId);
    const next = list[i < 0 ? 0 : Math.min(list.length - 1, Math.max(0, i + dir))];
    if (next) s.select(next.id);
  },
}));
