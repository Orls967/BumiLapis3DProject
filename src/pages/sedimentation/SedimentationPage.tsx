import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ui } from '@/content/ui';
import { PageTabs } from '@/ui/PageTabs';
import { QuizButton } from '@/ui/Quiz';

const BasinSim = lazy(() => import('./BasinSim'));
const TubeSim = lazy(() => import('./TubeSim'));
const FlumeSim = lazy(() => import('./FlumeSim'));

const T = ui.sed;
const TABS = [
  { id: 'cekungan', label: T.tabs.basin, Component: BasinSim },
  { id: 'tabung', label: T.tabs.tube, Component: TubeSim },
  { id: 'arus', label: T.tabs.flume, Component: FlumeSim },
] as const;

export default function SedimentationPage() {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((t) => t.id === params.get('sim')) ?? TABS[0];
  const Active = active.Component;
  return (
    <div className="page pb-10">
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-full sm:basis-0">
          <h1 className="page-title">{T.title}</h1>
          <p className="text-sm text-muted">{T.intro}</p>
        </div>
        <QuizButton module="sedimentation" />
      </header>
      <PageTabs label={T.title} tabs={TABS} active={active.id} onChange={(id) => setParams({ sim: id }, { replace: true })} />
      <div role="tabpanel" aria-label={active.label} className="mt-3">
        <Suspense fallback={<p className="text-muted">{ui.common.loading}</p>}>
          <Active />
        </Suspense>
      </div>
    </div>
  );
}
