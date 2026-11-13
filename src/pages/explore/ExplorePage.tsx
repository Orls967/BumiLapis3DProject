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
import { Journey, journeyLabel } from './Journey';
import { Tour } from './Tour';
import { QuizButton } from '@/ui/Quiz';
import { scaleMarkers } from '@/content/markers';
import { fmtAuto } from '@/lib/format';
import type { OverlayKey } from '@/store/earth';

const EarthScene = lazy(() => import('@/scene/earth/EarthScene'));

const labelIds = [
  ...layers.filter((l) => (l.realm === 'interior' && !l.variantOf) || l.realm === 'atmosphere' || ['ocean', 'ozone-layer', 'ionosphere'].includes(l.id)).map((l) => l.id),
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
      {scaleMarkers.map((m) => (
        <div
          key={m.id}
          ref={(el) => {
            if (el) overlayEls.labels.set(`mk:${m.id}`, el);
            else overlayEls.labels.delete(`mk:${m.id}`);
          }}
          className="label3d absolute left-0 top-0 !text-[11px]"
          style={{ opacity: 0, transform: 'translate(-999px,-999px)', marginLeft: 12 }}
          title={m.note}
        >
          {m.name} · {m.altKm > 0 ? '+' : '−'}
          {fmtAuto(Math.abs(m.altKm))} km{m.verified ? '' : ` (${ui.common.needsVerification})`}
        </div>
      ))}
      <div
        ref={(el) => {
          if (el) overlayEls.labels.set('ov:magnetosphere', el);
          else overlayEls.labels.delete('ov:magnetosphere');
        }}
        className="label3d absolute left-0 top-0 !border-cyan-300/60 !text-cyan-100"
        style={{ opacity: 0, transform: 'translate(-999px,-999px)' }}
      >
        {ui.explore.overlays.magnetosphereLabel}
      </div>
      <JourneyLabel />
    </div>
  );
}

function JourneyLabel() {
  const depthKm = useEarth((s) => s.depthKm);
  return (
    <div
      ref={(el) => {
        if (el) overlayEls.labels.set('journey', el);
        else overlayEls.labels.delete('journey');
      }}
      className="label3d absolute left-0 top-0 !border-amber-300 !bg-amber-300 !text-black"
      style={{ opacity: 0, transform: 'translate(-999px,-999px)', marginTop: -22 }}
    >
      {depthKm !== null ? journeyLabel(depthKm) : ''}
    </div>
  );
}

const OVERLAY_KEYS: OverlayKey[] = ['atmosphere', 'discontinuities', 'markers', 'karman', 'ozone', 'plates', 'magnetosphere'];

function OverlayMenu({ onClose }: { onClose: () => void }) {
  const overlays = useEarth((s) => s.overlays);
  const toggle = useEarth((s) => s.toggleOverlay);
  const view = useEarth((s) => s.view);
  const setView = useEarth((s) => s.setView);
  const O = ui.explore.overlays;
  return (
    <div className="glass absolute right-3 top-14 z-30 grid w-72 gap-1 p-2" role="group" aria-label={O.title}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-extrabold">{O.title}</h2>
        <button className="btn btn-sm" onClick={onClose} aria-label={ui.common.close}>
          ✕
        </button>
      </div>
      {OVERLAY_KEYS.map((k) => (
        <button
          key={k}
          role="switch"
          aria-checked={overlays[k]}
          className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-sm font-semibold hover:bg-panel2"
          onClick={() => {
            toggle(k);
            if (!overlays[k] && view === 'closed' && k !== 'plates' && k !== 'magnetosphere') setView('wedge');
          }}
        >
          <span aria-hidden className={`grid h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${overlays[k] ? 'bg-accent' : 'bg-line'}`}>
            <span className={`h-4 w-4 rounded-full bg-white transition-transform ${overlays[k] ? 'translate-x-4' : ''}`} />
          </span>
          {O[k]}
        </button>
      ))}
      <p className="px-1 text-[11px] leading-tight text-muted">
        {O.needsCut} {overlays.plates && O.platesCredit}
      </p>
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
  const [overlayOpen, setOverlayOpen] = useState(false);
  const depthKm = useEarth((s) => s.depthKm);
  const setDepthKm = useEarth((s) => s.setDepthKm);
  const tourStep = useEarth((s) => s.tourStep);
  const setTourStep = useEarth((s) => s.setTourStep);
  const touring = tourStep !== null;
  const journeyOn = depthKm !== null && !touring;
  const toggleJourney = useCallback(() => {
    const s = useEarth.getState();
    if (s.depthKm !== null) return setDepthKm(null);
    if (s.view === 'closed' || s.view === 'explode') s.setView('wedge');
    setDepthKm(0);
  }, [setDepthKm]);
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
  const sheetOpen = mobile && !touring && (!!selected || journeyOn);

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
        {!mobile && journeyOn && (
          <aside aria-label={ui.explore.journey.title} className="glass absolute bottom-24 left-[16.5rem] top-3 z-10 flex w-[21rem] flex-col">
            <Journey onClose={() => setDepthKm(null)} />
          </aside>
        )}
        <button
          className={`btn btn-sm glass absolute z-10 ${mobile ? 'right-2 top-14' : 'top-2'} `}
          style={mobile ? undefined : { right: selected ? 404 : 12 }}
          aria-expanded={overlayOpen}
          onClick={() => setOverlayOpen((v) => !v)}
        >
          <span aria-hidden>☷</span> {ui.explore.actions.overlays}
        </button>
        {overlayOpen && <OverlayMenu onClose={() => setOverlayOpen(false)} />}
        <div className={`absolute z-10 ${mobile ? 'left-2 top-14' : 'top-2'}`} style={mobile ? undefined : { right: selected ? 560 : 168 }}>
          <QuizButton module="earth" className="btn btn-sm glass" />
        </div>

        <div className="absolute inset-x-0 bottom-2 z-10 flex flex-col items-center gap-2 px-2">
          <Tour showDetails={mobile ? () => setTourStep(null) : undefined} />
          <ActionBar onHelp={() => setHelp(true)} onTour={() => setTourStep(touring ? null : 0)} onJourney={toggleJourney} journeyOn={journeyOn} compact={sheetOpen || touring} />
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

      {mobile && journeyOn && !selected && !touring && (
        <Sheet label={ui.explore.journey.title}>
          <Journey compact onClose={() => setDepthKm(null)} />
        </Sheet>
      )}
      {selected &&
        !(mobile && touring) &&
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
