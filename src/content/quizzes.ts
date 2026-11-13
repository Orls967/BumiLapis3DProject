import type { QuizQuestion } from './schema';

export type QuizModule = 'earth' | 'strata' | 'column' | 'sedimentation' | 'interpret';

export const quizzes: Record<QuizModule, { title: string; questions: QuizQuestion[] }> = {
  earth: {
    title: 'Kuis: Jelajah Bumi',
    questions: [
      {
        question: 'Mengapa inti dalam padat padahal lebih panas daripada inti luar yang cair?',
        options: ['Karena komposisinya batuan, bukan logam', 'Karena tekanan yang sangat tinggi menaikkan titik leleh besi', 'Karena suhunya sebenarnya lebih rendah', 'Karena tidak ada unsur ringan sama sekali'],
        answer: 1,
        explanation: 'Tekanan 329–364 GPa menaikkan titik leleh besi sehingga besi tetap padat walau suhunya sebanding dengan permukaan Matahari.',
      },
      {
        question: 'Bukti apa yang menunjukkan bahwa inti luar cair?',
        options: ['Lubang bor Kola menembusnya', 'Gelombang S tidak teramati lebih dari ≈104° dari pusat gempa', 'Gunung api mengeluarkan besi cair', 'Suhu permukaan naik setiap tahun'],
        answer: 1,
        explanation: 'Gelombang S hanya merambat di materi padat. Zona bayangan gelombang S membuktikan ada lapisan cair di dalam Bumi.',
      },
      {
        question: 'Pernyataan mana yang benar tentang mantel Bumi?',
        options: ['Mantel adalah lautan magma cair', 'Mantel padat tetapi mengalir beberapa sentimeter per tahun', 'Mantel tersusun dari besi-nikel', 'Mantel hanya setebal 35 km'],
        answer: 1,
        explanation: 'Mantel itu padat. Ia mengalir sangat lambat dalam skala waktu geologi; magma hanya terbentuk di tempat tertentu.',
      },
      {
        question: 'Di lapisan atmosfer mana suhu naik terhadap ketinggian karena ozon menyerap ultraungu?',
        options: ['Troposfer', 'Stratosfer', 'Mesosfer', 'Eksosfer'],
        answer: 1,
        explanation: 'Lapisan ozon (≈15–35 km) berada di stratosfer; penyerapan ultraungu memanaskan lapisan ini.',
      },
      {
        question: 'Apa perbedaan litosfer dan kerak?',
        options: ['Tidak ada, keduanya sama', 'Litosfer adalah kerak ditambah mantel paling atas yang kaku', 'Litosfer hanya ada di bawah samudra', 'Kerak lebih tebal daripada litosfer'],
        answer: 1,
        explanation: 'Kerak didefinisikan dari komposisi, litosfer dari sifat mekanis: kerak dan mantel paling atas yang kaku, setebal ≈100 km.',
      },
    ],
  },
  strata: {
    title: 'Kuis: Lapisan Batuan',
    questions: [
      {
        question: 'Menurut prinsip superposisi, pada urutan lapisan yang belum terganggu…',
        options: ['lapisan paling atas paling tua', 'lapisan paling bawah paling tua', 'semua lapisan seumur', 'umur tidak bisa ditentukan'],
        answer: 1,
        explanation: 'Sedimen menumpuk dari bawah ke atas, jadi lapisan di bawah diendapkan lebih dulu.',
      },
      {
        question: 'Sebuah dike memotong lapisan batupasir. Mana yang lebih muda?',
        options: ['Batupasir', 'Dike', 'Sama umurnya', 'Tidak dapat ditentukan'],
        answer: 1,
        explanation: 'Hubungan potong-memotong: yang memotong lebih muda daripada yang dipotong.',
      },
      {
        question: 'Sumur yang menembus sesar naik biasanya menunjukkan…',
        options: ['lapisan yang hilang', 'lapisan yang terulang', 'tidak ada perubahan', 'hanya batuan beku'],
        answer: 1,
        explanation: 'Pada sesar naik, blok atap terdorong ke atas blok alas sehingga sumur menembus lapisan yang sama dua kali.',
      },
      {
        question: 'Lapisan miring yang terpotong rata lalu ditutupi lapisan mendatar disebut…',
        options: ['Disconformity', 'Ketidakselarasan bersudut', 'Sinklin', 'Sill'],
        answer: 1,
        explanation: 'Ketidakselarasan bersudut (angular unconformity) merekam pengendapan, deformasi, erosi, lalu pengendapan lagi.',
      },
      {
        question: 'Pada antiklin yang tererosi, batuan tertua tersingkap di…',
        options: ['inti lipatan', 'sayap terluar', 'di mana saja', 'tidak tersingkap'],
        answer: 0,
        explanation: 'Antiklin melengkung ke atas; setelah dierosi, lapisan tertua muncul di intinya.',
      },
    ],
  },
  column: {
    title: 'Kuis: Kolom Stratigrafi',
    questions: [
      {
        question: 'Pada kolom stratigrafi, lebar lapisan biasanya menggambarkan…',
        options: ['umur batuan', 'ukuran butir', 'kandungan fosil', 'warna batuan'],
        answer: 1,
        explanation: 'Profil ukuran butir: makin kasar butirnya, makin lebar lapisan digambar, sehingga pola menghalus atau mengasar ke atas langsung terlihat.',
      },
      {
        question: 'Garis kontak bergelombang di kolom menandakan…',
        options: ['kontak berangsur', 'bidang erosi atau ketidakselarasan', 'batas warna', 'sesar geser'],
        answer: 1,
        explanation: 'Kontak erosional dan ketidakselarasan digambar bergelombang karena mewakili permukaan yang tergerus.',
      },
      {
        question: 'Urutan satuan litostratigrafi dari besar ke kecil adalah…',
        options: ['lapisan > anggota > formasi > grup', 'grup > formasi > anggota > lapisan', 'formasi > grup > lapisan > anggota', 'anggota > grup > formasi > lapisan'],
        answer: 1,
        explanation: 'Grup terdiri atas beberapa formasi; formasi dibagi menjadi anggota dan lapisan.',
      },
      {
        question: 'Di Cekungan Sumatra Selatan, formasi mana yang mewakili puncak transgresi?',
        options: ['Lahat', 'Gumai', 'Muara Enim', 'Kasai'],
        answer: 1,
        explanation: 'Serpih laut Formasi Gumai diendapkan saat laut paling jauh menggenangi cekungan, lalu regresi dimulai.',
      },
      {
        question: 'Batas ukuran butir antara lanau dan pasir sangat halus pada skala Udden–Wentworth adalah…',
        options: ['0,0039 mm', '0,0625 mm', '2 mm', '64 mm'],
        answer: 1,
        explanation: 'Lanau: 0,0039–0,0625 mm; pasir: 0,0625–2 mm.',
      },
    ],
  },
  sedimentation: {
    title: 'Kuis: Sedimentasi',
    questions: [
      {
        question: 'Progradasi terjadi ketika…',
        options: ['akomodasi lebih besar daripada pasokan sedimen', 'pasokan sedimen lebih besar daripada akomodasi', 'muka laut naik sangat cepat', 'tidak ada sedimen yang masuk'],
        answer: 1,
        explanation: 'Jika sedimen datang lebih cepat daripada ruang yang tersedia, garis pantai maju ke arah laut.',
      },
      {
        question: 'Sumur yang menembus endapan delta yang berprogradasi akan menunjukkan pola…',
        options: ['menghalus ke atas', 'mengasar ke atas', 'seragam', 'acak'],
        answer: 1,
        explanation: 'Lempung lepas pantai di bawah ditumpangi pasir pantai yang lebih kasar: mengasar ke atas.',
      },
      {
        question: 'Menurut diagram Hjulström, butir mana yang paling mudah tererosi?',
        options: ['Lempung', 'Pasir halus', 'Kerakal', 'Bongkah'],
        answer: 1,
        explanation: 'Lempung bersifat kohesif dan kerakal terlalu berat; pasir halus butuh kecepatan arus paling rendah untuk terangkat.',
      },
      {
        question: 'Campuran pasir, lanau, dan lempung dijatuhkan ke kolom air tenang. Apa yang mengendap lebih dulu?',
        options: ['Lempung', 'Lanau', 'Pasir', 'Semua bersamaan'],
        answer: 2,
        explanation: 'Butir kasar jatuh lebih cepat, sehingga terbentuk perlapisan bersusun: kasar di dasar, halus di atas.',
      },
      {
        question: 'Ruang akomodasi bertambah karena…',
        options: ['muka laut turun dan cekungan naik', 'muka laut naik dan/atau dasar cekungan turun', 'pasokan sedimen bertambah', 'arus melemah'],
        answer: 1,
        explanation: 'Akomodasi = perubahan muka laut + penurunan cekungan (subsidence).',
      },
    ],
  },
  interpret: {
    title: 'Kuis: Lingkungan Pengendapan',
    questions: [
      {
        question: 'Batupasir dan serpih berselingan dengan perlapisan bersusun dan urutan Bouma paling mungkin diendapkan di…',
        options: ['gurun', 'kipas bawah laut', 'dataran pasang surut', 'terumbu'],
        answer: 1,
        explanation: 'Urutan Bouma adalah ciri diagnostik turbidit, endapan arus turbid di lereng dan kipas bawah laut.',
      },
      {
        question: 'Urutan mengasar ke atas dari lempung ke batupasir dengan batubara di puncak menunjukkan…',
        options: ['delta', 'laut dalam pelagik', 'glasial', 'sungai teranyam'],
        answer: 0,
        explanation: 'Delta yang maju menumpuk prodelta, muka delta, lalu dataran delta berawa (batubara).',
      },
      {
        question: 'Flaser, lentikular, dan silang-siur tulang ikan adalah ciri…',
        options: ['kipas aluvial', 'dataran pasang surut', 'danau', 'paparan karbonat'],
        answer: 1,
        explanation: 'Ketiganya terbentuk oleh arus pasang dan surut yang berganti arah dan kekuatan.',
      },
      {
        question: 'Hukum Walther menyatakan bahwa…',
        options: ['lapisan bawah selalu lebih tua', 'fasies yang bertumpuk selaras dulu diendapkan bersebelahan', 'butir kasar jatuh lebih cepat', 'sesar lebih muda dari batuan yang dipotong'],
        answer: 1,
        explanation: 'Karena itu urutan vertikal dapat dibaca sebagai pergeseran lingkungan secara lateral, kecuali bila ada bidang erosi.',
      },
      {
        question: 'Warna merah pada batuan sedimen umumnya menandakan…',
        options: ['kondisi reduksi di laut dalam', 'oksidasi, umumnya di darat', 'kandungan batubara', 'kandungan glaukonit'],
        answer: 1,
        explanation: 'Besi teroksidasi memberi warna merah; abu-abu gelap atau hitam menandakan kondisi reduksi dan bahan organik.',
      },
    ],
  },
};
