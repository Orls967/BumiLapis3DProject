# BUMILAPIS.md — instruksi tunggal untuk Claude Code

Ini satu-satunya file yang perlu ada di folder proyek. Isinya: cara kerja (Bagian 1), spesifikasi produk (Bagian 2), konten ilmiah (Bagian 3), arsitektur (Bagian 4), roadmap (Bagian 5), dan publikasi (Bagian 6).

## Bagian 0 — Untuk pemilik proyek (manusia)

1. Buat folder kosong, taruh file ini di dalamnya, buka terminal di folder itu, jalankan `claude`.
2. Tempel prompt mulai:

   ```
   Baca BUMILAPIS.md sampai habis, lalu kerjakan semuanya berurutan dari M0
   sampai M9 tanpa berhenti, sesuai Bagian 1.
   ```
3. Kalau sesi terputus karena limit, tunggu limit pulih, buka `claude` lagi di folder yang sama, lalu ketik:

   ```
   Lanjut dari checkpoint terakhir.
   ```
4. Kalau semua sudah selesai dan kamu siap online, ketik:

   ```
   Publikasikan.
   ```

Supaya tidak perlu dipantau, izinkan perintah saat Claude Code meminta ("selalu izinkan"), atau jalankan dengan mode izin otomatis yang tersedia di versimu.

---

# Bagian 1 — Cara kerja (wajib diikuti Claude Code)

Proyek: **BumiLapis** (nama kerja), aplikasi web edukasi geosains. Globe 3D interaktif yang bisa dibelah untuk menjelajahi semua lapisan Bumi dari eksosfer sampai inti dalam, ditambah modul stratigrafi dan sedimentologi.

## 1.1 Satu alur tanpa henti

- Kerjakan M0 → M9 (Bagian 5) **berurutan dalam satu alur**. Selesai satu milestone, langsung lanjut ke berikutnya. Jangan berhenti untuk melapor, meminta persetujuan rencana, atau menunggu konfirmasi.
- Jangan bertanya untuk hal yang bisa diputuskan sendiri. Ambil pilihan paling masuk akal, catat di `docs/PROGRESS.md` bagian "Keputusan", lanjutkan.
- Berhenti hanya pada tiga keadaan:
  1. **Semua selesai** (M9 lolos): tulis laporan akhir dan tunggu kata "Publikasikan".
  2. **Benar-benar buntu** pada hal yang hanya bisa diberikan pemilik (mis. login). Sebelum berhenti, kerjakan dulu semua hal lain yang tidak bergantung padanya.
  3. **Limit pemakaian** memutus sesi.
- Kalau satu sub-tugas gagal setelah tiga pendekatan berbeda, catat di "Masalah terbuka", pasang versi sederhana yang berfungsi, lalu lanjut. Jangan macet di satu titik.

## 1.2 Checkpoint dan lanjut setelah limit

Kamu tidak bisa mengetahui sisa kuota dengan pasti, jadi jangan mengandalkan peringatan. Anggap sesi bisa terputus kapan saja dan jaga agar yang hilang selalu sedikit:

- **Checkpoint bergulir:** setiap selesai satu sub-tugas (satu butir di roadmap, atau kira-kira tiap 20–30 menit kerja), lakukan berurutan: pastikan `typecheck` dan `test` lolos → `git add -A` → commit → perbarui `docs/PROGRESS.md` → commit `chore: checkpoint`.
- Jangan biarkan working tree rusak lama. Pecah pekerjaan besar menjadi langkah yang masing-masing bisa di-commit dalam keadaan build lolos.
- **Kalau ada tanda apa pun bahwa limit atau batas konteks mendekat** (peringatan sistem, pemadatan konteks, respons mulai terpotong): hentikan pekerjaan baru, tulis checkpoint saat itu juga, dan beri tahu pemilik dalam satu kalimat: "Mendekati limit; checkpoint tersimpan di docs/PROGRESS.md, lanjutkan dengan 'Lanjut dari checkpoint terakhir'."
- **Format `docs/PROGRESS.md`** (selalu ditimpa agar mutakhir, bukan ditambah terus):

  ```
  # PROGRESS
  Diperbarui: <tanggal jam>
  Milestone aktif: M?
  Sub-tugas aktif: <apa yang sedang dikerjakan>
  Langkah berikut yang persis: <perintah/file/fungsi berikutnya, cukup rinci
    untuk dilanjutkan tanpa ingatan sesi ini>

  ## Selesai
  - [x] M0 ... (tag m0)
  ## Sedang berjalan
  - [ ] butir roadmap yang belum
  ## Keputusan
  ## Masalah terbuka
  ## Data berlabel verified:false
  ```
- **Prosedur lanjut** (saat diminta melanjutkan, atau di awal sesi baru mana pun): baca `CLAUDE.md` → baca `docs/PROGRESS.md` → `git status` dan `git log --oneline -15` → kalau ada perubahan belum ter-commit, periksa apakah build lolos; bila ya commit, bila tidak perbaiki atau buang → baca ulang bagian file ini yang relevan dengan milestone aktif → lanjutkan dari "Langkah berikut yang persis". Jangan mengulang pekerjaan yang sudah bertanda selesai.

## 1.3 Langkah pertama di M0

Selain isi M0 di Bagian 5, buat `CLAUDE.md` pendek (≤ 60 baris) berisi: satu paragraf proyek, perintah npm, aturan keras di 1.4, konvensi di 1.6, dan kalimat "Spesifikasi lengkap ada di BUMILAPIS.md. Di awal setiap sesi, jalankan prosedur lanjut di BUMILAPIS.md bagian 1.2." Buat juga `.claude/settings.json` yang mengizinkan perintah npm dan git lokal yang rutin serta menolak `git push`, bila format izinnya kamu yakini dari dokumentasi resmi.

## 1.4 Aturan keras

1. **Git lokal saja sampai pemilik berkata "Publikasikan".** `git init -b main` di M0. Sebelum kata itu: tanpa remote, tanpa push, tanpa membuat repositori.
2. **Jangan mengarang data ilmiah.** Angka dan fakta dari Bagian 3. Data di luar itu harus punya sumber di field `sources`; yang tidak terverifikasi diberi `verified: false` dan UI menampilkan label "perlu verifikasi".
3. **Bukan produk Google.** "Google Earth" hanya inspirasi interaksi. Tanpa nama, logo, tile, atau API Google. Tanpa API key, tanpa backend, tanpa akun.
4. **Skala harus jujur.** Atmosfer dan kerak sangat tipis dibanding jari-jari Bumi. Tampilan yang diperbesar wajib berlabel "skala diperbesar" dan ada mode "skala sebenarnya".
5. **Aset berlisensi jelas.** Tekstur hanya dari sumber domain publik (mis. NASA Blue Marble / Visible Earth); catat URL dan lisensi di `CREDITS.md`. Kalau unduhan gagal, pakai material prosedural dan lanjut.
6. Jangan mengubah `BUMILAPIS.md`.

## 1.5 Prioritas utama: 3D yang bagus dan interaksi yang gampang

Ini penentu kualitas proyek. Bila waktu atau kerumitan memaksa memilih, dahulukan dua hal ini di atas kelengkapan fitur sampingan (editor kolom, perbandingan kolom, kuis).

**Kualitas visual 3D (berlaku untuk globe, blok batuan, dan simulasi):**

- Bumi: tekstur siang beresolusi baik, peta malam (lampu kota) di sisi gelap, lapisan awan bergerak pelan, kilau laut (specular), relief halus (bump/normal), pendar atmosfer dengan shader hamburan/fresnel, latar bintang.
- Interior: tiap lapisan punya material yang terasa berbeda, bukan sekadar warna polos. Mantel bertekstur dengan gerak konveksi halus; inti luar tampak cair dan berpijar; inti dalam padat dan terang. Pakai shader/noise prosedural dan emisi.
- Pascaproses secukupnya (`@react-three/postprocessing`): bloom lembut untuk inti dan atmosfer, tone mapping, antialiasing. Pencahayaan konsisten dari satu arah Matahari.
- Permukaan potong tertutup rapi dengan penampang berlabel; tidak ada bagian berongga, z-fighting, atau tepi bergerigi.
- Semua perubahan dianimasikan: membuka potongan, mengupas lapisan, berpindah fokus, mengganti mode skala. Kamera "terbang" halus ke target (easing), tidak melompat.
- Label 3D menempel pada objek, selalu terbaca, tidak saling menumpuk, dan memudar saat terhalang.
- Blok batuan: pola litologi tajam, tepi lapisan jelas, bayangan lembut. Simulasi: partikel dan lapisan bergerak mulus.
- Turunkan kualitas otomatis di perangkat lemah (deteksi performa) tanpa menghilangkan fungsi.

**Interaksi yang gampang:**

- Satu aksi, satu gestur: seret untuk memutar, gulir/cubit untuk zoom, klik/ketuk untuk memilih. Tidak ada kombinasi tombol tersembunyi.
- Tombol besar berlabel jelas untuk aksi utama: **Belah**, **Kupas**, **Atur ulang tampilan**, **Skala sebenarnya/diperbesar**, **Tur**. Target sentuh ≥ 44 px.
- Hover menyorot lapisan dan menampilkan nama; klik membuka panel. Klik di ruang kosong menutup pilihan.
- Petunjuk singkat saat pertama dibuka (tiga langkah, bisa dilewati), dan tombol bantuan "?" yang menampilkan ulang.
- Selalu ada jalan pulang: tombol atur ulang kamera, tombol kembali, dan `Esc` menutup panel.
- Setiap slider menampilkan nilai dan satuan, punya tombol preset, dan bisa digerakkan dengan keyboard.
- Perpindahan antarmodul lewat tombol kontekstual ("Bor sumur di sini", "Lihat di kolom", "Interpretasikan kolom ini"), bukan hanya lewat menu.
- Sama nyamannya di ponsel: panel menjadi lembar bawah yang bisa digeser, kontrol tidak menutupi adegan.

**Periksa hasil dengan melihatnya.** Di tiap milestone yang punya tampilan 3D, jalankan aplikasinya, ambil tangkapan layar dengan Playwright (beberapa sudut dan keadaan: tertutup, terbelah, terkupas, lapisan terpilih, ponsel), **buka gambar itu dan nilai sendiri**: apakah indah, terbaca, dan bebas cacat render? Perbaiki sampai layak dipamerkan, baru lanjut. Simpan tangkapan terbaik di `docs/screenshots/` untuk README.

## 1.6 Stack dan konvensi

- Vite + React + TypeScript (strict); three.js lewat `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`; Zustand; React Router dengan **HashRouter**; Tailwind CSS; SVG buatan sendiri dengan `d3-scale`/`d3-shape`; Vitest + Testing Library; Playwright.
- `base: './'` di konfigurasi Vite, supaya hasil build jalan di subfolder mana pun (GitHub Pages) tanpa konfigurasi server.
- Pakai versi stabil terbaru; cek dokumentasi resmi bila API berbeda dari yang diingat.
- Perintah: `npm run dev`, `build` (tsc + vite build), `preview`, `lint`, `typecheck` (tsc --noEmit), `test` (vitest run), `e2e` (playwright).
- Bahasa UI Indonesia; teks UI dan konten lewat file data, tidak di-hardcode di komponen. Istilah teknis menyertakan padanan Inggris saat pertama muncul. Kode, nama variabel, dan komentar berbahasa Inggris.
- Angka disimpan sebagai number dengan satuan di nama field (`depthTopKm`, `tempC`, `pressureGPa`); tampilan memakai `Intl.NumberFormat('id-ID')`.
- Konten ilmiah di `src/content/` dan divalidasi skema Zod saat test. Logika simulasi dan interpretasi adalah fungsi murni di `src/lib/` dengan unit test. Komponen 3D di `src/scene/`, UI di `src/ui/`, halaman di `src/pages/`.
- Simulasi berat di Web Worker. Aksesibilitas: keyboard penuh, kontras AA, hormati `prefers-reduced-motion`, dan setiap tampilan 3D punya padanan teks.
- Target performa: 60 fps di laptop grafis terintegrasi, ≥ 30 fps di ponsel menengah; bundle awal < 500 kB gzip di luar tekstur; lazy-load per rute.
- Conventional Commits; tag `m0` … `m9` di akhir tiap milestone. `.gitignore`: `node_modules`, `dist`, `.env*`, `coverage`, `playwright-report`, `test-results`, `.DS_Store`.

## 1.7 Definisi selesai tiap milestone

Kriteria terima terpenuhi dan diperiksa sendiri satu per satu; `lint`, `typecheck`, `test`, `build` lolos; untuk milestone bertampilan 3D, pemeriksaan tangkapan layar di 1.5 sudah dilakukan; commit, tag, `docs/PROGRESS.md` diperbarui. Lalu **langsung lanjut** ke milestone berikutnya.

---

# Bagian 2 — PRD (Spesifikasi Produk)

## 1. Tujuan

Satu aplikasi web untuk belajar struktur Bumi secara menyeluruh, dari atas (atmosfer), tengah (permukaan, laut, kerak), sampai bawah (mantel, inti), lalu turun ke skala singkapan: lapisan batuan, kolom stratigrafi, proses sedimentasi, dan lingkungan pengendapan.

Pengguna sasaran: mahasiswa dan pelajar geosains, pengajar, dan orang awam yang penasaran. Setiap bagian harus memberi **informasi** (data, definisi) dan **insight** (mengapa penting, bagaimana kita tahu, kaitannya dengan bagian lain).

## 2. Struktur aplikasi

| Rute | Modul | Isi singkat |
|---|---|---|
| `/` | Jelajah Bumi | Globe 3D, potongan lapisan, panel info, perjalanan kedalaman |
| `/lapisan-batuan` | Lapisan Batuan 3D | Blok diagram strata dengan lipatan, sesar, ketidakselarasan |
| `/kolom` | Kolom Stratigrafi | Kolom interaktif, basis data formasi |
| `/formasi` | Formasi Batuan | Daftar dan detail formasi, terhubung ke kolom |
| `/sedimentasi` | Simulasi Sedimentasi | Pengisian cekungan dan tabung pengendapan |
| `/interpretasi` | Lingkungan Pengendapan | Mesin interpretasi dari ciri batuan |
| `/glosarium` | Glosarium | Istilah, pencarian |
| `/tentang` | Tentang | Sumber data, kredit, batasan model |

Navigasi utama selalu terlihat. Pencarian global (Ctrl/⌘+K) mencari lapisan, formasi, istilah, dan lingkungan pengendapan.

## 3. Modul A — Jelajah Bumi (globe 3D)

### 3.1 Interaksi

- Putar (drag), zoom (scroll/pinch), geser. Rotasi otomatis pelan yang berhenti saat disentuh.
- **Potongan (cutaway):** irisan baji yang bisa dibuka 0–180° memperlihatkan lapisan konsentris. Alternatif: mode "belah dua" dan mode "kupas" (explode) yang memisahkan tiap lapisan sebagai cangkang.
- **Klik atau hover lapisan** → sorot lapisan, tampilkan nama, buka panel info.
- **Daftar lapisan** di sisi kiri (urut dari eksosfer ke inti dalam), tiap baris punya tombol tampil/sembunyi dan fokus. Daftar ini juga jalur akses keyboard.
- **Perjalanan kedalaman:** slider vertikal dari +10000 km (eksosfer) sampai −6371 km (pusat). Kamera/penanda bergerak, dan kartu baca-langsung menampilkan: ketinggian/kedalaman, lapisan aktif, suhu, tekanan, densitas, wujud materi. Nilai diinterpolasi dari tabel profil di Bagian 3. Skala slider tidak linear (piecewise) supaya atmosfer dan kerak tidak terhimpit.
- **Mode skala:** "sebenarnya" dan "diperbesar". Mode diperbesar menebalkan atmosfer, laut, dan kerak agar terlihat, dengan label jelas.
- **Mode pengelompokan interior:** "komposisi" (kerak, mantel, inti) dan "mekanis" (litosfer, astenosfer, mesosfer, inti luar, inti dalam). Tombol alih.
- Lapisan tambahan yang bisa dinyalakan: batas lempeng tektonik (garis sederhana), magnetosfer (garis medan skematis), lapisan ozon, garis Kármán, penanda bidang diskontinuitas (Moho, 410, 660, Gutenberg, Lehmann).
- Penanda pembanding skala: Everest, Palung Mariana, lubang bor Kola, ketinggian jelajah pesawat, ISS.

### 3.2 Panel info lapisan

Tiap lapisan (lihat daftar lengkap di Bagian 3) punya tab:

1. **Ringkasan** — 2–3 kalimat, satu fakta kunci.
2. **Data** — rentang kedalaman/ketinggian, ketebalan, suhu, tekanan, densitas, wujud, persen volume/massa Bumi bila relevan.
3. **Komposisi** — unsur/mineral/gas utama, dengan diagram batang kecil.
4. **Insight** — minimal 3 butir: mengapa penting, kaitan dengan lapisan lain, hal yang mengejutkan.
5. **Bagaimana kita tahu** — bukti (seismologi, eksperimen tekanan tinggi, meteorit, satelit, pengeboran).
6. **Sumber** — daftar rujukan.

Tombol "sebelumnya/berikutnya" berpindah ke lapisan di atas/bawah.

### 3.3 Kriteria terima

- Semua lapisan di Bagian 3 ada, bisa diklik, dan panelnya terisi penuh di keenam tab.
- Slider kedalaman menampilkan nilai yang cocok dengan tabel profil (toleransi interpolasi).
- Pergantian mode skala dan mode pengelompokan tidak merusak sorotan atau panel.
- Bisa dioperasikan penuh lewat keyboard melalui daftar lapisan.

## 4. Modul B — Visualisasi lapisan batuan 3D

Blok diagram 3D (kotak irisan kerak) berisi tumpukan lapisan sedimen berwarna dan berpola sesuai litologi.

- Putar/zoom blok; klik lapisan untuk info (litologi, umur, tebal, lingkungan pengendapan).
- **Skenario siap pakai:** datar (layer-cake), miring, antiklin, sinklin, sesar normal, sesar naik, sesar geser, ketidakselarasan bersudut, intrusi (dike/sill), urutan transgresi–regresi.
- **Kontrol deformasi:** slider kemiringan, amplitudo dan panjang gelombang lipatan, besar pergeseran sesar, tingkat erosi permukaan.
- **Bidang iris:** bidang potong yang bisa digeser dan diputar untuk melihat penampang.
- **Sumur virtual:** klik titik di permukaan blok → bor sumur → urutan lapisan di titik itu dikirim ke modul Kolom Stratigrafi.
- **Mode urutan kejadian:** putar ulang sejarah blok langkah demi langkah (endapkan, lipat, patahkan, erosi, endapkan lagi) untuk mengajarkan prinsip superposisi, potong-memotong, dan ketidakselarasan. Ada kuis kecil "urutkan kejadian".

Kriteria terima: semua skenario dirender benar, sumur virtual menghasilkan kolom yang konsisten dengan geometri (termasuk pengulangan lapisan pada sesar naik dan hilangnya lapisan pada sesar normal).

## 5. Modul C — Kolom stratigrafi interaktif

Kolom digambar dengan SVG.

- Sumbu vertikal: kedalaman/ketebalan (m), bisa di-zoom dan digeser. Kolom umur (sistem/seri) di kiri dengan warna skala waktu geologi.
- Lebar tiap lapisan mengikuti **ukuran butir** (profil lempung → lanau → pasir halus/sedang/kasar → kerikil), sehingga pola menghalus/mengasar ke atas terlihat.
- **Pola litologi** SVG untuk: batupasir, batulanau, serpih/batulempung, konglomerat, breksi, batugamping, dolomit, napal, batubara, rijang, evaporit, tuf/vulkaniklastik, batuan beku, batuan metamorf. Legenda selalu tersedia.
- Simbol struktur sedimen dan fosil di kolom samping (silang-siur, laminasi sejajar, gelembur, perlapisan bersusun, bioturbasi, rekah kerut, foraminifera, moluska, sisa tumbuhan, koral).
- Jenis kontak: tegas, berangsur, erosional, ketidakselarasan (garis bergelombang).
- **Klik lapisan** → panel detail: litologi, deskripsi, tebal, umur, struktur, fosil, formasi, interpretasi lingkungan, catatan.
- **Sumber kolom:** (a) kolom contoh bawaan, (b) kolom dari sumur virtual Modul B, (c) kolom hasil simulasi Modul D, (d) **editor**: tambah/hapus/urutkan lapisan lewat formulir, (e) impor/ekspor JSON.
- Ekspor gambar SVG/PNG. Tombol "Interpretasikan kolom ini" mengirim ke Modul E.
- Bandingkan dua kolom berdampingan dengan garis korelasi yang bisa ditarik pengguna.

Kriteria terima: kolom contoh tampil dengan pola, profil butir, dan kontak yang benar; editor menghasilkan JSON yang valid terhadap skema; impor → ekspor menghasilkan data identik.

## 6. Modul C2 — Informasi formasi batuan

- Daftar formasi dengan filter: cekungan, umur, litologi dominan, lingkungan pengendapan.
- Halaman detail: nama, cekungan/lokasi, umur, tebal (rentang), litologi, lingkungan pengendapan, hubungan stratigrafi (di atas/di bawah, selaras/tidak), nilai ekonomi (reservoir, batuan induk, batubara, akuifer), lokasi tipe bila ada, sumber.
- Tombol "lihat di kolom" menyorot formasi itu di kolom cekungannya.
- Data awal: satu cekungan Indonesia sebagai studi kasus (lihat Bagian 3) plus satu kolom ajar generik. Struktur data harus memudahkan penambahan cekungan lain.
- Setiap entri punya `sources` dan `verified`. Entri `verified: false` tampil dengan label "perlu verifikasi".

## 7. Modul D — Simulasi proses sedimentasi

Dua simulasi, keduanya punya tombol putar/jeda/langkah/atur ulang dan pengatur kecepatan.

### D1. Pengisian cekungan (penampang 2D)

Penampang dari darat ke laut. Sedimen masuk dari sisi darat, diangkut, dan mengendap; muka laut naik-turun; dasar cekungan menurun.

- Parameter: pasokan sedimen, amplitudo dan periode muka laut, laju penurunan (subsidence), kemiringan awal, durasi.
- Tampilan: profil permukaan, muka laut, lapisan yang terbentuk diwarnai menurut fasies, garis waktu tiap selang tertentu.
- Grafik pendamping: kurva muka laut terhadap waktu dan posisi garis pantai (lintasan garis pantai) sehingga progradasi, retrogradasi, dan agradasi terlihat.
- Preset: "progradasi delta", "transgresi", "siklus muka laut", "pasokan rendah".
- **Sumur virtual:** klik posisi mana pun → kolom stratigrafi sintetis dikirim ke Modul C.
- Kotak penjelasan yang berubah mengikuti keadaan simulasi ("garis pantai mundur karena muka laut naik lebih cepat daripada pasokan sedimen").

### D2. Tabung pengendapan dan saluran arus

- **Tabung pengendapan:** campuran butir berbagai ukuran dijatuhkan dalam kolom air; butir kasar turun lebih cepat sehingga terbentuk perlapisan bersusun. Kecepatan jatuh dihitung dari rumus di Bagian 4.
- **Saluran arus:** slider kecepatan arus dan ukuran butir; penanda bergerak di diagram Hjulström menunjukkan apakah butir tererosi, terangkut, atau mengendap, dan animasi partikel mengikutinya.

Kriteria terima: preset menghasilkan pola yang benar secara kualitatif (progradasi → kolom mengasar ke atas di sumur virtual; transgresi → menghalus ke atas); massa sedimen terjaga dalam toleransi yang diuji; simulasi tetap ≥ 30 fps.

## 8. Modul E — Interpretasi lingkungan pengendapan

Mesin berbasis aturan yang transparan (bukan AI, bukan kotak hitam).

- **Masukan lewat formulir:** litologi, ukuran butir, pemilahan, kebundaran, struktur sedimen, fosil/jejak, warna, geometri tubuh batuan, pola vertikal (menghalus/mengasar ke atas, seragam, siklik), kehadiran batubara/evaporit/karbonat.
- **Masukan dari kolom:** menerima kolom dari Modul C dan menafsirkan tiap interval serta urutan fasiesnya.
- **Keluaran:** tiga lingkungan teratas dengan skor, **bukti pendukung**, **bukti yang bertentangan**, dan **data yang sebaiknya dicari** untuk membedakan kandidat.
- Kartu tiap lingkungan: deskripsi, ciri diagnostik, urutan vertikal khas (dengan kolom mini), blok diagram sederhana, contoh formasi.
- Untuk kolom: tampilkan interpretasi per interval di samping kolom, tren kedalaman air relatif, dan tandai transgresi/regresi. Gunakan Hukum Walther untuk memeriksa kewajaran urutan dan beri peringatan bila dua fasies bertetangga tidak wajar tanpa bidang erosi.
- Pernyataan batasan tampil jelas: hasil bersifat edukatif dan interpretasi nyata membutuhkan data lapangan.

Kriteria terima: kasus uji di Bagian 4 (mis. urutan Bouma → kipas bawah laut; batubara + mengasar ke atas → delta) memberi kandidat teratas yang benar; setiap skor bisa ditelusuri ke aturan yang menyumbangnya.

## 9. Glosarium dan pembelajaran

- Glosarium ≥ 80 istilah dengan definisi singkat dan tautan ke modul terkait. Istilah di dalam teks konten otomatis bertaut ke glosarium.
- "Tur terpandu" di Modul A: 8–10 langkah dari eksosfer ke inti dalam.
- Kuis singkat per modul (pilihan ganda, 5 soal) dengan penjelasan jawaban.

## 10. Non-fungsional

- Berjalan di Chrome, Edge, Firefox, Safari versi terbaru; layar ≥ 360 px. Di ponsel, panel info menjadi lembar bawah.
- Tanpa WebGL: tampilkan cadangan berupa penampang 2D SVG dan seluruh konten tetap terbaca.
- Mode terang/gelap. Status tampilan penting tersimpan di URL (lapisan terpilih, preset) agar bisa dibagikan.
- Offline setelah dimuat; tidak ada pelacakan atau analitik.

## 11. Di luar lingkup (versi awal)

Citra satelit beresolusi tinggi dan medan 3D kota, data gempa waktu nyata, akun pengguna, backend, penyuntingan kolaboratif, data sumur asli berlisensi.

---

# Bagian 3 — Konten Ilmiah

Bagian ini adalah sumber data awal. Angka ditulis tanpa pemisah ribuan dan memakai titik sebagai desimal; UI memformat dengan lokal `id-ID`. Banyak nilai interior Bumi berupa perkiraan dengan ketidakpastian besar (terutama suhu); tampilkan sebagai rentang dan beri keterangan "perkiraan".

Jari-jari rata-rata Bumi: **6371 km**.

## A. Atmosfer (ketinggian di atas muka laut)

| Lapisan | Rentang (km) | Suhu | Ciri utama |
|---|---|---|---|
| Troposfer | 0 – ~12 (≈8 di kutub, ≈18 di khatulistiwa) | 15 °C di permukaan turun ≈6.5 °C/km sampai ≈ −56 °C | Cuaca, awan, hampir semua uap air; ≈75–80% massa atmosfer |
| Stratosfer | ~12 – 50 | naik sampai ≈ −3 °C di stratopause | Lapisan ozon (≈15–35 km) menyerap UV; udara stabil berlapis |
| Mesosfer | 50 – ~85 | turun sampai ≈ −85 s.d. −90 °C (titik terdingin atmosfer) | Meteor terbakar; awan noktilusen |
| Termosfer | ~85 – ~600 | naik hingga 500–2000 °C tergantung aktivitas Matahari | Aurora; ISS (≈400 km); garis Kármán 100 km |
| Eksosfer | ~600 – ~10000 | tidak bermakna secara biasa | H dan He sangat renggang; atom bisa lepas ke antariksa |

Lapisan fungsional yang tumpang-tindih:

- **Ionosfer** (≈60–1000 km): gas terionisasi oleh radiasi Matahari; lapisan D, E, F; memantulkan gelombang radio; tempat aurora.
- **Lapisan ozon** (≈15–35 km): konsentrasi O₃ tertinggi; menyerap sebagian besar UV-B dan UV-C.
- **Magnetosfer**: gelembung medan magnet Bumi, ≈10 jari-jari Bumi (≈65000 km) ke arah Matahari dan ekor panjang di sisi malam; membelokkan angin Matahari; berasal dari geodinamo di inti luar.

Komposisi udara kering (volume): N₂ 78.08%, O₂ 20.95%, Ar 0.93%, CO₂ ≈0.04% (terus naik), sisanya gas jejak. Tekanan muka laut 1013.25 hPa; kira-kira separuhnya pada ≈5.5 km; ≈1 hPa pada ≈50 km.

Insight yang wajib masuk:

- Atmosfer sangat tipis: 99% massanya berada di bawah ≈30 km, kurang dari 0.5% jari-jari Bumi.
- Suhu berbalik arah di tiap batas (tropopause, stratopause, mesopause) karena sumber panasnya berbeda: permukaan Bumi (troposfer), penyerapan UV oleh ozon (stratosfer), penyerapan radiasi berenergi tinggi (termosfer).
- Termosfer "panas" tetapi akan terasa dingin: molekulnya sangat cepat namun terlalu jarang untuk memindahkan panas.
- Mesosfer adalah lapisan yang paling sedikit diteliti: terlalu tinggi untuk balon, terlalu rendah untuk satelit.
- Tinggi tropopause berbeda antara kutub dan khatulistiwa karena pemanasan dan konveksi yang lebih kuat di tropis.
- Tanpa efek rumah kaca alami, suhu rata-rata permukaan sekitar −18 °C, bukan ≈15 °C.

## B. Permukaan: hidrosfer, kriosfer, biosfer

**Lautan** menutupi ≈71% permukaan; kedalaman rata-rata ≈3700 m; titik terdalam Challenger Deep, Palung Mariana, ≈10900 m. ≈97% air Bumi asin; dari air tawar, sebagian besar berupa es dan air tanah.

| Zona laut | Kedalaman (m) | Ciri |
|---|---|---|
| Epipelagik | 0 – 200 | Cahaya cukup untuk fotosintesis |
| Mesopelagik | 200 – 1000 | Remang; termoklin |
| Batipelagik | 1000 – 4000 | Gelap total, ≈4 °C |
| Abisopelagik | 4000 – 6000 | Dataran abisal |
| Hadal | > 6000 | Palung |

Morfologi dasar laut untuk penampang: paparan benua (0–≈200 m), lereng benua, kaki benua, dataran abisal, punggungan tengah samudra, palung.

**Kriosfer**: lapisan es Antartika dan Greenland, gletser, es laut, permafrost. **Biosfer**: kehidupan dari beberapa kilometer di bawah permukaan (mikroba dalam batuan) sampai troposfer bagian atas. Tinggi Everest ≈8849 m.

Insight: jika Bumi sebesar bola basket, lautan lebih tipis daripada selembar kertas; lautan menyimpan panas jauh lebih banyak daripada atmosfer; paparan benua adalah tempat sebagian besar sedimen laut dangkal diendapkan, penghubung ke modul sedimentasi.

## C. Interior Bumi

### C1. Pembagian berdasarkan komposisi

| Lapisan | Kedalaman (km) | Komposisi | Wujud | Catatan |
|---|---|---|---|---|
| Kerak benua | 0 – ≈35 (rata-rata 30–50, sampai ≈70 di bawah pegunungan besar) | Granitik/felsik, kaya Si dan Al; densitas ≈2.7 g/cm³ | Padat | Batuan tertua ≈4.0 miliar tahun |
| Kerak samudra | 0 – ≈7 (5–10) | Basalt dan gabro; densitas ≈3.0 g/cm³ | Padat | Tidak lebih tua dari ≈180–200 juta tahun karena menunjam |
| Mantel atas | Moho – 410 | Peridotit (olivin, piroksen) | Padat, mengalir sangat lambat | Mencakup mantel litosfer dan astenosfer |
| Zona transisi | 410 – 660 | Olivin berubah menjadi wadsleyit lalu ringwoodit | Padat | Dapat menyimpan air dalam struktur mineral |
| Mantel bawah | 660 – 2891 | Bridgmanit dan ferroperiklas | Padat, mengalir lambat | Lapisan D″ ≈200 km terbawah |
| Inti luar | 2891 – 5150 | Besi-nikel cair dengan unsur ringan (S, O, Si) | **Cair** | Sumber medan magnet (geodinamo) |
| Inti dalam | 5150 – 6371 | Besi-nikel | **Padat** | Jari-jari ≈1220 km |

Proporsi: kerak ≈1% volume (<1% massa); mantel ≈84% volume (≈67% massa); inti ≈15% volume (≈32% massa).

### C2. Pembagian berdasarkan sifat mekanis

| Lapisan | Kedalaman (km) | Sifat |
|---|---|---|
| Litosfer | 0 – ≈100 (lebih tipis di samudra muda, >200 di bawah kraton) | Kaku; kerak + mantel paling atas; terpecah menjadi lempeng |
| Astenosfer | ≈100 – ≈410 (zona kecepatan rendah paling jelas ≈80–200) | Padat tetapi lemah dan plastis; lempeng bergeser di atasnya |
| Mesosfer (mantel bawah) | ≈660 – 2891 | Lebih kaku karena tekanan |
| Inti luar | 2891 – 5150 | Cair |
| Inti dalam | 5150 – 6371 | Padat |

### C3. Bidang diskontinuitas

| Nama | Kedalaman (km) | Arti |
|---|---|---|
| Mohorovičić (Moho) | ≈7 (samudra), ≈35 (benua) | Batas kerak–mantel; ditemukan 1909 |
| 410 km | 410 | Olivin → wadsleyit |
| 660 km | 660 | Ringwoodit → bridgmanit + ferroperiklas |
| Gutenberg | 2891 | Batas mantel–inti; gelombang S berhenti |
| Lehmann | ≈5150 | Batas inti luar–inti dalam; diusulkan Inge Lehmann 1936 |

### C4. Tabel profil untuk slider kedalaman

Densitas dan tekanan mengikuti model PREM (Dziewonski & Anderson, 1981). Suhu adalah perkiraan; tampilkan dengan tanda "≈". Pada diskontinuitas ada dua nilai densitas (atas → bawah); jangan diinterpolasi melewati batas.

| Kedalaman (km) | Densitas (g/cm³) | Tekanan (GPa) | Suhu (°C, perkiraan) |
|---|---|---|---|
| 0 | 2.6 | 0 | 15 |
| 35 (Moho benua) | 2.9 → 3.38 | ≈1 | 500 – 900 |
| 410 | 3.54 → 3.72 | 13.4 | ≈1400 – 1500 |
| 660 | 3.99 → 4.38 | 23.8 | ≈1600 |
| 2891 | 5.57 → 9.90 | 136 | ≈3500 – 4000 |
| 5150 | 12.17 → 12.76 | 329 | ≈5000 – 5700 |
| 6371 | 13.09 | 364 | ≈5200 – 5700 |

Untuk atmosfer, gunakan Atmosfer Standar: 0 km (15 °C, 1013 hPa), 11 km (−56.5 °C, 226 hPa), 20 km (−56.5 °C, 55 hPa), 32 km (−44.5 °C, 8.7 hPa), 47 km (−2.5 °C, 1.1 hPa), 51 km (−2.5 °C, 0.67 hPa), 71 km (−58.5 °C, 0.04 hPa), 85 km (≈ −86 °C, ≈0.004 hPa).

### C5. Insight interior yang wajib masuk

- Inti dalam lebih panas daripada inti luar tetapi padat, karena tekanan sangat tinggi menaikkan titik leleh besi. Suhunya sebanding dengan permukaan Matahari.
- Inti dalam tumbuh perlahan (orde 1 mm per tahun) seiring Bumi mendingin; panas laten dan pelepasan unsur ringan saat pembekuan ikut menggerakkan konveksi inti luar.
- Mantel itu **padat**, bukan lautan magma. Ia mengalir beberapa sentimeter per tahun dalam skala waktu geologi; konveksi mantel menggerakkan tektonik lempeng.
- Magma hanya terbentuk di tempat tertentu: penurunan tekanan (punggungan tengah samudra, hotspot) atau penambahan air (zona subduksi).
- Tidak ada yang pernah mengebor sampai mantel. Lubang terdalam, Kola Superdeep, ≈12.3 km: sekitar 0.2% jari-jari Bumi.
- Kerak samudra muda karena terus dibuat di punggungan dan dihancurkan di zona subduksi; kerak benua lebih ringan sehingga bertahan.
- Lapisan D″ di dasar mantel sangat heterogen; diduga tempat lempeng tua berakhir dan tempat lahirnya plume mantel.
- Medan magnet dari inti luar melindungi atmosfer dari angin Matahari: contoh hubungan langsung "paling bawah" dan "paling atas".

### C6. Bagaimana kita tahu

- **Gelombang seismik:** gelombang P merambat di padat dan cair, gelombang S hanya di padat. Zona bayangan gelombang S (lebih dari ≈104° dari pusat gempa) membuktikan inti luar cair; zona bayangan P (≈104°–140°) akibat pembiasan di inti. Pantulan dan perubahan kecepatan menandai diskontinuitas.
- **Eksperimen tekanan tinggi** (sel landasan intan) meniru kondisi mantel dan inti untuk menentukan fase mineral.
- **Meteorit:** kondrit sebagai komposisi awal; meteorit besi sebagai analog inti.
- **Massa dan momen inersia Bumi:** densitas rata-rata 5.51 g/cm³ jauh di atas batuan permukaan, jadi bagian dalam harus jauh lebih padat.
- **Xenolit dan ofiolit:** potongan mantel dan kerak samudra yang terbawa ke permukaan.
- **Medan magnet dan paleomagnetisme**, serta **gravitasi dan tomografi seismik**.

## D. Stratigrafi

### D1. Prinsip dasar

Superposisi, horizontalitas asal, dan kesinambungan lateral (Steno); hubungan potong-memotong; inklusi; suksesi fauna (William Smith); **Hukum Walther** (fasies yang bertumpuk secara selaras dulu diendapkan bersebelahan).

Jenis ketidakselarasan: bersudut (angular unconformity), disconformity, nonconformity, paraconformity. Satuan litostratigrafi: grup > formasi > anggota > lapisan.

### D2. Skala ukuran butir (Udden–Wentworth)

| Kelas | Diameter (mm) |
|---|---|
| Bongkah | > 256 |
| Kerakal | 64 – 256 |
| Kerikil | 4 – 64 |
| Granul | 2 – 4 |
| Pasir sangat kasar / kasar / sedang / halus / sangat halus | 1–2 / 0.5–1 / 0.25–0.5 / 0.125–0.25 / 0.0625–0.125 |
| Lanau | 0.0039 – 0.0625 |
| Lempung | < 0.0039 |

### D3. Studi kasus formasi: Cekungan Sumatra Selatan

Urutan dari tua ke muda. Umur dan lingkungan adalah ringkasan umum dari literatur; ketebalan sangat bervariasi antarlokasi. Claude Code harus memverifikasi tiap entri dengan sumber (mis. De Coster, 1974; Bishop, 2001, USGS Open-File Report 99-50-S; publikasi IPA) dan mengisi `sources`. Entri yang belum terverifikasi diberi `verified: false`.

| Formasi | Umur | Litologi utama | Lingkungan pengendapan | Catatan |
|---|---|---|---|---|
| Batuan dasar | Pra-Tersier | Batuan beku, metamorf, sedimen termalihkan | — | Dipisahkan ketidakselarasan dari sedimen Tersier |
| Lahat (Lemat) | Eosen – Oligosen | Tuf, breksi, konglomerat, batupasir, serpih | Darat: kipas aluvial, sungai, danau (fase rift) | Serpih danau sebagai batuan induk |
| Talang Akar | Oligosen Akhir – Miosen Awal | Batupasir, serpih, sisipan batubara | Sungai–delta sampai laut dangkal | Reservoir dan batuan induk utama |
| Baturaja | Miosen Awal | Batugamping terumbu dan paparan | Paparan karbonat laut dangkal | Reservoir karbonat |
| Gumai | Miosen Awal – Tengah | Serpih laut, napal, sisipan batupasir | Laut terbuka; puncak transgresi | Batuan penutup regional |
| Air Benakat | Miosen Tengah | Batupasir, batulempung | Laut dangkal; awal regresi | Reservoir |
| Muara Enim | Miosen Akhir – Pliosen | Batulempung, batupasir, **batubara** tebal | Delta, rawa, dataran pantai | Sumber batubara utama |
| Kasai | Pliosen – Pleistosen | Tuf, batupasir tufan, batulempung | Darat, dipengaruhi vulkanisme | Diendapkan saat pengangkatan Bukit Barisan |

Cerita yang harus muncul di UI: urutan ini merekam satu siklus besar **transgresi** (darat → delta → karbonat → laut terbuka di Gumai) lalu **regresi** (laut dangkal → delta/rawa → darat). Ini contoh nyata Hukum Walther dan penghubung ke Modul D dan E.

### D4. Kolom ajar generik

Sediakan satu kolom rekaan berlabel "contoh ajar" (≈150 m, 15–20 lapisan) yang memuat: urutan sungai menghalus ke atas dengan dasar erosional, urutan delta mengasar ke atas dengan batubara di puncak, selang karbonat, satu ketidakselarasan, dan satu paket turbidit dengan urutan Bouma.

## E. Proses sedimentasi

- Siklus: pelapukan → erosi → transportasi → pengendapan → pembebanan → diagenesis (kompaksi, sementasi) → batuan sedimen.
- Agen transportasi: air mengalir, gelombang dan pasang surut, angin, es, gravitasi (aliran debris, arus turbid).
- **Diagram Hjulström:** hubungan kecepatan arus dan ukuran butir dengan erosi, transportasi, pengendapan. Pasir halus paling mudah tererosi; lempung butuh arus lebih kuat untuk tererosi karena kohesif, tetapi sekali terangkat tetap melayang pada arus lemah.
- **Kecepatan jatuh:** Hukum Stokes berlaku untuk butir halus (lanau, lempung); untuk pasir dan lebih kasar gunakan persamaan Ferguson & Church (2004). Rumus di Bagian 4.
- Ruang akomodasi = perubahan muka laut + penurunan cekungan. Perbandingannya dengan pasokan sedimen menentukan **progradasi** (pasokan > akomodasi; garis pantai maju; mengasar ke atas), **retrogradasi** (akomodasi > pasokan; garis pantai mundur; menghalus ke atas), **agradasi** (seimbang).
- Kematangan tekstur: makin jauh terangkut, butir makin bundar dan terpilah baik.

## F. Lingkungan pengendapan dan ciri diagnostiknya

| Lingkungan | Litologi dan tekstur | Struktur sedimen | Fosil / penciri | Pola vertikal dan geometri |
|---|---|---|---|---|
| Kipas aluvial | Konglomerat, breksi; pemilahan buruk, menyudut | Masif, perlapisan kasar, aliran debris | Jarang; oksidasi merah | Baji menebal ke arah sumber |
| Sungai teranyam | Batupasir kasar, konglomerat | Silang-siur palung dan planar | Jarang; sisa kayu | Lembaran pasir bertumpuk, sedikit lumpur |
| Sungai bermeander | Batupasir halus–sedang, lanau, lempung dataran banjir | Silang-siur, gelembur, dasar erosional, rekah kerut, akar | Sisa tumbuhan, tanah purba | **Menghalus ke atas** (gosong tanjung); tubuh pasir melensa |
| Danau | Serpih berlaminasi, lanau, karbonat, evaporit | Laminasi halus, varve | Fosil air tawar, alga | Tipis, menerus, sering siklik |
| Gurun (eolian) | Batupasir halus–sedang, terpilah sangat baik, bundar, permukaan buram | Silang-siur skala besar bersudut tinggi | Sangat jarang; jejak | Tebal, seragam |
| Glasial | Tilit/diamiktit; pemilahan sangat buruk | Masif; dropstone; goresan pada kerakal | Jarang | Tidak teratur |
| Delta | Lempung prodelta → lanau → batupasir muka delta → batubara dataran delta | Silang-siur, gelembur, bioturbasi, struktur beban | Sisa tumbuhan, **batubara**, campuran fauna laut dan payau | **Mengasar ke atas**; lobus |
| Estuari / dataran pasang surut | Pasir dan lumpur berselingan | Flaser, lentikular, silang-siur tulang ikan (herringbone), tirai lumpur | Fauna payau, bioturbasi | Menghalus ke atas |
| Pantai / muka pantai | Batupasir terpilah baik, matang | Laminasi sejajar bersudut rendah, silang-siur hummocky di bagian bawah | Cangkang, jejak Skolithos | **Mengasar ke atas**; memanjang sejajar pantai |
| Laguna | Lempung gelap, lanau, kadang evaporit atau karbonat | Laminasi, bioturbasi | Fauna terbatas | Di belakang penghalang |
| Paparan laut dangkal | Lempung, lanau, pasir halus; glaukonit | Hummocky (badai), bioturbasi kuat | Fauna laut beragam | Lembaran luas |
| Paparan karbonat / terumbu | Batugamping (boundstone, grainstone, wackestone), dolomit | Masif (terumbu), ooid, silang-siur | Koral, alga, foraminifera besar | Perairan hangat, jernih, dangkal |
| Lereng / kipas bawah laut | Batupasir dan serpih berselingan (turbidit) | **Urutan Bouma** (Ta–Te), perlapisan bersusun, cetakan suling dan beban | Fauna laut dalam, sering terpindahkan | Lobus dan saluran; ritmis |
| Laut dalam (pelagik) | Lempung merah, rijang, napal, kapur pelagik | Laminasi sangat halus | Radiolaria, foraminifera planktonik, nanofosil | Tipis, sangat menerus, laju endap sangat rendah |

Petunjuk tambahan: warna merah menandakan oksidasi (umumnya darat); abu-abu gelap/hitam menandakan kondisi reduksi dan bahan organik; glaukonit menandakan laut; batubara menandakan rawa; evaporit menandakan iklim kering dan sirkulasi terbatas.

Urutan Bouma: Ta (pasir masif/bersusun), Tb (laminasi sejajar), Tc (gelembur, konvolut), Td (laminasi lanau halus), Te (lumpur pelagik/hemipelagik).

## G. Glosarium minimum

Sertakan setidaknya: akomodasi, agradasi, astenosfer, bioturbasi, diagenesis, diskontinuitas, eustasi, fasies, formasi, geodinamo, Hukum Walther, ketidakselarasan, litosfer, litologi, Moho, pemilahan, progradasi, regresi, retrogradasi, silang-siur, subsidence, superposisi, transgresi, turbidit, urutan Bouma, serta semua nama lapisan dan lingkungan pengendapan di atas.

## H. Rujukan awal

- Dziewonski, A. M. & Anderson, D. L. (1981). Preliminary Reference Earth Model. *Physics of the Earth and Planetary Interiors*, 25.
- U.S. Standard Atmosphere (1976). NOAA/NASA/USAF.
- Ferguson, R. I. & Church, M. (2004). A simple universal equation for grain settling velocity. *Journal of Sedimentary Research*, 74.
- Boggs, S. *Principles of Sedimentology and Stratigraphy*.
- Nichols, G. *Sedimentology and Stratigraphy*.
- Bishop, M. G. (2001). South Sumatra Basin Province, Indonesia. USGS Open-File Report 99-50-S.
- De Coster, G. L. (1974). The geology of the Central and South Sumatra Basins. Proceedings IPA.
- International Chronostratigraphic Chart (ICS) untuk umur dan warna skala waktu.
- FGDC Digital Cartographic Standard for Geologic Map Symbolization (acuan gaya pola litologi; gambar pola sendiri).
- NASA Visible Earth / Blue Marble untuk tekstur.

---

# Bagian 4 — Arsitektur Teknis

## 1. Struktur folder

```
bumi-lapis/
├─ BUMILAPIS.md         # file ini
├─ CLAUDE.md            # dibuat di M0, pendek
├─ README.md            # dibuat di M0, dilengkapi di M8
├─ CREDITS.md           # sumber aset dan lisensi
├─ docs/                # PROGRESS.md, screenshots/, PUBLIKASI.md
├─ public/textures/     # tekstur Bumi (domain publik)
├─ src/
│  ├─ main.tsx, App.tsx, routes.tsx
│  ├─ content/          # data ilmiah (ts/json) + skema Zod
│  │  ├─ layers.ts          # atmosfer, hidrosfer, interior
│  │  ├─ profiles.ts        # tabel suhu/tekanan/densitas
│  │  ├─ lithologies.ts     # litologi + pola + warna
│  │  ├─ formations.ts      # formasi batuan
│  │  ├─ columns/           # kolom stratigrafi (json)
│  │  ├─ environments.ts    # lingkungan pengendapan + aturan
│  │  ├─ glossary.ts, quizzes.ts, tour.ts
│  │  └─ schema.ts
│  ├─ lib/              # logika murni, teruji
│  │  ├─ profile/           # interpolasi profil, skala slider
│  │  ├─ strata/            # geometri lapisan, lipatan, sesar, sumur virtual
│  │  ├─ sedsim/            # simulasi cekungan, kecepatan jatuh, Hjulström
│  │  ├─ interpret/         # mesin interpretasi lingkungan
│  │  └─ units.ts, format.ts
│  ├─ scene/            # komponen react-three-fiber
│  │  ├─ earth/             # Globe, LayerShell, Cutaway, Atmosphere, Markers
│  │  └─ strata/            # StrataBlock, SlicePlane, Well
│  ├─ ui/               # panel, tab, slider, legenda, pencarian
│  ├─ pages/            # satu folder per rute
│  ├─ store/            # zustand
│  ├─ workers/          # sedsim.worker.ts
│  └─ styles/
└─ tests/               # e2e playwright
```

## 2. Rancangan globe 3D

- Setiap lapisan adalah cangkang bola (`SphereGeometry`) dengan jari-jari tampilan dari fungsi `displayRadius(layer, scaleMode)`.
  - Mode **sebenarnya**: jari-jari proporsional terhadap kilometer.
  - Mode **diperbesar**: pemetaan piecewise sehingga atmosfer, laut, dan kerak mendapat ketebalan visual minimum. Simpan tabel pemetaan di `lib/profile/scale.ts` dan uji bahwa fungsinya monoton.
- **Potongan:** gunakan clipping plane (`renderer.localClippingEnabled`) dengan dua bidang yang membentuk baji; permukaan potong ditutup dengan penampang 2D (cincin berwarna per lapisan) supaya tidak terlihat berongga. Alternatif yang dapat diterima: geometri bola parsial memakai `phiStart/phiLength`.
- Permukaan: tekstur siang Blue Marble (2k di ponsel, 4k di desktop, dimuat malas), lapisan awan opsional, pendar atmosfer dengan shader fresnel sederhana.
- Atmosfer: cangkang transparan dengan gradasi; interior: material berwarna dengan emisi untuk mantel dan inti, animasi halus konveksi (opsional) yang mati pada `prefers-reduced-motion`.
- Pemilihan objek lewat raycasting event r3f; state `selectedLayerId`, `hoveredLayerId`, `scaleMode`, `groupingMode`, `cutAngle`, `depthKm` di Zustand dan disinkronkan ke query string.
- Cadangan tanpa WebGL: komponen `CrossSection2D` (SVG) memakai data yang sama.

Palet warna lapisan ditetapkan sekali di `content/layers.ts` dan dipakai konsisten di globe, penampang, daftar, dan grafik. Jangan mengandalkan warna saja; selalu ada label.

## 3. Skema data (TypeScript, divalidasi Zod)

```ts
type Source = { title: string; author?: string; year?: number; url?: string };

type EarthLayer = {
  id: string;                       // "troposphere", "outer-core", ...
  name: string; nameEn: string;
  realm: "atmosphere" | "surface" | "interior" | "functional";
  grouping?: "compositional" | "mechanical" | "both";
  topKm: number; bottomKm: number;  // + di atas muka laut, − di bawah
  state?: "gas" | "liquid" | "solid" | "plasma" | "mixed";
  tempC?: [number, number];
  pressure?: { min: number; max: number; unit: "hPa" | "GPa" };
  densityGcm3?: [number, number];
  composition: { label: string; fraction?: number }[];
  summary: string;
  insights: string[];               // minimal 3
  evidence: string[];               // "bagaimana kita tahu"
  color: string;
  sources: Source[];
  verified: boolean;
};

type Lithology = {
  id: string; name: string; patternId: string; color: string;
  grainSize: GrainSize;             // posisi default di profil butir
};

type Bed = {
  id: string;
  topM: number; baseM: number;
  lithologyId: string;
  grainSize: GrainSize;             // boleh [dasar, puncak] untuk gradasi
  grainSizeTop?: GrainSize;
  structures: string[]; fossils: string[];
  color?: string;
  baseContact: "sharp" | "gradational" | "erosional" | "unconformity";
  formationId?: string;
  ageMa?: [number, number];
  description?: string;
  environmentId?: string;           // interpretasi penulis, bila ada
};

type StratColumn = {
  id: string; title: string; location?: string;
  kind: "example" | "case-study" | "virtual-well" | "simulation" | "user";
  beds: Bed[];                      // urut dari atas ke bawah
  sources: Source[]; verified: boolean;
};

type Formation = {
  id: string; name: string; basin: string;
  age: string; ageMa?: [number, number];
  thicknessM?: [number, number];
  lithologies: string[]; environmentIds: string[];
  overlies?: string; underlies?: string;
  contactBelow?: "conformable" | "unconformable";
  economic?: string[]; description: string;
  sources: Source[]; verified: boolean;
};

type Environment = {
  id: string; name: string; nameEn: string;
  setting: "continental" | "transitional" | "marine";
  description: string;
  rules: Rule[];                    // lihat bagian 6
  typicalSuccession: Bed[];         // kolom mini
  relativeWaterDepth: number;       // −1 (darat) … 5 (laut dalam), untuk tren
  adjacent: string[];               // tetangga wajar (Hukum Walther)
};
```

## 4. Geometri lapisan batuan (Modul B)

Model sederhana dan deterministik di `lib/strata/`:

- Tumpukan awal: daftar lapisan dengan ketebalan; batas lapisan ke-*i* berupa permukaan `z_i(x, y)`.
- **Operasi sejarah** diterapkan berurutan pada medan permukaan:
  - `tilt(angle, azimuth)`; `fold(amplitude, wavelength, axisAzimuth)` memakai sinus;
  - `fault(type, dip, strike, throw, position)` menggeser satu sisi;
  - `erode(level | surface)` memotong semua yang di atas permukaan erosi;
  - `deposit(layers)` menambah lapisan baru di atas permukaan saat ini (menghasilkan ketidakselarasan bila terjadi setelah `erode`);
  - `intrude(dike | sill)`.
- Fungsi `sampleWell(x, y)` mengembalikan urutan lapisan vertikal di titik itu sebagai `StratColumn`. Fungsi ini diuji: sesar naik mengulang lapisan, sesar normal menghilangkan lapisan, erosi memotong puncak.
- Render: mesh sisi blok dibangun dari poligon penampang tiap lapisan (pola litologi sebagai tekstur kanvas), permukaan atas sebagai peta geologi sederhana.

## 5. Simulasi sedimentasi (Modul D)

### 5.1 Pengisian cekungan: difusi 1D

Grid `x` dari darat (kiri) ke laut (kanan), elevasi `h(x, t)`.

```
∂h/∂t = ∂/∂x ( K(x) ∂h/∂x ) − σ(x)
K(x)  = K_darat  bila h(x) > SL(t),  K_laut bila tidak   (K_laut < K_darat)
SL(t) = A · sin(2π t / P) + tren · t
Batas kiri: fluks sedimen masuk q_s.  Batas kanan: fluks nol atau terbuka.
```

- Skema eksplisit dalam bentuk fluks antarsel (konservatif). Syarat stabilitas: `dt ≤ dx² / (2 · K_maks)`; pilih `dt` otomatis.
- Simpan **garis waktu**: tiap `n` langkah, salin `h` sebagai permukaan baru. Setelah tiap langkah, potong semua permukaan lama dengan `min(permukaan, h)` agar erosi tercatat. Penurunan `σ` diterapkan juga pada semua permukaan tersimpan.
- **Fasies** tiap paket ditentukan dari kedalaman air saat diendapkan `d = SL − h`:
  - `d < 0`: dataran pantai/sungai (pasir, lanau, kemungkinan batubara);
  - `0 ≤ d < 10 m`: muka pantai (pasir);
  - `10 ≤ d < 50 m`: transisi lepas pantai (lanau, pasir halus);
  - `d ≥ 50 m`: paparan/lepas pantai (lempung).
  Ambang disimpan sebagai konstanta yang bisa diatur.
- Keluaran: poligon antar-garis-waktu berwarna fasies, lintasan garis pantai, dan `sampleWell(x)` → `StratColumn` (jenis `simulation`).
- Uji: kekekalan massa (volume endapan ≈ fluks masuk × waktu, toleransi 1–2%), stabilitas untuk rentang parameter UI, preset progradasi menghasilkan sumur mengasar ke atas.
- Jalankan di Web Worker; kirim snapshot ke UI dengan laju terbatas.

### 5.2 Kecepatan jatuh butir

```
Stokes (butir halus, Re < ~1):   w = (ρs − ρf) g D² / (18 μ)
Ferguson & Church (2004):        w = R g D² / ( C1 ν + sqrt(0.75 · C2 · R g D³) )
  R = (ρs − ρf)/ρf ≈ 1.65 untuk kuarsa di air;  ν ≈ 1.0e-6 m²/s (air 20 °C)
  C1 = 18;  C2 = 1.0 untuk butir alami (0.4 untuk bola halus)
```

Gunakan Ferguson & Church untuk semua ukuran (mendekati Stokes pada butir halus). Tabung pengendapan: partikel dengan sebaran ukuran, posisi diperbarui dengan `w`; tumpukan di dasar otomatis bersusun.

### 5.3 Diagram Hjulström

Kurva erosi dan pengendapan disimpan sebagai titik-titik terdigitasi pada sumbu log–log (diameter mm vs kecepatan cm/s) dan diinterpolasi. Tandai jelas bahwa diagram ini empiris dan kualitatif. Fungsi `classify(D, v)` → `"erosi" | "transportasi" | "pengendapan"`.

## 6. Mesin interpretasi (Modul E)

```ts
type Observation = {
  lithology?: string[]; grainSize?: GrainSize; sorting?: "poor"|"moderate"|"well"|"very-well";
  rounding?: "angular"|"subangular"|"subrounded"|"rounded";
  structures?: string[]; fossils?: string[]; color?: string;
  trend?: "fining-up"|"coarsening-up"|"uniform"|"cyclic";
  geometry?: string; special?: string[];   // "coal", "evaporite", "glauconite", ...
};

type Rule = {
  feature: keyof Observation; value: string;
  weight: number;            // + mendukung, − menentang; |weight| 1..5
  diagnostic?: boolean;      // ciri hampir menentukan (mis. urutan Bouma)
  note: string;              // penjelasan yang ditampilkan ke pengguna
};
```

- Skor lingkungan = jumlah bobot aturan yang cocok, dinormalkan terhadap jumlah bobot positif maksimum untuk ciri yang **diisi** pengguna, sehingga ciri kosong tidak menghukum.
- Keluaran per kandidat: skor 0–1, daftar aturan pendukung, daftar aturan penentang, dan `suggestions`: ciri berbobot besar yang belum diisi dan paling membedakan dua kandidat teratas.
- Interpretasi kolom: kelompokkan lapisan menjadi interval (berdasarkan kontak erosional/ketidakselarasan dan perubahan tren butir), hitung `trend` tiap interval, jalankan mesin, lalu periksa tetangga dengan `Environment.adjacent`. Pasangan tak wajar tanpa kontak erosional → peringatan Hukum Walther. Tren `relativeWaterDepth` → label transgresi/regresi.
- Kasus uji minimum:
  1. Batupasir–serpih berselingan, perlapisan bersusun, urutan Bouma, cetakan suling → kipas bawah laut.
  2. Mengasar ke atas, lempung → pasir, batubara di puncak, sisa tumbuhan → delta.
  3. Menghalus ke atas, dasar erosional, silang-siur, akar dan rekah kerut di puncak → sungai bermeander.
  4. Batupasir terpilah sangat baik, bundar, silang-siur raksasa bersudut tinggi, tanpa fosil → gurun.
  5. Batugamping dengan koral dan alga → paparan karbonat/terumbu.
  6. Flaser, lentikular, herringbone → dataran pasang surut.
  7. Diamiktit dengan kerakal bergores dan dropstone → glasial.
  8. Rijang radiolaria dan lempung merah berlaminasi halus → laut dalam pelagik.
  9. Kolom Sumatra Selatan → tren transgresi sampai Gumai lalu regresi.

## 7. Kolom stratigrafi (SVG)

- Skala vertikal `d3-scale` linear dengan zoom/pan; lebar lapisan dari skala ordinal ukuran butir.
- Lapisan bergradasi digambar sebagai trapesium (lebar dasar ≠ lebar puncak).
- Pola litologi sebagai `<pattern>` SVG di satu komponen `LithologyPatterns`; dipakai ulang oleh blok 3D lewat render ke kanvas.
- Kontak erosional/ketidakselarasan digambar garis bergelombang. Simbol struktur dan fosil sebagai ikon SVG kecil di lajur samping.
- Ekspor: serialisasi SVG; PNG lewat kanvas.

## 8. Pengujian

- Unit (Vitest): semua yang ada di `src/lib/`, validasi Zod atas semua isi `src/content/`, serta uji konsistensi konten (tidak ada celah atau tumpang-tindih kedalaman dalam satu mode pengelompokan; tiap lapisan punya ≥ 3 insight dan ≥ 1 sumber; semua `formationId`, `lithologyId`, `environmentId` mengacu ke entri yang ada).
- Komponen: panel info, kolom stratigrafi (render lapisan dan klik), formulir interpretasi.
- E2E (Playwright, M8): buka tiap rute, pilih lapisan, jalankan preset simulasi, kirim sumur virtual ke kolom lalu ke interpretasi.

## 9. Performa

- Lazy-load per rute; three.js hanya dimuat pada rute yang memerlukannya.
- Segmen bola menyesuaikan perangkat; `dpr` dibatasi 2; `frameloop="demand"` saat adegan diam.
- Tekstur dikompresi (WebP/KTX2 bila mudah), ukuran berbeda untuk ponsel.
- Tidak ada alokasi per frame di loop animasi; partikel memakai `InstancedMesh`.

---

# Bagian 5 — Roadmap

Kerjakan berurutan dalam satu alur tanpa berhenti di antara milestone (Bagian 1.1). Definisi selesai ada di Bagian 1.7; checkpoint bergulir di Bagian 1.2. Standar 3D dan interaksi di Bagian 1.5 adalah bagian dari kriteria terima M1, M2, M5, dan M6. Tidak ada `git push` sebelum Bagian 6.

## M0 — Fondasi

- `git init -b main`, `.gitignore`, `CLAUDE.md` pendek dan `.claude/settings.json` (Bagian 1.3), commit awal.
- Scaffold Vite + React + TypeScript strict; pasang dependensi di Bagian 1.6; Playwright untuk tangkapan layar; ESLint + Prettier; Tailwind; Vitest.
- Kerangka aplikasi: navigasi, semua rute sebagai halaman kosong berjudul, mode terang/gelap, tata letak responsif.
- `README.md` singkat, `CREDITS.md`, `docs/PROGRESS.md`.
- Skema Zod di `src/content/schema.ts` sesuai Bagian 4, dengan satu test contoh.

Terima: `npm run dev` menampilkan kerangka dengan semua rute; keempat pemeriksaan lolos; `git log` menunjukkan commit; `git remote -v` kosong. Tag `m0`.

## M1 — Globe dan interior Bumi

- `content/layers.ts` untuk interior (komposisi dan mekanis) + diskontinuitas, terisi penuh dari Bagian 3.
- Globe 3D sesuai standar visual Bagian 1.5: tekstur siang/malam, awan, pendar atmosfer, material interior prosedural, pascaproses; kontrol orbit, potongan baji, mode belah dan kupas, semuanya beranimasi.
- Tombol aksi utama, petunjuk pertama kali, kamera terbang ke lapisan terpilih, label 3D.
- Sorot dan pilih lapisan; daftar lapisan; panel info enam tab.
- Mode skala sebenarnya/diperbesar; alih komposisi/mekanis.
- Cadangan penampang 2D SVG.

Terima: kriteria 3.3 PRD untuk lapisan interior; tangkapan layar sudah dinilai sendiri dan layak dipamerkan. Tag `m1`.

## M2 — Atmosfer, permukaan, perjalanan kedalaman

- Data dan visual atmosfer (5 lapisan + ionosfer, ozon, magnetosfer), hidrosfer (zona laut), kriosfer, biosfer.
- Slider perjalanan kedalaman dengan kartu baca-langsung; `lib/profile` (interpolasi, penanganan diskontinuitas, skala piecewise) beserta test.
- Penanda pembanding skala; lapisan tambahan (batas lempeng skematis, garis Kármán, bidang diskontinuitas).
- Grafik profil suhu/tekanan/densitas terhadap kedalaman yang tersinkron dengan slider.

Terima: kriteria 3.3 PRD seluruhnya. Tag `m2`.

## M3 — Konten, pencarian, pembelajaran

- Lengkapi semua teks insight dan "bagaimana kita tahu"; animasi sederhana zona bayangan gelombang P dan S.
- Glosarium (≥ 80 istilah) dengan tautan otomatis; pencarian global.
- Tur terpandu; kuis Modul A; halaman Tentang dengan sumber.
- Test konsistensi konten (Bagian 4 bagian 8).

Terima: tidak ada tab panel yang kosong; pencarian menemukan lapisan dan istilah. Tag `m3`.

## M4 — Kolom stratigrafi dan formasi

- `lithologies.ts` dan komponen pola SVG + legenda.
- Penampil kolom: profil butir, kontak, simbol, kolom umur, zoom/pan, panel detail.
- Kolom ajar generik dan kolom studi kasus Sumatra Selatan; `formations.ts` dengan sumber terverifikasi (atau label "perlu verifikasi").
- Halaman daftar dan detail formasi dengan filter, tautan dua arah ke kolom.
- Editor kolom, impor/ekspor JSON, ekspor SVG/PNG, perbandingan dua kolom.

Terima: kriteria bagian 5 dan 6 PRD. Tag `m4`.

## M5 — Lapisan batuan 3D

- `lib/strata` (operasi sejarah, `sampleWell`) dengan test.
- Blok diagram 3D berpola, semua skenario, kontrol deformasi, bidang iris.
- Sumur virtual → Modul C. Mode urutan kejadian dan kuis urutan.

Terima: kriteria bagian 4 PRD. Tag `m5`.

## M6 — Simulasi sedimentasi

- `lib/sedsim`: model difusi, garis waktu, fasies, `sampleWell`, kecepatan jatuh, Hjulström; semua dengan test (kekekalan massa, stabilitas).
- Web Worker; tampilan penampang, kurva muka laut, lintasan garis pantai, preset, kotak penjelasan dinamis.
- Tabung pengendapan dan saluran arus dengan diagram Hjulström interaktif.
- Sumur virtual → Modul C.

Terima: kriteria bagian 7 PRD. Tag `m6`.

## M7 — Interpretasi lingkungan pengendapan

- `environments.ts` dengan aturan untuk 14 lingkungan; `lib/interpret` dengan sembilan kasus uji.
- Formulir pengamatan; hasil dengan bukti pendukung/penentang dan saran data.
- Interpretasi kolom per interval, tren kedalaman air, label transgresi/regresi, peringatan Hukum Walther.
- Kartu lingkungan dengan kolom mini dan diagram.

Terima: kriteria bagian 8 PRD. Tag `m7`.

## M8 — Penyempurnaan

- Aksesibilitas (keyboard, kontras, pembaca layar, reduced motion); responsif ponsel.
- Performa: ukur dan capai target di Bagian 1.6; lazy-load; optimasi tekstur.
- Playwright smoke test; perbaiki cacat. Putaran poles terakhir untuk semua tampilan 3D dan alur interaksi, dengan tangkapan layar desktop dan ponsel.
- Kuis modul lain; status di URL; README lengkap (tangkapan layar, cara menjalankan, struktur, batasan model, sumber).
- Tinjau ulang seluruh konten terhadap Bagian 3; daftar entri `verified: false` di `docs/PROGRESS.md`.

Terima: semua pemeriksaan dan smoke test lolos; build produksi berjalan lewat `npm run preview`. Tag `m8`.

## M9 — Siap online

Semua dikerjakan lokal; belum ada yang dipublikasikan.

- Tambahkan `LICENSE` (MIT, kecuali pemilik sudah menyebut lisensi lain) dan lengkapi `CREDITS.md`.
- Buat `.github/workflows/deploy.yml`: pada push ke `main`, jalankan `npm ci`, `lint`, `typecheck`, `test`, `build`, lalu unggah `dist` dan deploy ke GitHub Pages dengan action resmi Pages. Cek dokumentasi untuk versi action terbaru.
- Pastikan `npm run build && npm run preview` jalan dari subpath (uji dengan menyajikan `dist` dari subfolder) dan semua rute terbuka lewat HashRouter.
- Periksa tidak ada rahasia, file besar tak perlu, atau aset tanpa lisensi yang ikut ter-commit.
- Tulis `docs/PUBLIKASI.md`: langkah yang akan dijalankan saat publikasi dan cara memperbarui situs sesudahnya.

Terima: semua pemeriksaan lolos; working tree bersih; tag `m9`. Tulis **laporan akhir** (apa yang dibangun, cara menjalankan, masalah terbuka, data `verified:false`) lalu berhenti dan tunggu kata "Publikasikan".

---

# Bagian 6 — Publikasi (hanya setelah pemilik berkata "Publikasikan")

Kata itu adalah izin untuk seluruh langkah di bawah; kerjakan berurutan tanpa meminta konfirmasi lagi. Bila pemilik menyebut nama repositori atau lisensi, pakai itu; bila tidak, nama repositori `bumi-lapis` dan lisensi MIT.

1. Pastikan working tree bersih dan `lint`, `typecheck`, `test`, `build` lolos.
2. `gh auth status`. Kalau belum login, minta pemilik menjalankan `gh auth login` lalu lanjutkan; ini satu-satunya hal yang boleh ditunggu.
3. Buat repositori **publik** (GitHub Pages gratis membutuhkan repositori publik) dari folder ini dengan `gh repo create`, tambahkan remote `origin`, push `main` dan semua tag. Hapus aturan penolakan push di `.claude/settings.json` bila ada.
4. Aktifkan GitHub Pages dengan sumber "GitHub Actions" lewat `gh api`, lalu pantau workflow deploy sampai selesai (`gh run watch`). Kalau gagal, baca log, perbaiki, push ulang.
5. Buka URL situs (`https://<pengguna>.github.io/<repo>/`), periksa dengan Playwright bahwa halaman utama dan tiap rute termuat, tekstur tampil, dan tidak ada galat konsol.
6. Isi deskripsi dan tautan situs di repositori, tambahkan tautan demo dan tangkapan layar di README, push.
7. Laporkan: URL repositori, URL situs, dan cara memperbarui (cukup `git push`; situs dibangun ulang otomatis).

Alternatif bila pemilik lebih suka repositori privat: deploy lewat Vercel atau Netlify dengan mengimpor repositori; pengaturan build `npm run build`, folder keluaran `dist`.
