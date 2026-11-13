import { ui } from '@/content/ui';

export default function ExplorePage() {
  return (
    <div className="page">
      <h1 className="page-title">{ui.nav.explore.label}</h1>
      <p className="mt-2 text-muted">{ui.common.comingSoon}</p>
    </div>
  );
}
