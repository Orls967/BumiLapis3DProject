import type { OverlayKey } from '@/store/earth';

export type TourStep = {
  title: string;
  text: string;
  layerId: string;
  depthKm: number;
  overlays?: Partial<Record<OverlayKey, boolean>>;
};

/** Guided tour of Module A: from the exosphere to the inner core. */
export const tour: TourStep[] = [
  {
    title: 'Tepi antariksa: eksosfer',
    text: 'Perjalanan dimulai ≈5.000 km di atas permukaan. Di eksosfer, atom hidrogen dan helium begitu jarang sehingga bisa lepas ke antariksa. Perhatikan label "skala diperbesar": pada skala sebenarnya seluruh atmosfer di bawah 100 km nyaris tak terlihat.',
    layerId: 'exosphere',
    depthKm: 5000,
  },
  {
    title: 'Termosfer: panas tetapi terasa dingin',
    text: 'Di ≈400 km, ketinggian orbit ISS, suhu gas bisa mencapai 500–2.000 °C. Namun udaranya terlalu renggang untuk memindahkan panas. Garis Kármán, batas antariksa menurut konvensi, ada di 100 km.',
    layerId: 'thermosphere',
    depthKm: 400,
    overlays: { markers: true },
  },
  {
    title: 'Mesosfer: titik terdingin',
    text: 'Di puncak mesosfer suhu turun sampai ≈ −85 s.d. −90 °C. Lapisan ini paling sedikit diteliti: terlalu tinggi untuk balon, terlalu rendah untuk satelit. Meteor terbakar di sini.',
    layerId: 'mesosphere',
    depthKm: 70,
  },
  {
    title: 'Stratosfer dan perisai ozon',
    text: 'Antara ≈15 dan 35 km, ozon menyerap sebagian besar UV-B dan UV-C. Penyerapan itu memanaskan stratosfer, sehingga suhu justru naik terhadap ketinggian.',
    layerId: 'stratosphere',
    depthKm: 25,
    overlays: { ozone: true, markers: false },
  },
  {
    title: 'Troposfer: selimut tipis tempat kita hidup',
    text: 'Hampir semua cuaca terjadi di bawah ≈12 km. Tekanan sudah tinggal separuh pada ≈5,5 km, dan 99% massa atmosfer ada di bawah ≈30 km: kurang dari 0,5% jari-jari Bumi.',
    layerId: 'troposphere',
    depthKm: 5.5,
    overlays: { ozone: false },
  },
  {
    title: 'Lautan dan kerak',
    text: 'Lautan menutupi ≈71% permukaan, tetapi kedalaman rata-ratanya hanya ≈3,7 km. Kerak di bawahnya juga tipis: ≈7 km di samudra dan ≈35 km di benua. Lubang bor terdalam, Kola, baru mencapai ≈12,3 km.',
    layerId: 'continental-crust',
    depthKm: -12.3,
    overlays: { markers: true },
  },
  {
    title: 'Mantel atas: padat tetapi mengalir',
    text: 'Di bawah Moho, batuan peridotit padat mengalir beberapa sentimeter per tahun. Mantel bukan lautan magma; magma hanya terbentuk di tempat tertentu seperti punggungan tengah samudra dan zona subduksi.',
    layerId: 'upper-mantle',
    depthKm: -200,
    overlays: { markers: false, plates: true },
  },
  {
    title: 'Zona transisi dan mantel bawah',
    text: 'Pada 410 dan 660 km, tekanan memaksa olivin berganti struktur kristal. Di bawah 660 km terbentang mantel bawah sampai 2.891 km, dengan lapisan D″ yang heterogen di dasarnya.',
    layerId: 'lower-mantle',
    depthKm: -1800,
    overlays: { plates: false },
  },
  {
    title: 'Inti luar: lautan besi cair',
    text: 'Di 2.891 km densitas melonjak dari ≈5,57 menjadi ≈9,90 g/cm³ dan gelombang S berhenti: kita masuk ke besi-nikel cair. Alirannya membangkitkan medan magnet yang melindungi atmosfer dari angin Matahari.',
    layerId: 'outer-core',
    depthKm: -4000,
    overlays: { magnetosphere: true },
  },
  {
    title: 'Inti dalam: pusat Bumi',
    text: 'Pada 5.150 km besi kembali padat. Suhunya ≈5.000–5.700 °C, sebanding dengan permukaan Matahari, tetapi tekanan 329–364 GPa menaikkan titik leleh besi. Inti dalam tumbuh kira-kira 1 mm per tahun.',
    layerId: 'inner-core',
    depthKm: -6000,
    overlays: { magnetosphere: false },
  },
];
