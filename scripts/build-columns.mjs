// Generates the built-in stratigraphic columns (src/content/columns/*.json) from compact tables.
// Rows are listed from top to bottom: [thicknessM, lithology, grainBase, grainTop, baseContact, structures, fossils, extra]
import { writeFileSync } from 'node:fs';

const bishop = {
  title: 'South Sumatra Basin Province, Indonesia: The Lahat/Talang Akar–Cenozoic Total Petroleum System. USGS Open-File Report 99-50-S',
  author: 'Bishop, M. G.',
  year: 2001,
  url: 'https://pubs.usgs.gov/of/1999/ofr-99-0050/OF99-50S/',
};
const deCoster = {
  title: 'The geology of the Central and South Sumatra Basins. Proceedings Indonesian Petroleum Association, 3rd Annual Convention, 77–110',
  author: 'De Coster, G. L.',
  year: 1974,
};

function build(prefix, rows) {
  let top = 0;
  return rows.map(([t, lith, gBase, gTop, contact, structures, fossils, extra], i) => {
    const bed = {
      id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
      topM: top,
      baseM: top + t,
      lithologyId: lith,
      grainSize: gBase,
      ...(gTop && gTop !== gBase ? { grainSizeTop: gTop } : {}),
      structures,
      fossils,
      baseContact: contact,
      ...extra,
    };
    top += t;
    return bed;
  });
}

const fluvial = { environmentId: 'meandering-river' };
const delta = { environmentId: 'delta' };
const carb = { environmentId: 'carbonate-platform' };
const fan = { environmentId: 'submarine-fan' };
const teaching = {
  id: 'teaching',
  title: 'Kolom ajar generik (contoh ajar)',
  location: 'Rekaan untuk belajar; bukan lokasi nyata',
  kind: 'example',
  note: 'Contoh ajar rekaan (≈150 m). Dari bawah ke atas: paket turbidit dengan urutan Bouma, ketidakselarasan, selang karbonat, urutan delta mengasar ke atas dengan batubara di puncak, lalu urutan sungai menghalus ke atas dengan dasar erosional.',
  beds: build('t', [
    [6, 'shale', 'clay', null, 'gradational', ['mud-cracks', 'roots'], ['plants'], { ...fluvial, color: 'red', description: 'Lempung dataran banjir kemerahan dengan rekah kerut dan jejak akar.' }],
    [5, 'siltstone', 'silt', null, 'gradational', ['ripples'], ['plants'], { ...fluvial, description: 'Batulanau bergelembur; puncak gosong tanjung.' }],
    [8, 'sandstone', 'm-sand', 'f-sand', 'gradational', ['cross-bedding'], [], { ...fluvial, description: 'Batupasir bersilang-siur yang menghalus ke atas.' }],
    [5, 'sandstone', 'vc-sand', 'c-sand', 'erosional', ['trough-cross-bedding', 'erosional-base'], ['wood'], { ...fluvial, description: 'Batupasir kasar berkerikil di dasar alur sungai; dasar erosional memotong batubara di bawahnya.' }],
    [2, 'coal', 'clay', null, 'sharp', [], ['plants'], { ...delta, description: 'Batubara rawa dataran delta.' }],
    [10, 'sandstone', 'f-sand', 'm-sand', 'gradational', ['cross-bedding', 'ripples'], ['plants'], { ...delta, description: 'Batupasir muka delta, mengasar ke atas.' }],
    [10, 'siltstone', 'silt', 'vf-sand', 'gradational', ['ripples', 'bioturbation', 'convolute'], ['brackish-fauna'], { ...delta, description: 'Batulanau sampai pasir sangat halus; struktur beban.' }],
    [16, 'shale', 'clay', 'silt', 'gradational', ['parallel-lamination', 'bioturbation'], ['marine-fauna'], { ...delta, color: 'dark', description: 'Lempung prodelta abu-abu gelap.' }],
    [8, 'marl', 'clay', null, 'gradational', ['bioturbation'], ['forams'], { ...carb, description: 'Napal dengan foraminifera.' }],
    [14, 'limestone', 'c-sand', null, 'sharp', ['massive'], ['coral', 'algae'], { ...carb, description: 'Batugamping terumbu (boundstone) dengan koral dan alga.' }],
    [8, 'limestone', 'm-sand', null, 'unconformity', ['ooids', 'cross-bedding'], ['large-forams'], { ...carb, description: 'Batugamping grainstone dengan ooid; menindih paket turbidit di atas bidang ketidakselarasan.' }],
    [6, 'shale', 'clay', null, 'gradational', ['fine-lamination'], ['planktonic-forams'], { ...fan, color: 'dark', description: 'Lumpur hemipelagik (Te).' }],
    [6, 'sandstone', 'm-sand', 'vf-sand', 'sharp', ['graded-bedding', 'bouma', 'sole-marks'], ['deep-marine-fauna'], { ...fan, description: 'Turbidit: pasir bersusun (Ta) → laminasi sejajar (Tb) → gelembur (Tc); cetakan suling di dasar.' }],
    [6, 'shale', 'clay', null, 'gradational', ['fine-lamination'], ['planktonic-forams'], { ...fan, color: 'dark', description: 'Lumpur hemipelagik (Te).' }],
    [7, 'sandstone', 'm-sand', 'vf-sand', 'sharp', ['graded-bedding', 'bouma', 'sole-marks'], ['deep-marine-fauna'], { ...fan, description: 'Turbidit dengan urutan Bouma lengkap.' }],
    [6, 'shale', 'clay', null, 'gradational', ['fine-lamination'], ['planktonic-forams'], { ...fan, color: 'dark', description: 'Lumpur hemipelagik (Te).' }],
    [8, 'sandstone', 'c-sand', 'f-sand', 'sharp', ['graded-bedding', 'bouma', 'sole-marks'], ['deep-marine-fauna'], { ...fan, description: 'Turbidit tebal bersusun; cetakan suling dan beban.' }],
    [19, 'shale', 'clay', null, 'sharp', ['fine-lamination'], ['planktonic-forams'], { ...fan, color: 'dark', description: 'Serpih laut dalam.' }],
  ]),
  sources: [
    { title: 'Kolom rekaan untuk pengajaran; pola fasies mengikuti Nichols, G. (2009), Sedimentology and Stratigraphy', author: 'BumiLapis', year: 2026 },
  ],
  verified: true,
};

const F = (formationId, ageMa, environmentId) => ({ formationId, ageMa, ...(environmentId ? { environmentId } : {}) });
const kasai = F('kasai', [5.333, 0.0117], 'braided-river');
const me = F('muara-enim', [11.63, 2.58], 'delta');
const ab = F('air-benakat', [15.98, 11.63], 'shelf');
const gumai = F('gumai', [23.03, 11.63], 'shelf');
const brf = F('baturaja', [23.03, 15.98], 'carbonate-platform');
const taf = F('talang-akar', [27.82, 15.98], 'delta');
const lahat = F('lahat', [56.0, 23.03], 'alluvial-fan');
const southSumatra = {
  id: 'south-sumatra',
  title: 'Cekungan Sumatra Selatan (kolom skematis)',
  location: 'Cekungan Sumatra Selatan, Indonesia',
  kind: 'case-study',
  note: 'Kolom skematis gabungan. Urutan formasi, litologi, dan lingkungan mengikuti Bishop (2001); tebal tiap lapisan digambar ilustratif di dalam rentang yang dilaporkan dan tidak mewakili satu sumur atau singkapan tertentu.',
  beds: build('ss', [
    [90, 'tuff', 'f-sand', null, 'gradational', ['massive'], ['none'], { ...kasai, description: 'Tuf dan pasir tufan; endapan darat saat pengangkatan Bukit Barisan.' }],
    [70, 'sandstone', 'c-sand', 'm-sand', 'erosional', ['trough-cross-bedding', 'erosional-base'], ['wood'], { ...kasai, description: 'Batupasir tufan berkerikil dengan sisipan lempung.' }],
    [60, 'coal', 'clay', null, 'sharp', [], ['plants'], { ...me, description: 'Batubara tebal.' }],
    [150, 'shale', 'clay', 'silt', 'gradational', ['roots', 'parallel-lamination'], ['plants'], { ...me, color: 'dark', description: 'Batulempung karbonan dengan sisa tumbuhan.' }],
    [40, 'coal', 'clay', null, 'sharp', [], ['plants'], { ...me, description: 'Batubara.' }],
    [200, 'sandstone', 'f-sand', 'm-sand', 'gradational', ['cross-bedding', 'ripples'], ['plants', 'brackish-fauna'], { ...me, description: 'Batupasir dataran delta dan pantai, mengasar ke atas.' }],
    [150, 'shale', 'clay', 'silt', 'gradational', ['bioturbation', 'parallel-lamination'], ['brackish-fauna', 'molluscs'], { ...me, description: 'Batulempung dan batulanau laut dangkal sampai payau.' }],
    [350, 'sandstone', 'vf-sand', 'm-sand', 'gradational', ['hummocky', 'cross-bedding', 'bioturbation'], ['molluscs', 'marine-fauna'], { ...F('air-benakat', [15.98, 11.63], 'shoreface'), description: 'Batupasir laut dangkal glaukonitan; pasir bertambah ke atas.' }],
    [450, 'shale', 'clay', 'silt', 'gradational', ['bioturbation', 'parallel-lamination'], ['marine-fauna', 'forams'], { ...ab, color: 'green', description: 'Lempung laut glaukonitan dengan sisipan batupasir halus; awal regresi.' }],
    [500, 'shale', 'clay', null, 'gradational', ['parallel-lamination'], ['planktonic-forams', 'marine-fauna'], { ...gumai, color: 'dark', description: 'Serpih laut kaya fosil; puncak transgresi.' }],
    [60, 'limestone', 'f-sand', null, 'sharp', ['bioturbation'], ['forams', 'marine-fauna'], { ...gumai, color: 'green', description: 'Sisipan tipis batugamping glaukonitan.' }],
    [520, 'shale', 'clay', null, 'gradational', ['parallel-lamination'], ['planktonic-forams', 'marine-fauna'], { ...gumai, color: 'dark', description: 'Serpih dan serpih gampingan laut terbuka.' }],
    [75, 'limestone', 'c-sand', null, 'gradational', ['massive'], ['coral', 'algae', 'large-forams'], { ...brf, description: 'Batugamping terumbu dan paparan.' }],
    [130, 'shale', 'clay', 'silt', 'gradational', ['parallel-lamination', 'bioturbation'], ['marine-fauna', 'brackish-fauna'], { ...taf, description: 'Anggota Transisi: serpih dan batulanau laut tepi.' }],
    [20, 'coal', 'clay', null, 'sharp', [], ['plants'], { ...taf, description: 'Sisipan batubara dataran delta.' }],
    [180, 'sandstone', 'f-sand', 'm-sand', 'gradational', ['cross-bedding', 'ripples'], ['plants', 'brackish-fauna'], { ...taf, description: 'Batupasir kuarsa dataran delta dan alur distributari.' }],
    [200, 'sandstone', 'vc-sand', 'c-sand', 'unconformity', ['trough-cross-bedding', 'erosional-base'], ['wood'], { ...F('talang-akar', [27.82, 15.98], 'braided-river'), description: 'Anggota Gritsand: batupasir kasar; menindih Formasi Lahat secara tidak selaras.' }],
    [250, 'shale', 'clay', null, 'gradational', ['fine-lamination'], ['freshwater-fauna', 'algae'], { ...F('lahat', [56.0, 23.03], 'lake'), color: 'dark', description: 'Anggota Benakat: serpih danau abu-abu sampai cokelat; batuan induk.' }],
    [250, 'tuff', 'm-sand', null, 'gradational', ['massive'], ['none'], { ...lahat, description: 'Batupasir tufan dan tuf.' }],
    [300, 'breccia', 'cobble', 'pebble', 'unconformity', ['massive', 'debris-flow'], ['none'], { ...lahat, color: 'red', description: 'Breksi dan konglomerat fase rift; menindih batuan dasar di atas ketidakselarasan.' }],
    [200, 'igneous', 'c-sand', null, 'sharp', ['massive'], ['none'], { formationId: 'basement', description: 'Batuan dasar pra-Tersier: granit dan kuarsit.' }],
  ]),
  sources: [bishop, deCoster],
  verified: false,
};

for (const c of [teaching, southSumatra]) writeFileSync(`src/content/columns/${c.id}.json`, JSON.stringify(c, null, 2) + '\n');
console.log('columns written:', teaching.beds.length, southSumatra.beds.length);
