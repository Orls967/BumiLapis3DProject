# PROGRESS
Diperbarui: 2026-11-13 (sesi 2)
Milestone aktif: M8
Sub-tugas aktif: penyempurnaan (aksesibilitas, performa/bundle, e2e Playwright, README)
Langkah berikut yang persis: (1) `npm run build` dan periksa ukuran chunk awal (< 500 kB gzip),
  pisahkan three.js bila ikut termuat di rute non-3D; (2) tulis tests/smoke.spec.ts (tiap rute,
  pilih lapisan, preset simulasi, sumur → kolom → interpretasi) dan jalankan `npm run e2e`;
  (3) tangkapan layar desktop+ponsel semua rute, perbaiki cacat; (4) README lengkap.

## Selesai
- [x] M0 Fondasi (tag m0)
- [x] M1 Globe dan interior Bumi (tag m1)
- [x] M2 Atmosfer, permukaan, perjalanan kedalaman (tag m2)
- [x] M3 Konten, pencarian, pembelajaran (tag m3)
- [x] M4 Kolom stratigrafi dan formasi (tag m4)
- [x] M5 Lapisan batuan 3D (tag m5)
- [x] M6 Simulasi sedimentasi (tag m6)
- [x] M7 Interpretasi lingkungan pengendapan (tag m7)
## Sedang berjalan
- [ ] M8 Penyempurnaan
- [ ] M9 Siap online
## Keputusan
- `.claude/settings.json` TIDAK dibuat: penulisan berkas izin ditolak oleh pengaman sesi
  (auto-mode classifier). Larangan push tetap dipatuhi secara manual.
- eoimages.gsfc.nasa.gov tidak merespons; tekstur diambil dari cermin resmi
  assets.science.nasa.gov (lihat CREDITS.md). Tekstur awan tidak tersedia → awan prosedural.
- Tailwind v4, React 19, r3f 9, Zod 4, Vite 8, TypeScript 6. ESLint react-hooks hanya
  `rules-of-hooks` + `exhaustive-deps`.
- Globe: semua mesh di transform identitas; bentuk (bola / muka potong) dihitung di vertex
  shader, baji dibuang di fragment shader; pemilihan lapisan memakai raycast analitik
  (`lib/profile/shells.ts: pickShell`) yang juga dipakai untuk oklusi label.
- Baji "bertangga": lapisan dalam dipotong sedikit lebih sempit; inti dalam utuh.
- Zona transisi (410–660 km) `grouping: both` agar mode mekanis tidak bercelah.
- Kerak samudra = `variantOf` kerak benua (tidak digambar sebagai cangkang).
- Lautan digambar sebagai pita setebal kedalaman rata-rata pada muka potong; zona laut
  menjadi tabel di panel dan keterangan di perjalanan kedalaman.
- Kriosfer/biosfer/magnetosfer: rentang numerik hanya ancar-ancar (rangeNote menjelaskan).
- Tekanan atmosfer diinterpolasi log-linear; densitas udara dari gas ideal; di atas 85 km
  kartu baca-langsung menampilkan "di luar tabel profil".
- Pada batas lapisan, lapisan atas "memiliki" batas (cocok dengan densitas sisi atas).
- Pembanding skala digambar sebagai titik pada muka potong di ketinggian sebenarnya.
- Service worker sederhana (`public/sw.js`) untuk offline setelah dimuat.
- Blok batuan (M5): model fungsional `column(x, y)`; tiap operasi sejarah membungkus fungsi
  sebelumnya. Deformasi = geser tegak sederhana (dinyatakan di UI). Sisi blok dirender dari
  raster penampang ke kanvas (pola litologi), bukan poligon; resolusi turun saat slider digeser.
- Label skala blok ditulis sebagai teks DOM (drei `Html` memicu galat unmount di React 19).
- Server pratinjau bisa pindah ke port 5174 bila 5173 terpakai: pakai `BASE_URL=... node scripts/shots.mjs`.
- Simulasi cekungan (M6): satuan km / m / ribu tahun; fluks m·km per ribu tahun (= m²/thn).
  Dua penyimpangan dari rumus Bagian 4.5.1, keduanya dinyatakan di UI: (1) K laut meluruh
  terhadap kedalaman air (exp(−d/40 m)) agar sedimen tidak lolos ke ujung cekungan,
  (2) batuan dasar tidak tererosi (fluks dibatasi sedimen yang tersedia). Garis waktu disimpan
  di kerangka tanpa subsidence. Ada slider tambahan "tren muka laut" untuk preset transgresi.
- Tabung pengendapan dan saluran arus digambar di kanvas 2D (bukan InstancedMesh).
- Mesin interpretasi (M7): skor = Σ bobot aturan cocok ÷ bobot positif maksimum untuk ciri yang
  diisi (untuk ciri majemuk: n bobot positif terbesar, n = jumlah nilai yang diisi). Ciri
  diagnostik hanya dipakai sebagai pemutus seri. Ukuran butir dicocokkan per kelompok
  (lempung–lanau, pasir halus/sedang/kasar, kerikil). Diamiktit dicatat sebagai konglomerat
  berpemilahan buruk karena tidak ada litologi diamiktit di daftar pola.
- Interval kolom: dipecah di kontak erosional/ketidakselarasan dan pergantian keluarga batuan
  (klastik/karbonat/kristalin), lalu per larik ukuran butir monoton; ≥ 3 larik pendek
  berurutan digabung sebagai paket ritmis (turbidit). Batuan dasar kristalin tidak ditafsirkan.
- Bobot aturan (1–5) adalah penilaian ajar dari tabel Bagian 3.F, bukan hasil pengukuran.
## Masalah terbuka
- Label 3D lapisan tipis kadang disembunyikan oleh pencegah tumpang-tindih (disengaja).
## Data berlabel verified:false
- markers.ts: ketinggian jelajah pesawat ≈11 km (nilai tipikal, belum dirujuk).
- lib/sedsim/hjulstrom.ts: kurva erosi dan pengendapan didigitasi secara pendekatan dari diagram
  klasik Hjulström (1935); UI menampilkan label "perlu verifikasi" dan "kualitatif".
