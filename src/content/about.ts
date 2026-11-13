import { refs } from './sources';

export const about = {
  title: 'Tentang BumiLapis',
  intro: [
    'BumiLapis adalah aplikasi web edukasi geosains: satu tempat untuk belajar struktur Bumi dari atas (atmosfer), tengah (permukaan, laut, kerak), sampai bawah (mantel, inti), lalu turun ke skala singkapan: lapisan batuan, kolom stratigrafi, proses sedimentasi, dan lingkungan pengendapan.',
    'Aplikasi ini berjalan sepenuhnya di peramban: tanpa akun, tanpa backend, tanpa pelacakan atau analitik, dan tetap bisa dipakai secara offline setelah dimuat. Proyek ini tidak berafiliasi dengan penyedia peta atau globe mana pun.',
  ],
  limitsTitle: 'Batasan model',
  limits: [
    'Skala: mode "skala diperbesar" menebalkan atmosfer, laut, dan kerak agar terlihat. Gunakan mode "skala sebenarnya" untuk melihat betapa tipisnya lapisan-lapisan itu.',
    'Suhu bagian dalam Bumi adalah perkiraan dengan ketidakpastian besar dan ditampilkan sebagai rentang.',
    'Densitas dan tekanan interior mengikuti titik-titik PREM (Dziewonski & Anderson, 1981) dan diinterpolasi linear di antaranya; nilai di antara titik hanyalah pendekatan.',
    'Profil atmosfer memakai titik-titik Atmosfer Standar 1976 sampai 85 km; di atasnya hanya rentang kualitatif. Densitas udara dihitung dari hukum gas ideal.',
    'Pembagian mekanis (litosfer, astenosfer, mesosfer) memakai kedalaman rata-rata; di alam batasnya berubah dari tempat ke tempat. Zona transisi (410–660 km) ditampilkan di kedua mode pengelompokan agar tidak ada celah kedalaman.',
    'Globe menampilkan satu kerak (benua, ≈35 km) pada penampang; kerak samudra (≈7 km) dijelaskan sebagai varian lateral. Pita lautan digambar setebal kedalaman rata-rata (≈3,7 km).',
    'Magnetosfer, garis medan, dan animasi zona bayangan bersifat skematis dan tidak berskala. Awan pada globe dibuat secara prosedural, bukan citra satelit.',
    'Blok lapisan batuan memakai deformasi geser tegak sederhana (bukan pemodelan mekanika batuan). Simulasi pengisian cekungan adalah model difusi satu dimensi dengan skala tegak yang sangat diperbesar; daya angkut di laut dibuat melemah terhadap kedalaman dan batuan dasar dianggap tidak tererosi. Kecepatan jatuh butir memakai persamaan Ferguson & Church (2004) untuk kuarsa dalam air 20 °C. Diagram Hjulström bersifat empiris dan kualitatif; kurvanya didigitasi secara pendekatan.',
    'Mesin interpretasi lingkungan pengendapan berbasis aturan sederhana yang transparan. Hasilnya bersifat edukatif; interpretasi nyata membutuhkan data lapangan.',
    'Data formasi Cekungan Sumatra Selatan adalah ringkasan umum dari literatur; ketebalan dan umur sangat bervariasi antarlokasi. Entri yang belum diverifikasi diberi label "perlu verifikasi".',
  ],
  sourcesTitle: 'Sumber data',
  sources: Object.values(refs).filter((r) => r.title !== refs.spec.title),
  creditsTitle: 'Kredit aset',
  credits: [
    { asset: 'Tekstur siang Bumi (Blue Marble Next Generation, Desember 2004)', source: 'NASA Earth Observatory / Visible Earth', url: 'https://visibleearth.nasa.gov/images/73909', license: 'Domain publik' },
    { asset: 'Lampu malam (Black Marble 2016)', source: 'NASA Earth Observatory, data Suomi NPP VIIRS', url: 'https://visibleearth.nasa.gov/images/144898', license: 'Domain publik' },
    { asset: 'Topografi (GEBCO_08)', source: 'NASA Visible Earth', url: 'https://visibleearth.nasa.gov/images/73934', license: 'Domain publik' },
    { asset: 'Batas lempeng PB2002 (disederhanakan)', source: 'Bird (2003); konversi GeoJSON H. Ahlenius', url: 'https://github.com/fraxen/tectonicplates', license: 'ODC PDDL' },
  ],
  unverifiedTitle: 'Data yang perlu verifikasi',
  unverifiedIntro: 'Entri berikut belum dirujuk ke sumber primer dan ditandai di antarmuka:',
  privacy: 'Tidak ada pelacakan, analitik, atau kuki. Preferensi (tema, kolom buatan sendiri) hanya disimpan di peramban Anda.',
};
