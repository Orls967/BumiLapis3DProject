import type { Formation } from './schema';
import { refs } from './sources';

const basin = 'Cekungan Sumatra Selatan';
const src = [refs.bishop, refs.deCoster];

/**
 * South Sumatra Basin case study, oldest → youngest. Ages, lithologies, environments and
 * thicknesses were checked against Bishop (2001), USGS OFR 99-50-S; numeric ages are the ICS
 * boundaries of the stated epochs. Thickness varies strongly from place to place.
 */
export const formations: Formation[] = [
  {
    id: 'basement',
    name: 'Batuan dasar',
    basin,
    age: 'Pra-Tersier',
    lithologies: ['igneous', 'metamorphic'],
    environmentIds: [],
    underlies: 'lahat',
    economic: ['Reservoir rekahan (granit dan kuarsit lapuk) di sejumlah lapangan gas'],
    description:
      'Batuan beku, metamorf, dan sedimen termalihkan berumur pra-Tersier. Dipisahkan dari sedimen Tersier di atasnya oleh ketidakselarasan. Di tinggian purba, granit dan kuarsit yang terekahkan dan lapuk menjadi reservoir.',
    sources: src,
    verified: true,
  },
  {
    id: 'lahat',
    name: 'Formasi Lahat (Lemat)',
    basin,
    age: 'Eosen – Oligosen',
    ageMa: [56.0, 23.03],
    thicknessM: [760, 1070],
    lithologies: ['tuff', 'breccia', 'conglomerate', 'sandstone', 'shale'],
    environmentIds: ['alluvial-fan', 'braided-river', 'lake'],
    overlies: 'basement',
    underlies: 'talang-akar',
    contactBelow: 'unconformable',
    economic: ['Batuan induk (serpih danau Anggota Benakat)', 'Reservoir'],
    description:
      'Endapan fase rift (synrift): batupasir tufan, konglomerat, breksi, dan lempung yang diendapkan di rendahan sesar oleh proses aluvial, sungai, dan danau. Serpih danau Anggota Benakat di bagian dalam setengah-graben menjadi batuan induk. Tebal umumnya lebih dari 760 m dan mencapai 1.070 m; setempat tidak ada.',
    sources: src,
    verified: true,
  },
  {
    id: 'talang-akar',
    name: 'Formasi Talang Akar',
    basin,
    age: 'Oligosen Akhir – Miosen Awal',
    ageMa: [27.82, 15.98],
    thicknessM: [0, 610],
    lithologies: ['sandstone', 'siltstone', 'shale', 'coal'],
    environmentIds: ['delta', 'braided-river', 'shoreface'],
    overlies: 'lahat',
    underlies: 'baturaja',
    contactBelow: 'unconformable',
    economic: ['Reservoir utama (lebih dari 75% produksi minyak kumulatif)', 'Batuan induk'],
    description:
      'Batupasir kuarsa, batulanau, dan serpih dengan sisipan batubara, diendapkan di dataran delta yang ke arah cekungan berubah menjadi laut tepi. Menindih Formasi Lahat secara tidak selaras dan meluas menumpang ke batuan dasar. Tebal sampai 610 m.',
    sources: src,
    verified: true,
  },
  {
    id: 'baturaja',
    name: 'Formasi Baturaja',
    basin,
    age: 'Miosen Awal',
    ageMa: [23.03, 15.98],
    thicknessM: [20, 120],
    lithologies: ['limestone'],
    environmentIds: ['carbonate-platform'],
    overlies: 'talang-akar',
    underlies: 'gumai',
    contactBelow: 'conformable',
    economic: ['Reservoir karbonat'],
    typeLocality: 'Tersingkap setebal ≈520 m di Pegunungan Garba (Bukit Barisan)',
    description:
      'Batugamping paparan yang tersebar luas (20–75 m) dengan terumbu dan build-up karbonat di tinggian blok sesar (60–120 m). Porositas bagian atas meningkat karena sempat tersingkap ke udara pada akhir Miosen Awal.',
    sources: src,
    verified: true,
  },
  {
    id: 'gumai',
    name: 'Formasi Gumai (Telisa)',
    basin,
    age: 'Miosen Awal – Tengah',
    ageMa: [23.03, 11.63],
    thicknessM: [0, 2700],
    lithologies: ['shale', 'marl', 'limestone', 'sandstone'],
    environmentIds: ['shelf', 'pelagic', 'submarine-fan'],
    overlies: 'baturaja',
    underlies: 'air-benakat',
    contactBelow: 'conformable',
    economic: ['Batuan penutup regional'],
    description:
      'Serpih laut kaya fosil dengan sisipan tipis batugamping glaukonitan, mewakili transgresi maksimum yang cepat dan meluas. Laut dangkal di timur laut dan batial di barat daya; batupasir halus dan batulanau di tepi cekungan. Tebal sampai 2.700 m di pusat cekungan dan menipis di tinggian.',
    sources: src,
    verified: true,
  },
  {
    id: 'air-benakat',
    name: 'Formasi Air Benakat',
    basin,
    age: 'Miosen Tengah',
    ageMa: [15.98, 11.63],
    thicknessM: [1000, 1500],
    lithologies: ['sandstone', 'shale'],
    environmentIds: ['shelf', 'shoreface', 'delta'],
    overlies: 'gumai',
    underlies: 'muara-enim',
    contactBelow: 'conformable',
    economic: ['Reservoir'],
    description:
      'Diendapkan saat regresi yang mengakhiri pengendapan Serpih Gumai. Ke arah atas berubah dari laut dalam menjadi laut dangkal: lempung glaukonitan berkurang dan pasir laut bertambah. Tebal 1.000–1.500 m; lapisan batubara menandai kontak atasnya.',
    sources: src,
    verified: true,
  },
  {
    id: 'muara-enim',
    name: 'Formasi Muara Enim',
    basin,
    age: 'Miosen Akhir – Pliosen',
    ageMa: [11.63, 2.58],
    thicknessM: [0, 750],
    lithologies: ['shale', 'sandstone', 'coal'],
    environmentIds: ['delta', 'shoreface', 'meandering-river'],
    overlies: 'air-benakat',
    underlies: 'kasai',
    contactBelow: 'conformable',
    economic: ['Sumber batubara utama', 'Reservoir'],
    description:
      'Pasir, lumpur, dan batubara tebal yang diendapkan dari laut dangkal sampai darat (delta, rawa, dataran pantai). Paling tebal di selatan (sampai 750 m) dan menipis ke utara. Pengangkatan Bukit Barisan menyuplai sedimen dari selatan dan barat daya.',
    sources: src,
    verified: true,
  },
  {
    id: 'kasai',
    name: 'Formasi Kasai',
    basin,
    age: 'Pliosen – Pleistosen',
    ageMa: [5.333, 0.0117],
    lithologies: ['tuff', 'sandstone', 'shale'],
    environmentIds: ['braided-river', 'alluvial-fan'],
    overlies: 'muara-enim',
    contactBelow: 'conformable',
    description:
      'Pasir tufan, lempung, kerikil, dan batubara tipis yang diendapkan di darat pada lembah dan sinklin yang terbentuk saat deformasi dan pengangkatan Bukit Barisan; sangat dipengaruhi vulkanisme.',
    sources: src,
    verified: false,
  },
];

export const formationById = new Map(formations.map((f) => [f.id, f]));

/** Narrative shown in the UI: one large transgressive–regressive cycle. */
export const basinStory = {
  basin,
  title: 'Satu siklus besar transgresi lalu regresi',
  text: 'Urutan formasi Cekungan Sumatra Selatan merekam satu siklus besar. Mula-mula laut maju (transgresi): endapan darat fase rift (Lahat) ditindih endapan delta dan laut tepi (Talang Akar), lalu karbonat laut dangkal (Baturaja), sampai serpih laut terbuka Gumai yang menandai transgresi maksimum. Sesudah itu laut mundur (regresi): laut dangkal (Air Benakat), delta dan rawa batubara (Muara Enim), lalu endapan darat vulkanik (Kasai). Ini contoh nyata Hukum Walther: fasies yang kini bertumpuk dulu terletak bersebelahan.',
  columnId: 'south-sumatra',
};
