# PROGRESS
Diperbarui: 2026-11-13 (sesi 1)
Milestone aktif: M4
Sub-tugas aktif: lithologies.ts, pola SVG, penampil kolom stratigrafi
Langkah berikut yang persis: tulis src/content/lithologies.ts, src/content/timescale.ts,
  src/content/structures.ts, src/ui/LithologyPatterns.tsx, src/ui/StratColumnView.tsx,
  src/content/columns/{teaching,south-sumatra}.json, src/content/formations.ts, lalu
  halaman /kolom dan /formasi.

## Selesai
- [x] M0 Fondasi (tag m0)
- [x] M1 Globe dan interior Bumi (tag m1)
- [x] M2 Atmosfer, permukaan, perjalanan kedalaman (tag m2)
- [x] M3 Konten, pencarian, pembelajaran (tag m3)
## Sedang berjalan
- [ ] M4 Kolom stratigrafi dan formasi
- [ ] M5 Lapisan batuan 3D
- [ ] M6 Simulasi sedimentasi
- [ ] M7 Interpretasi lingkungan pengendapan
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
## Masalah terbuka
- Label 3D lapisan tipis kadang disembunyikan oleh pencegah tumpang-tindih (disengaja).
## Data berlabel verified:false
- markers.ts: ketinggian jelajah pesawat ≈11 km (nilai tipikal, belum dirujuk).
