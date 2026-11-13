import { useEffect } from 'react';
import { tour } from '@/content/tour';
import { ui } from '@/content/ui';
import { useEarth } from '@/store/earth';

const T = ui.tour;

/** Applies the state of a tour step to the globe. */
function applyStep(i: number) {
  const step = tour[i];
  const s = useEarth.getState();
  useEarth.setState({
    view: s.view === 'closed' || s.view === 'explode' ? 'wedge' : s.view,
    overlays: { ...s.overlays, ...step.overlays },
    depthKm: step.depthKm,
    autoRotate: false,
    hidden: {},
  });
  useEarth.getState().select(step.layerId);
}

export function Tour({ showDetails }: { showDetails?: () => void }) {
  const i = useEarth((s) => s.tourStep);
  const setStep = useEarth((s) => s.setTourStep);
  useEffect(() => {
    if (i !== null) applyStep(i);
  }, [i]);
  if (i === null) return null;
  const step = tour[i];
  const last = i === tour.length - 1;
  return (
    <section aria-label={ui.explore.actions.tour} className="glass pointer-events-auto w-[min(94vw,30rem)] p-3" aria-live="polite">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="label">
            {T.step} {i + 1} / {tour.length}
          </p>
          <h2 className="font-extrabold leading-tight">{step.title}</h2>
        </div>
        <button className="btn btn-sm" onClick={() => setStep(null)} aria-label={T.close}>
          ✕
        </button>
      </div>
      <p className="mt-1 text-sm leading-relaxed">{step.text}</p>
      <div className="mt-2 flex items-center gap-2">
        <button className="btn btn-sm" disabled={i === 0} onClick={() => setStep(i - 1)}>
          ← {ui.common.prev}
        </button>
        <div className="flex flex-1 justify-center gap-1" aria-hidden>
          {tour.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full ${k === i ? 'w-4 bg-accent' : 'w-1.5 bg-line'}`} />
          ))}
        </div>
        {showDetails && (
          <button className="btn btn-sm" onClick={showDetails}>
            {T.details}
          </button>
        )}
        <button className="btn btn-sm btn-primary" onClick={() => setStep(last ? null : i + 1)}>
          {last ? T.end : `${ui.common.next} →`}
        </button>
      </div>
    </section>
  );
}
