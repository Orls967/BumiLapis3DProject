import type { SearchItem } from '@/lib/search';
import { formations } from './formations';
import { glossary } from './glossary';
import { environmentNames } from './vocab';
import { layers } from './layers';
import { ui } from './ui';

const pages: SearchItem[] = [
  { kind: 'page', title: ui.nav.explore.label, subtitle: 'Globe 3D, potongan lapisan, perjalanan kedalaman', to: '/' },
  { kind: 'page', title: ui.nav.strata.label, subtitle: 'Blok diagram: lipatan, sesar, ketidakselarasan', to: '/lapisan-batuan' },
  { kind: 'page', title: ui.nav.column.label, subtitle: 'Kolom interaktif, editor, impor/ekspor', to: '/kolom' },
  { kind: 'page', title: ui.nav.formations.label, subtitle: 'Cekungan Sumatra Selatan', to: '/formasi' },
  { kind: 'page', title: ui.nav.sedimentation.label, subtitle: 'Pengisian cekungan, tabung pengendapan, Hjulström', to: '/sedimentasi' },
  { kind: 'page', title: ui.nav.interpret.label, subtitle: 'Mesin interpretasi berbasis aturan', to: '/interpretasi' },
  { kind: 'page', title: ui.nav.glossary.label, subtitle: 'Istilah geosains', to: '/glosarium' },
  { kind: 'page', title: ui.nav.about.label, subtitle: 'Sumber data, kredit, batasan model', to: '/tentang' },
];

const extra: SearchItem[] = [];
/** Later modules (formations, environments) register their entries here. */
export function registerSearchItems(items: SearchItem[]) {
  extra.push(...items);
}

export function searchIndex(): SearchItem[] {
  return [
    ...layers.map<SearchItem>((l) => ({
      kind: 'layer',
      title: l.name,
      subtitle: `${l.nameEn} · ${ui.explore.list.realms[l.realm]}`,
      to: `/?lapisan=${l.id}`,
      body: `${l.summary} ${l.keyFact}`,
    })),
    ...formations.map<SearchItem>((f) => ({ kind: 'formation', title: f.name, subtitle: `${f.basin} · ${f.age}`, to: `/formasi/${f.id}`, body: f.description })),
    ...Object.entries(environmentNames).map<SearchItem>(([id, name]) => ({ kind: 'environment', title: name, subtitle: 'Lingkungan pengendapan', to: `/interpretasi?lingkungan=${id}` })),
    ...extra,
    ...glossary.map<SearchItem>((g) => ({
      kind: 'term',
      title: g.term,
      subtitle: g.termEn ?? '',
      to: `/glosarium?istilah=${g.id}`,
      body: `${g.definition} ${(g.aliases ?? []).join(' ')}`,
    })),
    ...pages,
  ];
}
