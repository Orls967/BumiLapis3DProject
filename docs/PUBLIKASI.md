# Publikasi BumiLapis

> **Sudah dipublikasikan pada 2026-11-13.** Repositori: https://github.com/Orls967/BumiLapis3DProject ·
> Situs: https://orls967.github.io/BumiLapis3DProject/ . Bagian "Langkah saat Publikasikan" di bawah
> disimpan sebagai catatan; untuk memperbarui situs lihat "Memperbarui situs sesudahnya".

Dokumen ini menjelaskan apa yang terjadi saat pemilik berkata **"Publikasikan"** dan cara
memperbarui situs sesudahnya. Sebelum kata itu diucapkan, repositori ini hanya ada secara lokal:
tanpa remote, tanpa push.

## Keadaan sekarang

- Semua milestone M0–M9 selesai dan bertanda (`git tag`: `m0` … `m9`).
- `.github/workflows/deploy.yml` sudah ada: pada setiap push ke `main` ia menjalankan `npm ci`,
  `lint`, `typecheck`, `test`, `build`, lalu mengunggah `dist/` dan men-deploy ke GitHub Pages
  dengan action resmi (`configure-pages`, `upload-pages-artifact`, `deploy-pages`).
- Build memakai `base: './'` dan HashRouter, sehingga berjalan di
  `https://<pengguna>.github.io/<repo>/` tanpa konfigurasi tambahan. Sudah diuji dengan
  menyajikan `dist/` dari subfolder.
- Lisensi: MIT (`LICENSE`). Kredit aset: `CREDITS.md`.

## Langkah saat "Publikasikan"

Nama repositori bawaan `bumi-lapis`, lisensi MIT, kecuali pemilik menyebut yang lain.

1. Pastikan working tree bersih dan keempat pemeriksaan lolos:
   `npm run lint && npm run typecheck && npm run test && npm run build`.
2. `gh auth status`. Kalau belum login, pemilik menjalankan `gh auth login` (satu-satunya langkah
   yang menunggu pemilik).
3. Buat repositori **publik** (GitHub Pages gratis membutuhkan repositori publik) dan push:
   `gh repo create bumi-lapis --public --source=. --remote=origin --push`, lalu
   `git push origin --tags`.
4. Aktifkan Pages dengan sumber GitHub Actions:
   `gh api -X POST repos/{owner}/{repo}/pages -f build_type=workflow`
   (bila Pages sudah ada: `-X PUT`). Pantau deploy: `gh run watch`. Bila gagal, baca log
   (`gh run view --log-failed`), perbaiki, push ulang.
5. Buka `https://<pengguna>.github.io/bumi-lapis/` dan periksa dengan Playwright bahwa halaman
   utama dan tiap rute termuat, tekstur tampil, dan tidak ada galat konsol:
   `BASE_URL=https://<pengguna>.github.io/bumi-lapis/ node scripts/shots.mjs cek.png '#/'`.
6. Isi deskripsi dan tautan situs:
   `gh repo edit --description "…" --homepage "https://<pengguna>.github.io/bumi-lapis/"`,
   tambahkan tautan demo di README, push.
7. Laporkan URL repositori, URL situs, dan cara memperbarui.

## Memperbarui situs sesudahnya

Cukup `git push` ke `main`. Workflow membangun ulang dan men-deploy otomatis dalam beberapa
menit. Bila pemeriksaan (lint/typecheck/test) gagal, deploy dibatalkan dan situs lama tetap
tayang. Service worker memakai strategi network-first untuk halaman, jadi pengunjung mendapat
versi baru saat memuat ulang.

## Alternatif: repositori privat

Deploy lewat Vercel atau Netlify dengan mengimpor repositori. Perintah build `npm run build`,
folder keluaran `dist`. Tidak perlu variabel lingkungan.

## Daftar periksa sebelum publikasi

- [x] Tidak ada rahasia, `.env`, atau kunci API di repositori (aplikasi tidak memakai API key).
- [x] Semua aset berlisensi jelas dan tercatat di `CREDITS.md`.
- [x] Tidak ada nama, logo, tile, atau API Google.
- [x] Berkas terbesar yang ter-commit adalah tekstur Bumi (< 1 MB per berkas) dan tangkapan layar README.
