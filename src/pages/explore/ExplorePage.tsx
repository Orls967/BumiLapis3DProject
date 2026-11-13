import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { discontinuities, layerById, layers } from '@/content/layers';
import { ui } from '@/content/ui';
import { useEarth } from '@/store/earth';
import { overlayEls } from '@/scene/earth/live';
import { hasWebGL, useEscape, useIsMobile } from '@/ui/hooks';
import { CrossSection2D } from '@/ui/CrossSection2D';
import { Sheet } from '@/ui/Sheet';
import { ActionBar } from './ActionBar';
import { InfoPanel } from './InfoPanel';
import { LayerList } from './LayerList';
import { Onboarding } from './Onboarding';
import { useUrlSync } from './useUrlSync';

const EarthScene = lazy(() => import('@/scene/earth/EarthScene'));

const labelIds = [
  ...layers.filter((l) => (l.realm === 'interior' && !l.variantOf) || l.realm === 'atmosphere' || l.id === 'ocean').map((l) => l.id),
];

function Labels() {
  const select = useEarth((s) => s.select);
  const selectedId = useEarth((s) => s.selectedId);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {labelIds.map((id) => (
        <button
          key={id}
          tabIndex={-1}
          ref={(el) => {
            if (el) overlayEls.labels.set(id, el);
            else overlayEls.labels.delete(id);
          }}
          onClick={() => select(id)}
          className="label3d absolute left-0 top-0 cursor-pointer"
          style={{
            opacity: 0,
            transform: 'translate(-999px,-999px)',
            borderColor: selectedId === id ? 'var(--accent)' : undefined,
            color: selectedId === id ? '#fde68a' : undefined,
          }}
        >
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: layerById.get(id)!.color }} />
          {id === 'ocean' ? 'Lautan' : layerById.get(id)!.name}
        </button>
      ))}
      {discontinuities.map((d) => (
        <div
          key={d.id}
          ref={(el) => {
            if (el) overlayEls.labels.set(`disc:${d.id}`, el);
            else overlayEls.labels.delete(`disc:${d.id}`);
          }}
          className="label3d absolute left-0 top-0 !border-dashed !text-[11px] !font-semibold italic"
          style={{ opacity: 0, transform: 'translate(-999px,-999px)' }}
          title={`${ui.explore.discontinuity}: ${d.meaning}`}
        >
          {d.name}
        </div>
      ))}
    </div>
  );
}

function HoverTip() {
  const hoveredId = useEarth((s) => s.hoveredId);
  const layer = hoveredId ? layerById.get(hoveredId) : null;
  return (
    <div
      ref={(el) => void (overlayEls.tooltip = el)}
      className="pointer-events-none absolute left-0 top-0 z-20 rounded-lg border border-white/20 bg-black/80 px-2.5 py-1.5 text-xs text-white shadow-lg"
      style={{ opacity: layer ? 1 : 0, transition: 'opacity .15s' }}
      aria-hidden
    >
      <div className="text-sm font-bold">{layer?.name}</div>
      <div className="opacity-75">{ui.explore.hoverHint}</div>
    </div>
  );
}

export default function ExplorePage() {
  useUrlSync();
  const mobile = useIsMobile();
  const webgl = useMemo(hasWebGL, []);
  const selectedId = useEarth((s) => s.selectedId);
  const scaleMode = useEarth((s) => s.scaleMode);
  const setScaleMode = useEarth((s) => s.setScaleMode);
  const select = useEarth((s) => s.select);
  const selected = selectedId ? (layerById.get(selectedId) ?? null) : null;
  const [listOpen, setListOpen] = useState(false);
  const [help, setHelp] = useState(() => {
    try {
      return !localStorage.getItem('bl-onboarded');
    } catch {
      return false;
    }
  });
  const closeHelp = useCallback(() => {
    setHelp(false);
    try {
      localStorage.setItem('bl-onboarded', '1');
    } catch {
      /* ignore */
    }
  }, []);
  useEscape(
    useCallback(() => {
      if (listOpen) setListOpen(false);
      else select(null);
    }, [listOpen, select]),
    !help,
  );
  useEffect(() => {
    if (mobile && selectedId) setListOpen(false);
  }, [mobile, selectedId]);

  const B = ui.explore.scaleBadge;
  const sheetOpen = mobile && !!selected;

  return (
    <div className="relative h-full overflow-hidden bg-[#03050c] text-ink">
      <div className="absolute inset-x-0 top-0" style={{ bottom: sheetOpen ? '46dvh' : 0 }}>
        {webgl ? (
          <Suspense fallback={<div className="grid h-full place-items-center text-slate-400">{ui.common.loading}</div>}>
            <EarthScene />
          </Suspense>
        ) : (
          <div className="flex h-full flex-col items-center gap-2 p-3">
            <p className="glass max-w-xl p-3 text-sm">{ui.explore.noWebgl}</p>
            <CrossSection2D className="min-h-0 w-full flex-1" />
          </div>
        )}
        {webgl && <Labels />}
        {webgl && <HoverTip />}
        <p className="sr-only" role="status" aria-live="polite">
          {selected ? `${selected.name}. ${selected.summary}` : ui.explore.sceneLabel}
        </p>

        <button
          className={`glass absolute top-2 z-10 flex min-h-9 items-center gap-2 !rounded-full px-3 text-xs font-bold ${mobile ? "right-2" : "left-1/2 -translate-x-1/2"}`}
          onClick={() => setScaleMode(scaleMode === 'true' ? 'exaggerated' : 'true')}
          title={scaleMode === 'true' ? B.trueHint : B.exaggeratedHint}
        >
          <span aria-hidden className={`h-2 w-2 rounded-full ${scaleMode === 'true' ? 'bg-ok' : 'bg-warn'}`} />
          {scaleMode === 'true' ? B.true : B.exaggerated}
        </button>

        {mobile ? (
          <button className="btn btn-sm glass absolute left-2 top-2 z-10" onClick={() => setListOpen(true)} aria-expanded={listOpen}>
            <span aria-hidden>☰</span> {ui.explore.actions.layers}
          </button>
        ) : (
          <aside className="glass absolute bottom-24 left-3 top-3 z-10 flex w-60 flex-col">
            <LayerList />
          </aside>
        )}

        <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center px-2">
          <ActionBar onHelp={() => setHelp(true)} onTour={() => undefined} onJourney={() => undefined} journeyOn={false} compact={sheetOpen} />
        </div>
      </div>

      {mobile && listOpen && (
        <div className="absolute inset-0 z-40 bg-black/50" onClick={() => setListOpen(false)}>
          <aside className="glass absolute bottom-2 left-2 top-2 flex w-72 max-w-[85vw] flex-col" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-sm absolute right-2 top-2" onClick={() => setListOpen(false)} aria-label={ui.common.close}>
              ✕
            </button>
            <LayerList />
          </aside>
        </div>
      )}

      {selected &&
        (mobile ? (
          <Sheet label={selected.name}>
            <InfoPanel layer={selected} />
          </Sheet>
        ) : (
          <aside aria-label={selected.name} className="glass absolute bottom-24 right-3 top-3 z-20 flex w-[380px] flex-col">
            <InfoPanel layer={selected} />
          </aside>
        ))}

      {help && <Onboarding onClose={closeHelp} />}
    </div>
  );
}
