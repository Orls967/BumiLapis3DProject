# BumiLapis

Aplikasi web edukasi geosains: globe 3D yang bisa dibelah untuk menjelajahi lapisan Bumi dari
eksosfer sampai inti dalam, ditambah modul lapisan batuan 3D, kolom stratigrafi, formasi,
simulasi sedimentasi, dan interpretasi lingkungan pengendapan. Tanpa backend, tanpa API key.

Spesifikasi lengkap ada di BUMILAPIS.md. Di awal setiap sesi, jalankan prosedur lanjut di
BUMILAPIS.md bagian 1.2.

## Perintah

- `npm run dev` — server pengembangan (port 5173)
- `npm run build` — tsc + vite build; `npm run preview` — sajikan `dist`
- `npm run lint`, `npm run typecheck`, `npm run test` (vitest), `npm run e2e` (playwright)
- `node scripts/shots.mjs <out.png> '<hash>' [WxH] [langkah…]` — tangkapan layar untuk dinilai

## Aturan keras

1. Git lokal saja sampai pemilik berkata "Publikasikan": tanpa remote, tanpa push.
2. Jangan mengarang data ilmiah. Angka dari BUMILAPIS.md Bagian 3 atau punya `sources`;
   yang belum terverifikasi `verified: false` dan UI menampilkan "perlu verifikasi".
3. Bukan produk Google: tanpa nama, logo, tile, atau API Google. Tanpa backend/akun.
4. Skala jujur: tampilan diperbesar berlabel "skala diperbesar"; ada mode "skala sebenarnya".
5. Aset berlisensi jelas; catat di CREDITS.md. Gagal unduh → material prosedural.
6. Jangan mengubah BUMILAPIS.md.

## Konvensi

- Vite + React + TypeScript strict; three.js lewat @react-three/fiber, drei, postprocessing;
  Zustand; HashRouter; Tailwind v4; SVG sendiri dengan d3-scale/d3-shape; Vitest; Playwright.
- `base: './'` di Vite. Lazy-load per rute; three.js hanya di rute yang memerlukannya.
- UI berbahasa Indonesia; teks UI di `src/content/ui.ts`, konten ilmiah di `src/content/`
  (divalidasi Zod saat test). Kode, nama variabel, komentar berbahasa Inggris.
- Angka sebagai number dengan satuan di nama field (`depthTopKm`, `tempC`); tampil lewat
  `Intl.NumberFormat('id-ID')` (`src/lib/format.ts`).
- Logika murni + unit test di `src/lib/`; 3D di `src/scene/`; UI di `src/ui/`; halaman di
  `src/pages/`; state di `src/store/`; worker di `src/workers/`.
- Aksesibilitas: keyboard penuh, kontras AA, hormati `prefers-reduced-motion`, setiap tampilan
  3D punya padanan teks.
- Conventional Commits; tag `m0` … `m9`. Checkpoint: typecheck + test lolos → commit →
  perbarui `docs/PROGRESS.md` → commit `chore: checkpoint`.
- Prioritas: kualitas 3D dan kemudahan interaksi (BUMILAPIS.md 1.5); periksa dengan tangkapan
  layar sebelum menganggap selesai.
