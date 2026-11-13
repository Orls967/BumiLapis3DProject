import type { Op, Unit } from '@/lib/strata/model';

export type ScenarioParams = { tilt: number; amplitude: number; wavelength: number; throwM: number; erosion: number };
export type ParamKey = keyof ScenarioParams;
export type ScenarioEvent = { label: string; principle: string; op: Op };
export type Scenario = {
  id: string;
  name: string;
  description: string;
  lesson: string;
  defaults: ScenarioParams;
  /** Sliders that matter for this scenario. */
  params: ParamKey[];
  build: (p: ScenarioParams) => ScenarioEvent[];
};

export const paramInfo: Record<ParamKey, { label: string; unit: string; min: number; max: number; step: number; presets: number[] }> = {
  tilt: { label: 'Kemiringan lapisan', unit: '°', min: 0, max: 40, step: 1, presets: [0, 10, 20, 30] },
  amplitude: { label: 'Amplitudo lipatan', unit: 'm', min: 0, max: 160, step: 5, presets: [40, 80, 120] },
  wavelength: { label: 'Panjang gelombang lipatan', unit: 'm', min: 500, max: 2000, step: 50, presets: [700, 1000, 1500] },
  throwM: { label: 'Pergeseran sesar', unit: 'm', min: 0, max: 220, step: 5, presets: [50, 100, 160] },
  erosion: { label: 'Tingkat erosi permukaan', unit: 'm', min: 0, max: 260, step: 5, presets: [0, 60, 120, 200] },
};

const u = (id: string, name: string, lithologyId: string, thicknessM: number, environmentId: string | undefined, ageLabel: string, description: string): Unit => ({ id, name, lithologyId, thicknessM, environmentId, ageLabel, description });

/** Generic teaching stack, oldest first. */
const A = u('A', 'Lapisan A · konglomerat', 'conglomerate', 60, 'alluvial-fan', 'urutan 1 (tertua)', 'Konglomerat kipas aluvial di atas batuan dasar.');
const B = u('B', 'Lapisan B · batupasir', 'sandstone', 80, 'braided-river', 'urutan 2', 'Batupasir sungai.');
const Cc = u('C', 'Lapisan C · serpih', 'shale', 70, 'shelf', 'urutan 3', 'Serpih paparan laut dangkal.');
const D = u('D', 'Lapisan D · batugamping', 'limestone', 70, 'carbonate-platform', 'urutan 4', 'Batugamping paparan karbonat.');
const E = u('E', 'Lapisan E · batulanau', 'siltstone', 60, 'shelf', 'urutan 5', 'Batulanau laut dangkal.');
const F = u('F', 'Lapisan F · batupasir', 'sandstone', 80, 'shoreface', 'urutan 6', 'Batupasir pantai.');
const G = u('G', 'Lapisan G · konglomerat alas', 'conglomerate', 30, 'braided-river', 'pasca-erosi 1', 'Konglomerat alas di atas bidang ketidakselarasan.');
const H = u('H', 'Lapisan H · napal', 'marl', 50, 'shelf', 'pasca-erosi 2', 'Napal laut dangkal.');
const I = u('I', 'Lapisan I · tuf', 'tuff', 40, undefined, 'pasca-erosi 3 (termuda)', 'Tuf jatuhan abu gunung api.');
const DIKE = u('dike', 'Dike batuan beku', 'igneous', 0, undefined, 'lebih muda dari semua yang dipotongnya', 'Intrusi tegak yang memotong perlapisan.');
const SILL = u('sill', 'Sill batuan beku', 'igneous', 0, undefined, 'seumur dengan dike pengumpannya', 'Intrusi yang menyisip sejajar perlapisan.');
const stack = [A, B, Cc, D, E, F];

const deposit = (units: Unit[], label = 'Pengendapan lapisan A–F'): ScenarioEvent => ({
  label,
  principle: 'Superposisi dan horizontalitas asal: sedimen diendapkan mendatar, yang bawah lebih tua.',
  op: { type: 'deposit', units },
});
const erode = (depthM: number, label = 'Erosi permukaan'): ScenarioEvent => ({
  label,
  principle: 'Erosi memotong semua yang ada di atas permukaan erosi; waktu yang hilang tidak terekam.',
  op: { type: 'erode', depthM },
});
const base: ScenarioParams = { tilt: 0, amplitude: 80, wavelength: 1000, throwM: 100, erosion: 0 };

export const scenarios: Scenario[] = [
  {
    id: 'layer-cake',
    name: 'Datar (layer-cake)',
    description: 'Tumpukan lapisan mendatar yang belum terganggu.',
    lesson: 'Titik awal semua blok: lapisan diendapkan mendatar dan menerus, dari tua di bawah ke muda di atas.',
    defaults: { ...base, erosion: 0 },
    params: ['erosion'],
    build: (p) => [deposit(stack), erode(p.erosion)],
  },
  {
    id: 'tilted',
    name: 'Miring',
    description: 'Lapisan yang dimiringkan lalu dipotong erosi.',
    lesson: 'Lapisan miring berarti telah terdeformasi setelah diendapkan. Di permukaan, lapisan tua dan muda tersingkap berdampingan.',
    defaults: { ...base, tilt: 18, erosion: 150 },
    params: ['tilt', 'erosion'],
    build: (p) => [
      deposit(stack),
      { label: 'Pemiringan', principle: 'Horizontalitas asal: kemiringan terjadi setelah pengendapan.', op: { type: 'tilt', angleDeg: p.tilt, azimuthDeg: 0 } },
      erode(p.erosion),
    ],
  },
  {
    id: 'anticline',
    name: 'Antiklin',
    description: 'Lipatan melengkung ke atas, puncaknya tererosi.',
    lesson: 'Pada antiklin yang tererosi, lapisan tertua tersingkap di inti dan makin muda ke arah sayap.',
    defaults: { ...base, amplitude: 110, wavelength: 1100, erosion: 150 },
    params: ['amplitude', 'wavelength', 'erosion'],
    build: (p) => [
      deposit(stack),
      { label: 'Pelipatan (antiklin)', principle: 'Tekanan mendatar melengkungkan lapisan ke atas.', op: { type: 'fold', amplitudeM: p.amplitude, wavelengthM: p.wavelength, axisAzimuthDeg: 90 } },
      erode(p.erosion),
    ],
  },
  {
    id: 'syncline',
    name: 'Sinklin',
    description: 'Lipatan melengkung ke bawah.',
    lesson: 'Pada sinklin yang tererosi, lapisan termuda berada di inti dan makin tua ke arah sayap.',
    defaults: { ...base, amplitude: 110, wavelength: 1100, erosion: 150 },
    params: ['amplitude', 'wavelength', 'erosion'],
    build: (p) => [
      deposit(stack),
      { label: 'Pelipatan (sinklin)', principle: 'Tekanan mendatar melengkungkan lapisan ke bawah.', op: { type: 'fold', amplitudeM: -p.amplitude, wavelengthM: p.wavelength, axisAzimuthDeg: 90 } },
      erode(p.erosion),
    ],
  },
  {
    id: 'normal-fault',
    name: 'Sesar normal',
    description: 'Blok atap turun; di sumur sebagian lapisan hilang.',
    lesson: 'Regangan menurunkan blok atap. Sumur yang menembus bidang sesar kehilangan sebagian urutan (missing section).',
    defaults: { ...base, throwM: 120, erosion: 40 },
    params: ['throwM', 'erosion'],
    build: (p) => [
      deposit(stack),
      { label: 'Sesar normal', principle: 'Potong-memotong: sesar lebih muda daripada lapisan yang dipotongnya.', op: { type: 'fault', kind: 'normal', dipDeg: 60, strikeDeg: 90, throwM: p.throwM, positionM: -120 } },
      erode(p.erosion),
    ],
  },
  {
    id: 'reverse-fault',
    name: 'Sesar naik',
    description: 'Blok atap terdorong naik; di sumur lapisan terulang.',
    lesson: 'Tekanan mendorong blok atap ke atas blok alas. Sumur yang menembus bidang sesar menjumpai lapisan yang sama dua kali.',
    defaults: { ...base, throwM: 130, erosion: 130 },
    params: ['throwM', 'erosion'],
    build: (p) => [
      deposit(stack),
      { label: 'Sesar naik', principle: 'Potong-memotong: sesar lebih muda daripada lapisan yang dipotongnya.', op: { type: 'fault', kind: 'reverse', dipDeg: 32, strikeDeg: 90, throwM: p.throwM, positionM: -200 } },
      erode(p.erosion),
    ],
  },
  {
    id: 'strike-slip',
    name: 'Sesar geser',
    description: 'Pergeseran mendatar; terlihat dari dike dan lapisan miring yang tergeser.',
    lesson: 'Sesar geser menggeser batuan secara mendatar. Pergeserannya terlihat pada peta bila ada penanda yang terpotong, misalnya dike atau lapisan miring.',
    defaults: { ...base, tilt: 14, throwM: 180, erosion: 120 },
    params: ['tilt', 'throwM', 'erosion'],
    build: (p) => [
      deposit(stack),
      { label: 'Pemiringan', principle: 'Horizontalitas asal: kemiringan terjadi setelah pengendapan.', op: { type: 'tilt', angleDeg: p.tilt, azimuthDeg: 90 } },
      { label: 'Intrusi dike', principle: 'Potong-memotong: dike lebih muda daripada lapisan yang diterobosnya.', op: { type: 'intrude', kind: 'dike', unit: DIKE, positionM: 0, widthM: 50, strikeDeg: 60 } },
      erode(p.erosion),
      { label: 'Sesar geser', principle: 'Sesar yang menggeser dike lebih muda daripada dike itu.', op: { type: 'fault', kind: 'strike-slip', dipDeg: 90, strikeDeg: 0, throwM: p.throwM, positionM: 0 } },
    ],
  },
  {
    id: 'angular-unconformity',
    name: 'Ketidakselarasan bersudut',
    description: 'Lapisan miring terpotong rata, lalu ditutup lapisan mendatar.',
    lesson: 'Empat babak dalam satu singkapan: pengendapan, pemiringan, erosi, lalu pengendapan lagi. Bidang di antaranya mewakili waktu yang hilang.',
    defaults: { ...base, tilt: 22, erosion: 230 },
    params: ['tilt', 'erosion'],
    build: (p) => [
      deposit(stack),
      { label: 'Pemiringan', principle: 'Horizontalitas asal: kemiringan terjadi setelah pengendapan.', op: { type: 'tilt', angleDeg: p.tilt, azimuthDeg: 0 } },
      erode(p.erosion, 'Erosi sampai rata'),
      { ...deposit([G, H, I], 'Pengendapan lapisan G–I'), principle: 'Lapisan baru menutup bidang erosi: ketidakselarasan bersudut.' },
    ],
  },
  {
    id: 'intrusion',
    name: 'Intrusi (dike dan sill)',
    description: 'Dike memotong perlapisan dan mengumpani sill yang menyisip sejajar lapisan.',
    lesson: 'Batuan beku yang menerobos selalu lebih muda daripada batuan yang diterobosnya. Sill bisa menipu: ia sejajar perlapisan, tetapi lebih muda daripada lapisan di atasnya.',
    defaults: { ...base, erosion: 30 },
    params: ['erosion'],
    build: (p) => [
      deposit(stack),
      { label: 'Intrusi dike', principle: 'Potong-memotong: dike lebih muda daripada lapisan yang diterobosnya.', op: { type: 'intrude', kind: 'dike', unit: DIKE, positionM: -150, widthM: 60, strikeDeg: 90 } },
      { label: 'Intrusi sill', principle: 'Sill menyisip sejajar perlapisan tetapi lebih muda daripada lapisan di atas dan di bawahnya.', op: { type: 'intrude', kind: 'sill', unit: SILL, levelM: -240, thicknessM: 34, fromM: -150, toM: 380, strikeDeg: 90 } },
      erode(p.erosion),
    ],
  },
  {
    id: 'transgression-regression',
    name: 'Transgresi–regresi',
    description: 'Urutan fasies yang merekam laut maju lalu mundur.',
    lesson: 'Dari bawah ke atas: pantai → paparan → karbonat (laut makin dalam, transgresi), lalu kembali ke paparan → pantai → rawa (regresi). Bor sumur dan kirim ke modul interpretasi untuk melihat trennya.',
    defaults: { ...base, erosion: 0 },
    params: ['erosion'],
    build: (p) => [
      deposit(
        [
          u('T1', 'Batupasir pantai', 'sandstone', 60, 'shoreface', 'urutan 1 (tertua)', 'Batupasir pantai; awal transgresi.'),
          u('T2', 'Serpih paparan', 'shale', 80, 'shelf', 'urutan 2', 'Serpih laut dangkal.'),
          u('T3', 'Batugamping', 'limestone', 60, 'carbonate-platform', 'urutan 3', 'Karbonat paparan; laut jernih.'),
          u('T4', 'Napal laut terbuka', 'marl', 70, 'pelagic', 'urutan 4', 'Puncak transgresi.'),
          u('T5', 'Serpih paparan', 'shale', 60, 'shelf', 'urutan 5', 'Awal regresi.'),
          u('T6', 'Batupasir muka pantai', 'sandstone', 60, 'shoreface', 'urutan 6', 'Laut makin dangkal.'),
          u('T7', 'Batubara rawa', 'coal', 20, 'delta', 'urutan 7 (termuda)', 'Rawa dataran pantai; puncak regresi.'),
        ],
        'Pengendapan urutan transgresi–regresi',
      ),
      erode(p.erosion),
    ],
  },
];

export const scenarioById = new Map(scenarios.map((s) => [s.id, s]));
