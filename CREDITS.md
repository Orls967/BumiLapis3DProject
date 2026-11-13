# Kredit dan lisensi aset

| Aset | Berkas | Sumber | Lisensi |
|---|---|---|---|
| Tekstur siang Bumi — Blue Marble Next Generation w/ Topography and Bathymetry (Desember 2004) | `public/textures/earth-day-*.webp` | NASA Earth Observatory / Visible Earth, R. Stöckli — https://visibleearth.nasa.gov/images/73909 (berkas: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg) | Domain publik (karya NASA) |
| Lampu malam — Black Marble 2016 | `public/textures/earth-night-*.webp` | NASA Earth Observatory, J. Stevens, data Suomi NPP VIIRS — https://visibleearth.nasa.gov/images/144898 (berkas: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg) | Domain publik (karya NASA) |
| Topografi (relief) — GEBCO_08 elevation rendering | `public/textures/earth-topo-2k.webp` | NASA Visible Earth — https://visibleearth.nasa.gov/images/73934 (berkas: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/gebco_08_rev_elev_5400x2700.jpg) | Domain publik (penyajian NASA; data dasar GEBCO) |
| Batas lempeng tektonik PB2002 | `public/data/plates.json` (disederhanakan) | Bird, P. (2003), *An updated digital model of plate boundaries*, G³ 4(3); konversi GeoJSON oleh H. Ahlenius — https://github.com/fraxen/tectonicplates | Open Data Commons PDDL (domain publik) |

Awan dirender secara prosedural (noise shader); tidak memakai tekstur pihak ketiga.
Semua berkas diubah ukurannya dan dikonversi ke WebP dengan `scripts/textures.mjs`.
Pola litologi, ikon, dan diagram digambar sendiri untuk proyek ini.

## Data dan rujukan ilmiah

Angka dan fakta berasal dari rujukan yang tercantum di halaman Tentang (`src/content/sources.ts`):
PREM (Dziewonski & Anderson, 1981), U.S. Standard Atmosphere (1976), Ferguson & Church (2004),
Hjulström (1935; kurva didigitasi secara pendekatan), Bishop (2001, USGS OFR 99-50-S),
De Coster (1974), ICS International Chronostratigraphic Chart, serta buku ajar Boggs dan Nichols.
Warna skala waktu geologi mengikuti ICS/CGMW. Gaya pola litologi mengacu pada FGDC-STD-013-2006,
tetapi seluruh pola digambar ulang untuk proyek ini.

## Perangkat lunak

Kode aplikasi berlisensi MIT (lihat `LICENSE`). Pustaka pihak ketiga (React, three.js,
@react-three/fiber, drei, postprocessing, Zustand, React Router, Tailwind CSS, d3-scale,
d3-shape, Zod, Vite) dipasang lewat npm dan mengikuti lisensinya masing-masing (MIT/ISC/BSD).
Tidak ada fon atau ikon pihak ketiga yang dibundel; antarmuka memakai fon sistem.
