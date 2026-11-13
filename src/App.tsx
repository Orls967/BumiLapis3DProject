import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { routes } from './routes';
import { Layout } from '@/ui/Layout';
import { ui } from '@/content/ui';

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-8 text-muted">{ui.common.loading}</div>}>
        <Routes>
          {routes.flatMap((r) => [
            <Route key={r.path} path={r.path} element={<r.Component />} />,
            ...(r.children ?? []).map((c) => <Route key={c} path={c} element={<r.Component />} />),
          ])}
          <Route path="*" element={<div className="page">{ui.common.notFound}</div>} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
