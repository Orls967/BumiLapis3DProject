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
