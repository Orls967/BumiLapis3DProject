import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { ui } from '@/content/ui';

export type RouteDef = {
  path: string;
  label: string;
  short: string;
  Component: LazyExoticComponent<ComponentType>;
  /** Extra child paths handled by the same page. */
  children?: string[];
};

export const routes: RouteDef[] = [
  { path: '/', ...ui.nav.explore, Component: lazy(() => import('@/pages/explore/ExplorePage')) },
  { path: '/lapisan-batuan', ...ui.nav.strata, Component: lazy(() => import('@/pages/strata/StrataPage')) },
  { path: '/kolom', ...ui.nav.column, Component: lazy(() => import('@/pages/column/ColumnPage')) },
  {
    path: '/formasi',
    ...ui.nav.formations,
    Component: lazy(() => import('@/pages/formations/FormationsPage')),
    children: ['/formasi/:id'],
  },
  {
    path: '/sedimentasi',
    ...ui.nav.sedimentation,
    Component: lazy(() => import('@/pages/sedimentation/SedimentationPage')),
  },
  { path: '/interpretasi', ...ui.nav.interpret, Component: lazy(() => import('@/pages/interpret/InterpretPage')) },
  { path: '/glosarium', ...ui.nav.glossary, Component: lazy(() => import('@/pages/glossary/GlossaryPage')) },
  { path: '/tentang', ...ui.nav.about, Component: lazy(() => import('@/pages/about/AboutPage')) },
];
