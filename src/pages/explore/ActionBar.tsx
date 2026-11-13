import { ui } from '@/content/ui';
import { useEarth } from '@/store/earth';
import { SliderField } from '@/ui/SliderField';

const A = ui.explore.actions;
const G = ui.explore.grouping;

type Props = { onHelp: () => void; onTour: () => void; onJourney: () => void; journeyOn: boolean; compact?: boolean };

/** Big labelled buttons for the main actions (touch targets ≥ 44 px). */
export function ActionBar({ onHelp, onTour, onJourney, journeyOn, compact }: Props) {
  const view = useEarth((s) => s.view);
  const cutDeg = useEarth((s) => s.cutDeg);
  const scaleMode = useEarth((s) => s.scaleMode);
  const grouping = useEarth((s) => s.grouping);
  const setView = useEarth((s) => s.setView);
  const setCutDeg = useEarth((s) => s.setCutDeg);
  const setScaleMode = useEarth((s) => s.setScaleMode);
  const setGrouping = useEarth((s) => s.setGrouping);
  const resetView = useEarth((s) => s.resetView);
  const toggle = (v: typeof view) => setView(view === v ? 'closed' : v);

  return (
    <div className="pointer-events-none flex flex-col items-center gap-2">
      {view === 'wedge' && !compact && (
        <div className="glass pointer-events-auto w-[min(92vw,26rem)] px-3 py-2">
          <SliderField
            label={ui.explore.cutAngle}
            value={Math.round(cutDeg)}
            min={0}
            max={180}
            step={5}
            unit="°"
            onChange={setCutDeg}
            presets={[
              { label: '45°', value: 45 },
              { label: '90°', value: 90 },
              { label: '135°', value: 135 },
              { label: '180°', value: 180 },
            ]}
          />
        </div>
      )}
      <div
        role="toolbar"
        aria-label={A.viewGroup}
        className="glass scroll-thin pointer-events-auto flex max-w-[calc(100vw-1rem)] items-center gap-1.5 overflow-x-auto p-1.5"
      >
        <button className="btn shrink-0" aria-pressed={view === 'wedge'} onClick={() => toggle('wedge')}>
          <span aria-hidden>◔</span> {A.cut}
        </button>
        <button className="btn shrink-0" aria-pressed={view === 'half'} onClick={() => toggle('half')}>
          <span aria-hidden>◐</span> {A.half}
        </button>
        <button className="btn shrink-0" aria-pressed={view === 'explode'} onClick={() => toggle('explode')}>
          <span aria-hidden>❖</span> {A.peel}
        </button>
        <span className="mx-0.5 h-8 w-px shrink-0 bg-line" aria-hidden />
        <button
          className="btn shrink-0"
          aria-pressed={scaleMode === 'true'}
          title={scaleMode === 'true' ? ui.explore.scaleBadge.trueHint : ui.explore.scaleBadge.exaggeratedHint}
          onClick={() => setScaleMode(scaleMode === 'true' ? 'exaggerated' : 'true')}
        >
          <span aria-hidden>⚖</span> {scaleMode === 'true' ? A.scaleTrue : A.scaleEx}
        </button>
        <button
          className="btn shrink-0"
          title={`${G.label}: ${grouping === 'compositional' ? G.compositionalHint : G.mechanicalHint}`}
          aria-label={`${G.label}: ${grouping === 'compositional' ? G.compositional : G.mechanical}`}
          onClick={() => setGrouping(grouping === 'compositional' ? 'mechanical' : 'compositional')}
        >
          <span aria-hidden>⇄</span> {grouping === 'compositional' ? G.compositional : G.mechanical}
        </button>
        <button className="btn shrink-0" aria-pressed={journeyOn} onClick={onJourney}>
          <span aria-hidden>⇅</span> {A.journey}
        </button>
        <span className="mx-0.5 h-8 w-px shrink-0 bg-line" aria-hidden />
        <button className="btn shrink-0" onClick={onTour}>
          <span aria-hidden>▶</span> {A.tour}
        </button>
        <button className="btn shrink-0" onClick={resetView}>
          <span aria-hidden>⟲</span> {A.reset}
        </button>
        <button className="btn shrink-0" onClick={onHelp} aria-label={A.help}>
          ?
        </button>
      </div>
    </div>
  );
}
