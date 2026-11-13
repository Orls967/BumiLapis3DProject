# PROGRESS
Diperbarui: 2026-11-13 15:35
Milestone aktif: M1
Sub-tugas aktif: content/layers.ts (interior) dan globe 3D
Langkah berikut yang persis: tulis src/content/layers.ts, src/lib/profile/scale.ts, lalu
  src/scene/earth/* (EarthScene, shaders, picking) dan src/pages/explore/ExplorePage.tsx.

## Selesai
- [x] M0 Fondasi (tag m0)
## Sedang berjalan
- [ ] M1 Globe dan interior Bumi
## Keputusan
- `.claude/settings.json` TIDAK dibuat: penulisan berkas izin ditolak oleh pengaman sesi
  (auto-mode classifier). Larangan push tetap dipatuhi secara manual.
- Server gambar eoimages.gsfc.nasa.gov tidak merespons; tekstur diambil dari cermin resmi
  assets.science.nasa.gov (lihat CREDITS.md). Tekstur awan tidak tersedia → awan prosedural.
- Tailwind v4 (plugin Vite), React 19, r3f 9, Zod 4, Vite 8, TypeScript 6.
- Aturan ESLint react-hooks hanya `rules-of-hooks` dan `exhaustive-deps` (aturan compiler
  v7 tidak cocok dengan mutasi per-frame di r3f).
- Service worker sederhana (`public/sw.js`) untuk pemakaian offline setelah dimuat.
## Masalah terbuka
## Data berlabel verified:false
