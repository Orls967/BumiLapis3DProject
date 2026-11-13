import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ui } from '@/content/ui';
import { PageTabs } from '@/ui/PageTabs';
import { QuizButton } from '@/ui/Quiz';

const FormInterp = lazy(() => import('./FormInterp'));
const ColumnInterp = lazy(() => import('./ColumnInterp'));
const EnvCatalog = lazy(() => import('./EnvCatalog'));

const T = ui.interp;
const TABS = [
  { id: 'formulir', label: T.tabs.form, Component: FormInterp },
  { id: 'kolom', label: T.tabs.column, Component: ColumnInterp },
  { id: 'katalog', label: T.tabs.catalog, Component: EnvCatalog },
] as const;

export default function InterpretPage() {
  const [params, setParams] = useSearchParams();
  // deep links: ?kolom=<id> opens the column mode, ?lingkungan=<id> the catalogue
  const wanted = params.get('mode') ?? (params.get('kolom') ? 'kolom' : params.get('lingkungan') ? 'katalog' : 'formulir');
  const active = TABS.find((t) => t.id === wanted) ?? TABS[0];
  const Active = active.Component;
  return (
    <div className="page pb-10">
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-full sm:basis-0">
          <h1 className="page-title">{T.title}</h1>
          <p className="text-sm text-muted">{T.intro}</p>
        </div>
        <QuizButton module="interpret" />
      </header>
      <p role="note" className="mt-2 rounded-xl border border-warn/50 bg-accent-soft px-3 py-2 text-sm font-semibold">
        ⚠ {T.disclaimer}
      </p>
      <PageTabs
        label={T.title}
        tabs={TABS}
        active={active.id}
        onChange={(id) => {
          const next: Record<string, string> = { mode: id };
          const kolom = params.get('kolom');
          if (id === 'kolom' && kolom) next.kolom = kolom;
          setParams(next, { replace: true });
        }}
      />
      <div role="tabpanel" aria-label={active.label} className="mt-3">
        <Suspense fallback={<p className="text-muted">{ui.common.loading}</p>}>
          <Active />
        </Suspense>
      </div>
    </div>
  );
}
