/** Controlled vocabularies shared by columns, the editor and the interpretation engine. */
export type VocabItem = { id: string; name: string; nameEn?: string };

export const structures: VocabItem[] = [
  { id: 'cross-bedding', name: 'Silang-siur', nameEn: 'cross-bedding' },
  { id: 'trough-cross-bedding', name: 'Silang-siur palung', nameEn: 'trough cross-bedding' },
  { id: 'large-cross-bedding', name: 'Silang-siur raksasa bersudut tinggi', nameEn: 'large-scale high-angle cross-bedding' },
  { id: 'low-angle-lamination', name: 'Laminasi sejajar bersudut rendah', nameEn: 'low-angle parallel lamination' },
  { id: 'parallel-lamination', name: 'Laminasi sejajar', nameEn: 'parallel lamination' },
  { id: 'fine-lamination', name: 'Laminasi sangat halus / varve', nameEn: 'fine lamination / varves' },
  { id: 'ripples', name: 'Gelembur', nameEn: 'ripple marks' },
  { id: 'graded-bedding', name: 'Perlapisan bersusun', nameEn: 'graded bedding' },
  { id: 'bouma', name: 'Urutan Bouma (Ta–Te)', nameEn: 'Bouma sequence' },
  { id: 'sole-marks', name: 'Cetakan suling dan beban', nameEn: 'flute and load casts' },
  { id: 'convolute', name: 'Laminasi konvolut / struktur beban', nameEn: 'convolute lamination / load structures' },
  { id: 'bioturbation', name: 'Bioturbasi', nameEn: 'bioturbation' },
  { id: 'mud-cracks', name: 'Rekah kerut', nameEn: 'mud cracks' },
  { id: 'roots', name: 'Jejak akar / tanah purba', nameEn: 'root traces / paleosol' },
  { id: 'erosional-base', name: 'Dasar erosional', nameEn: 'erosional base' },
  { id: 'flaser', name: 'Flaser', nameEn: 'flaser bedding' },
  { id: 'lenticular', name: 'Lentikular', nameEn: 'lenticular bedding' },
  { id: 'herringbone', name: 'Silang-siur tulang ikan', nameEn: 'herringbone cross-bedding' },
  { id: 'mud-drapes', name: 'Tirai lumpur', nameEn: 'mud drapes' },
  { id: 'hummocky', name: 'Silang-siur hummocky', nameEn: 'hummocky cross-stratification' },
  { id: 'massive', name: 'Masif', nameEn: 'massive' },
  { id: 'debris-flow', name: 'Endapan aliran debris', nameEn: 'debris-flow fabric' },
  { id: 'dropstones', name: 'Dropstone', nameEn: 'dropstones' },
  { id: 'striated-clasts', name: 'Kerakal bergores', nameEn: 'striated clasts' },
  { id: 'ooids', name: 'Ooid', nameEn: 'ooids' },
];

export const fossils: VocabItem[] = [
  { id: 'forams', name: 'Foraminifera', nameEn: 'foraminifera' },
  { id: 'large-forams', name: 'Foraminifera besar', nameEn: 'larger foraminifera' },
  { id: 'planktonic-forams', name: 'Foraminifera planktonik', nameEn: 'planktonic foraminifera' },
  { id: 'molluscs', name: 'Moluska / cangkang', nameEn: 'molluscs / shells' },
  { id: 'plants', name: 'Sisa tumbuhan', nameEn: 'plant remains' },
  { id: 'coral', name: 'Koral', nameEn: 'corals' },
  { id: 'algae', name: 'Alga', nameEn: 'algae' },
  { id: 'radiolaria', name: 'Radiolaria', nameEn: 'radiolaria' },
  { id: 'nannofossils', name: 'Nanofosil', nameEn: 'nannofossils' },
  { id: 'marine-fauna', name: 'Fauna laut beragam', nameEn: 'diverse marine fauna' },
  { id: 'brackish-fauna', name: 'Fauna payau', nameEn: 'brackish fauna' },
  { id: 'freshwater-fauna', name: 'Fosil air tawar', nameEn: 'freshwater fossils' },
  { id: 'restricted-fauna', name: 'Fauna terbatas', nameEn: 'restricted fauna' },
  { id: 'deep-marine-fauna', name: 'Fauna laut dalam', nameEn: 'deep-marine fauna' },
  { id: 'skolithos', name: 'Jejak Skolithos (liang tegak)', nameEn: 'Skolithos burrows' },
  { id: 'wood', name: 'Sisa kayu', nameEn: 'wood fragments' },
  { id: 'none', name: 'Tanpa fosil', nameEn: 'barren' },
];

export const colors: VocabItem[] = [
  { id: 'red', name: 'Merah / cokelat kemerahan' },
  { id: 'grey', name: 'Abu-abu' },
  { id: 'dark', name: 'Abu-abu gelap / hitam' },
  { id: 'green', name: 'Kehijauan' },
  { id: 'light', name: 'Putih / kuning pucat' },
];

export const geometries: VocabItem[] = [
  { id: 'wedge', name: 'Baji menebal ke arah sumber' },
  { id: 'sheet', name: 'Lembaran luas' },
  { id: 'lens', name: 'Melensa / saluran' },
  { id: 'lobe', name: 'Lobus' },
  { id: 'elongate', name: 'Memanjang sejajar pantai' },
  { id: 'mound', name: 'Gundukan (terumbu)' },
  { id: 'thin-continuous', name: 'Tipis dan sangat menerus' },
  { id: 'irregular', name: 'Tidak teratur' },
];

export const specials: VocabItem[] = [
  { id: 'coal', name: 'Batubara' },
  { id: 'evaporite', name: 'Evaporit' },
  { id: 'carbonate', name: 'Karbonat' },
  { id: 'glauconite', name: 'Glaukonit' },
  { id: 'volcanic', name: 'Material vulkanik' },
  { id: 'rhythmic', name: 'Perselingan ritmis pasir–lumpur' },
];

export const sortings: VocabItem[] = [
  { id: 'poor', name: 'Buruk' },
  { id: 'moderate', name: 'Sedang' },
  { id: 'well', name: 'Baik' },
  { id: 'very-well', name: 'Sangat baik' },
];
export const roundings: VocabItem[] = [
  { id: 'angular', name: 'Menyudut' },
  { id: 'subangular', name: 'Menyudut tanggung' },
  { id: 'subrounded', name: 'Membundar tanggung' },
  { id: 'rounded', name: 'Membundar' },
];
export const trends: VocabItem[] = [
  { id: 'fining-up', name: 'Menghalus ke atas' },
  { id: 'coarsening-up', name: 'Mengasar ke atas' },
  { id: 'uniform', name: 'Seragam' },
  { id: 'cyclic', name: 'Siklik / ritmis' },
];
export const contacts: VocabItem[] = [
  { id: 'sharp', name: 'Tegas' },
  { id: 'gradational', name: 'Berangsur' },
  { id: 'erosional', name: 'Erosional' },
  { id: 'unconformity', name: 'Ketidakselarasan' },
];

/** Depositional environment ids and names (rules live in environments.ts). */
export const environmentNames: Record<string, string> = {
  'alluvial-fan': 'Kipas aluvial',
  'braided-river': 'Sungai teranyam',
  'meandering-river': 'Sungai bermeander',
  lake: 'Danau',
  desert: 'Gurun (eolian)',
  glacial: 'Glasial',
  delta: 'Delta',
  'tidal-flat': 'Estuari / dataran pasang surut',
  shoreface: 'Pantai / muka pantai',
  lagoon: 'Laguna',
  shelf: 'Paparan laut dangkal',
  'carbonate-platform': 'Paparan karbonat / terumbu',
  'submarine-fan': 'Lereng / kipas bawah laut',
  pelagic: 'Laut dalam (pelagik)',
};

const byId = (list: VocabItem[]) => new Map(list.map((v) => [v.id, v.name]));
const maps = { structures: byId(structures), fossils: byId(fossils), colors: byId(colors), geometries: byId(geometries), specials: byId(specials) };
export const vocabName = (kind: keyof typeof maps, id: string) => maps[kind].get(id) ?? id;
