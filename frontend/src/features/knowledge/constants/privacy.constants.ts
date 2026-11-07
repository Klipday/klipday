import type { LegalDocumentSection } from '../types';

/**
 * Last revision date for the Privacy Policy.
 */
export const PRIVACY_LAST_UPDATED = '7 November 2026';

/**
 * Official privacy and data protection contact email.
 */
export const PRIVACY_CONTACT_EMAIL = 'privacy@klipday.com';

/**
 * Structured sections for Klipday Privacy Policy (Kebijakan Privasi).
 * Formulated strictly in accordance with Undang-Undang Republik Indonesia Nomor 27
 * Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
 */
export const PRIVACY_SECTIONS: readonly LegalDocumentSection[] = [
  {
    id: 'pernyataan-umum',
    title: '1. Pernyataan Umum & Kepatuhan Regulasi',
    shortTitle: '1. Pernyataan Umum',
    description:
      'Komitmen Klipday dalam melindungi privasi dan kepatuhan penuh terhadap regulasi pelindungan data pribadi di Republik Indonesia.',
    clauses: [
      {
        id: 'privacy-1-1',
        title: '1.1 Kepatuhan terhadap UU No. 27 Tahun 2022 (UU PDP)',
        content:
          'Klipday berkomitmen penuh untuk melindungi privasi setiap pengguna. Kebijakan Privasi ini disusun berdasarkan ketentuan Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) dan peraturan pelaksananya. Klipday bertindak sebagai Pengendali Data Pribadi (Data Controller) atas data pribadi yang dikumpulkan dan diproses melalui platform.',
      },
      {
        id: 'privacy-1-2',
        title: '1.2 Ruang Lingkup Kebijakan Privasi',
        content:
          'Kebijakan ini berlaku bagi seluruh pengguna terdaftar, baik pihak Brand maupun Kreator/Clipper, serta tamu yang mengakses situs web dan seluruh layanan digital yang disediakan oleh platform Klipday.',
      },
    ],
    callout: {
      title: 'Kepatuhan Regulasi UU PDP No. 27/2022',
      description:
        'Seluruh pengumpulan, pemrosesan, dan penyimpanan data pribadi di Klipday tunduk pada prinsip transparansi, pembatasan tujuan, dan jaminan keamanan sesuai ketentuan hukum perundang-undangan Republik Indonesia.',
    },
  },
  {
    id: 'data-yang-dikumpulkan',
    title: '2. Data Pribadi yang Dikumpulkan',
    shortTitle: '2. Data Dikumpulkan',
    description:
      'Rincian kategori data pribadi yang dikumpulkan secara sah demi penyelenggaraan layanan marketplace.',
    clauses: [
      {
        id: 'privacy-2-1',
        title: '2.1 Data Identitas Diri',
        content:
          'Data identitas dikumpulkan untuk memvalidasi identitas hukum dan kepatuhan perbankan:',
        bulletPoints: [
          'Nama lengkap sesuai kartu identitas resmi pemerintah (KTP).',
          'Tanggal lahir guna memverifikasi batas usia dewasa legal minimum 18 tahun.',
          'Foto dokumen fisik KTP asli untuk verifikasi KYC penarikan saldo dompet.',
        ],
      },
      {
        id: 'privacy-2-2',
        title: '2.2 Data Kontak & Komunikasi',
        content:
          'Data kontak digunakan untuk komunikasi esensial, keamanan, dan notifikasi:',
        bulletPoints: [
          'Alamat surat elektronik (email) aktif untuk autentikasi dan pemulihan akun.',
          'Nomor telepon seluler / WhatsApp berformat internasional resmi (awalan kode negara 62) untuk pengiriman kode keamanan.',
        ],
      },
      {
        id: 'privacy-2-3',
        title: '2.3 Data Finansial & Perbankan',
        content:
          'Data rekening dan keuangan untuk penyaluran dana penarikan saldo:',
        bulletPoints: [
          'Nama bank nasional atau penyedia uang elektronik (DANA, GoPay, OVO, ShopeePay).',
          'Nomor rekening bank atau nomor ponsel akun e-wallet.',
          'Nama resmi pemilik rekening yang wajib selaras dengan dokumen identitas KYC.',
        ],
      },
      {
        id: 'privacy-2-4',
        title: '2.4 Data Publik Akun Media Sosial',
        content:
          'Data sosial publik yang diproses untuk verifikasi keikutsertaan kampanye:',
        bulletPoints: [
          'Nama pengguna (username) akun TikTok publik.',
          'Tautan video aktif (live video URL) dan ID unik penayangan publik.',
          'Metrik akumulasi penayangan (views) publik untuk kalkulasi imbalan CPM.',
        ],
      },
      {
        id: 'privacy-2-5',
        title: '2.5 Data Teknis & Akses Perangkat',
        content:
          'Informasi teknis otomatis untuk pencegahan peretasan dan deteksi anomali sesi:',
        bulletPoints: [
          'Alamat Protokol Internet (IP address).',
          'Jenis peramban web (browser) dan sistem operasi perangkat.',
          'Waktu akses, durasi sesi, dan rekaman log audit keamanan.',
        ],
      },
    ],
  },
  {
    id: 'tujuan-pengolahan',
    title: '3. Dasar Hukum & Tujuan Pengolahan Data',
    shortTitle: '3. Tujuan Pengolahan',
    description:
      'Landasan hukum dan tujuan pemrosesan data pribadi secara proporsional sesuai kebutuhan sistem.',
    clauses: [
      {
        id: 'privacy-3-1',
        title: '3.1 Penyelenggaraan Layanan & Kontrak Marketplace',
        content:
          'Memfasilitasi interaksi marketplace antara Brand dan Kreator, memverifikasi status pendaftaran kampanye, mengunci alokasi anggaran escrow, serta memproses settlement akhir kampanye.',
      },
      {
        id: 'privacy-3-2',
        title: '3.2 Otentikasi Aman & Pemulihan Akun',
        content:
          'Memverifikasi kepemilikan akun melalui kode One-Time Password (OTP) 6-digit saat pendaftaran dan penarikan, serta menyediakan mekanisme pemulihan kata sandi yang aman.',
      },
      {
        id: 'privacy-3-3',
        title: '3.3 Verifikasi Kepemilikan Sosial & Audit Submisi',
        content:
          'Memvalidasi kepemilikan akun TikTok melalui pencocokan kode bio sementara (KD-XXXX) dan melakukan audit periodik terhadap metrik views video yang disetorkan guna memastikan validitas penayangan.',
      },
      {
        id: 'privacy-3-4',
        title: '3.4 Kepatuhan Regulasi AML & KYC Finansial',
        content:
          'Memenuhi standar hukum pencegahan tindak pidana pencucian uang (Anti-Money Laundering) dan prinsip Mengenal Nasabah (Know Your Customer) sebelum menyalurkan dana riil ke rekening perbankan pengguna.',
      },
      {
        id: 'privacy-3-5',
        title: '3.5 Pencegahan Penipuan & Keamanan Sistem (Anti-Fraud)',
        content:
          'Mendeteksi dan mencegah aktivitas kecurangan, manipulasi views melalui bot atau skrip otomatis, akun ganda manipulatif, serta ancaman keamanan siber pada infrastruktur Klipday.',
      },
    ],
  },
  {
    id: 'penyimpanan-keamanan',
    title: '4. Penyimpanan, Retensi & Keamanan Data Pribadi',
    shortTitle: '4. Keamanan Data',
    description:
      'Standar enkripsi data, proteksi berkas KTP pada penyimpanan privat, dan jaminan tanpa penjualan data.',
    clauses: [
      {
        id: 'privacy-4-1',
        title: '4.1 Standar Enkripsi Kata Sandi & Token Keamanan',
        content:
          'Seluruh kata sandi pengguna dienkripsi menggunakan algoritma cryptographic hashing bcrypt dengan salt dinamis. Token OTP dan token pengaturan ulang sandi di-hash menggunakan SHA-256 dan hanya disimpan dalam masa kedaluwarsa singkat.',
      },
      {
        id: 'privacy-4-2',
        title: '4.2 Proteksi Dokumen KTP pada Storage Privat Terenkripsi',
        content:
          'Dokumen foto identitas KTP disimpan di cloud storage privat terisolasi dengan proteksi berlapis:',
        bulletPoints: [
          'Enkripsi menyeluruh saat transmisi (TLS 1.3) dan saat penyimpanan (encryption-at-rest).',
          'Penyimpanan terisolasi pada private storage tanpa tautan akses publik.',
          'Akses internal dibatasi secara ketat hanya bagi Administrator berwenang untuk audit KYC pencairan saldo.',
        ],
      },
      {
        id: 'privacy-4-3',
        title: '4.3 Periode Retensi Data Sesuai Hukum',
        content:
          'Data profil aktif disimpan selama pengguna mempertahankan akunnya. Data riwayat transaksi finansial dan penarikan disimpan minimal 5 (lima) tahun sesuai dengan kewajiban undang-undang perpajakan dan perbankan di Indonesia.',
      },
      {
        id: 'privacy-4-4',
        title: '4.4 Jaminan Tanpa Penjualan Data ke Pihak Ketiga',
        content:
          'Klipday menegaskan komitmen mutlak: kami tidak pernah dan tidak akan pernah menjual, menyewakan, memperdagangkan, atau membagikan data pribadi pengguna kepada pihak ketiga manapun untuk tujuan pemasaran komersial atau periklanan pihak ketiga.',
      },
    ],
  },
  {
    id: 'pembagian-data',
    title: '5. Pembagian Data kepada Pihak Ketiga yang Berwenang',
    shortTitle: '5. Pembagian Data',
    description:
      'Kondisi terbatas di mana data pengguna diproses oleh mitra berizin atau instansi hukum.',
    clauses: [
      {
        id: 'privacy-5-1',
        title: '5.1 Mitra Gerbang Pembayaran Resmi (Payment Gateway)',
        content:
          'Data finansial yang diperlukan diteruskan secara aman ke mitra penyedia payment gateway resmi yang memiliki izin operasional dari Bank Indonesia untuk keperluan pemrosesan deposit saldo dan pencairan dana penarikan.',
      },
      {
        id: 'privacy-5-2',
        title: '5.2 Kewajiban Peraturan Perundang-Undangan',
        content:
          'Klipday dapat membuka data pribadi tertentu jika diwajibkan oleh penetapan pengadilan yang sah, proses penyidikan resmi kepolisian, atau perintah tertulis dari lembaga regulator pemerintah Republik Indonesia yang berwenang.',
      },
    ],
  },
  {
    id: 'hak-subjek-data',
    title: '6. Hak Subjek Data Pribadi (Pasal 5–14 UU PDP)',
    shortTitle: '6. Hak Subjek Data',
    description:
      'Hak hukum pengguna atas kendali data pribadi yang dijamin penuh oleh undang-undang.',
    clauses: [
      {
        id: 'privacy-6-1',
        title: '6.1 Hak Memperoleh Informasi & Transparansi (Pasal 5)',
        content:
          'Pengguna berhak memperoleh kejelasan identitas pengendali data, dasar kepentingan hukum, dan tujuan spesifik pemrosesan data pribadi oleh Klipday.',
      },
      {
        id: 'privacy-6-2',
        title: '6.2 Hak Mengakses & Memperoleh Salinan Data (Pasal 7)',
        content:
          'Pengguna berhak mengakses profil dan meminta ringkasan catatan data pribadi yang disimpan oleh platform Klipday mengenai dirinya.',
      },
      {
        id: 'privacy-6-3',
        title: '6.3 Hak Melengkapi & Memperbaiki Data (Pasal 6)',
        content:
          'Pengguna berhak memperbarui atau membetulkan data pribadi yang tidak akurat, tidak lengkap, atau tidak mutakhir melalui menu pengaturan profil.',
      },
      {
        id: 'privacy-6-4',
        title: '6.4 Hak Menghapus Data & Penutupan Akun (Pasal 8)',
        content:
          'Pengguna berhak mengajukan permohonan penghapusan data pribadi dan penutupan akun (Right to Erasure), sepanjang data tersebut tidak lagi diperlukan dan tidak bertentangan dengan kewajiban retensi data transaksi finansial perbankan.',
      },
      {
        id: 'privacy-6-5',
        title: '6.5 Hak Menarik Kembali Persetujuan (Pasal 9)',
        content:
          'Pengguna berhak menarik persetujuan pemrosesan data pribadi untuk tujuan tertentu yang sebelumnya telah diberikan dengan mengajukan permohonan resmi kepada Tim Klipday.',
      },
    ],
  },
  {
    id: 'penggunaan-cookies',
    title: '7. Penggunaan Kuki (Cookies) & Penyimpanan Sesi',
    shortTitle: '7. Kuki & Sesi',
    description:
      'Teknologi penyimpanan lokal untuk menjaga keamanan sesi login dan preferensi pengguna.',
    clauses: [
      {
        id: 'privacy-7-1',
        title: '7.1 Kuki Esensial & Autentikasi',
        content:
          'Klipday hanya menggunakan session storage dan token autentikasi esensial untuk menjaga status login aman (JSON Web Token) dan mengingat preferensi antarmuka. Klipday tidak menanamkan cookie pelacak pihak ketiga untuk pelacakan lintas situs.',
      },
    ],
  },
  {
    id: 'kontak-privasi',
    title: '8. Kontak & Komunikasi Privasi',
    shortTitle: '8. Kontak Privasi',
    description:
      'Saluran resmi untuk mengajukan permohonan hak subjek data atau konsultasi privasi.',
    clauses: [
      {
        id: 'privacy-8-1',
        title: '8.1 Alamat Korespondensi Resmi',
        content:
          'Untuk pertanyaan, saran, atau pelaksanaan hak subjek data pribadi berdasarkan UU PDP, Anda dapat menghubungi Pejabat Perlindungan Data Klipday melalui pos elektronik resmi: privacy@klipday.com.',
      },
      {
        id: 'privacy-8-2',
        title: '8.2 Waktu Tanggapan Permohonan (SLA 3x24 Jam Kerja)',
        content:
          'Setiap permohonan resmi terkait hak subjek data akan diverifikasi keabsahan identitas pemohon dan ditanggapi dalam waktu maksimal 3x24 jam pada hari kerja.',
      },
    ],
  },
];
