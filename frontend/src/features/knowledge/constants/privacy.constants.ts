import type { LegalDocumentSection } from '../types';

/**
 * Last revision date for the Privacy Policy.
 */
export const PRIVACY_LAST_UPDATED = '23 November 2026';

/**
 * Official privacy and data protection contact email.
 */
export const PRIVACY_CONTACT_EMAIL = 'privacy@klipday.com';

/**
 * Structured sections for Klipday Privacy Policy (Kebijakan Privasi),
 * aligned with UU PDP No. 27 Tahun 2022 and KlipDay — Model Bisnis dan Standar Operasional (BM-001).
 */
export const PRIVACY_SECTIONS: readonly LegalDocumentSection[] = [
  {
    id: 'pernyataan-umum',
    title: '1. Pernyataan Umum & Kepatuhan Regulasi',
    shortTitle: '1. Pernyataan Umum',
    description:
      'Komitmen Klipday sebagai agensi dan platform layanan clipping terkelola dalam melindungi data pribadi sesuai UU PDP No. 27/2022.',
    clauses: [
      {
        id: 'privacy-1-1',
        title: '1.1 Kepatuhan terhadap UU No. 27 Tahun 2022 (UU PDP)',
        content:
          'Klipday berkomitmen penuh melindungi privasi dan kerahasiaan data seluruh Clipper, Klien/Brand, maupun pengunjung platform. Kebijakan Privasi ini disusun mengacu pada Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), dengan Klipday bertindak sebagai Pengendali Data Pribadi.',
      },
      {
        id: 'privacy-1-2',
        title: '1.2 Ruang Lingkup Penerapan',
        content:
          'Kebijakan ini berlaku atas pemrosesan data pribadi selama proses onboarding mitra clipper, pendaftaran dan pengelolaan kampanye Brand, QA konten, pelacakan performa tayangan, validasi rekening pencairan, serta administrasi perpajakan dan pembayaran.',
      },
    ],
    callout: {
      title: 'Prinsip Kerahasiaan Data & Perlindungan Antar-Pihak',
      description:
        'Data pribadi dan finansial clipper disimpan secara privat oleh tim operasional Klipday dan tidak dibagikan ke Brand untuk keperluan di luar pelaporan kinerja kampanye yang sah.',
    },
  },
  {
    id: 'data-yang-dikumpulkan',
    title: '2. Data Pribadi & Operasional yang Dikumpulkan',
    shortTitle: '2. Data Dikumpulkan',
    description:
      'Kategori data yang dikumpulkan secara terukur sesuai kebutuhan operasional layanan terkelola Klipday (BM-001 Bab 10, 13 & 14).',
    clauses: [
      {
        id: 'privacy-2-1',
        title: '2.1 Data Identitas, Profil Mitra & Kinerja',
        content:
          'Data identitas dan profil operasional dikumpulkan untuk keperluan kontrak, verifikasi usia dewasa, dan penempatan kampanye:',
        bulletPoints: [
          'Nama lengkap sesuai identitas resmi atau nama badan usaha klien.',
          'Tanggal lahir untuk memverifikasi kelayakan usia minimum 18 tahun.',
          'Riwayat verifikasi akun, skor kinerja, dan tier keanggotaan dalam jaringan clipper terkurasi.',
        ],
      },
      {
        id: 'privacy-2-2',
        title: '2.2 Data Kontak & Koordinasi Account Management',
        content:
          'Data komunikasi digunakan untuk pengiriman OTP, koordinasi Account Manager, penyampaian statement pendapatan, dan pemberitahuan revisi atau sanggah:',
        bulletPoints: [
          'Alamat email aktif untuk autentikasi akun dan pengiriman dokumen/invoice/statement.',
          'Nomor telepon seluler atau WhatsApp resmi (format awalan kode negara 62).',
        ],
      },
      {
        id: 'privacy-2-3',
        title: '2.3 Data Finansial, Validasi Rekening & Perpajakan',
        content:
          'Data keuangan dikumpulkan secara terpusat sebelum payout untuk mencegah kesalahan transfer dan memenuhi kewajiban pajak:',
        bulletPoints: [
          'Nama bank nasional atau penyedia uang elektronik (e-wallet) serta nomor rekening/akun tujuan payout.',
          'Nama resmi pemilik rekening yang wajib cocok dengan identitas akun terdaftar.',
          'Foto bukti kepemilikan rekening (halaman buku tabungan atau tangkapan layar profil e-wallet) untuk validasi KYC terpusat.',
          'Informasi administratif perpajakan yang diperlukan untuk pemotongan serta penerbitan bukti potong PPh Pasal 21 dan PPh Pasal 23.',
        ],
      },
      {
        id: 'privacy-2-4',
        title: '2.4 Data Akun Media Sosial & Bukti Pelacakan Tayangan',
        content:
          'Data media sosial yang diproses selama pelaksanaan kampanye:',
        bulletPoints: [
          'Nama pengguna (username) dan tautan profil publik pada TikTok, Instagram Reels, atau YouTube Shorts.',
          'Token verifikasi kepemilikan sementara (KD-XXXX) atau bukti kepemilikan akun saat proses verifikasi.',
          'Tautan unggahan klip, statistik tayangan, interaksi publik, serta tangkapan layar bukti performa dashboard saat cut-off.',
        ],
      },
      {
        id: 'privacy-2-5',
        title: '2.5 Data Teknis & Log Keamanan Sistem',
        content:
          'Informasi teknis yang tercatat otomatis untuk menjaga integritas sistem, keamanan akun, dan pencegahan manipulasi trafik:',
        bulletPoints: [
          'Alamat Protokol Internet (IP address), jenis peramban, dan perangkat akses.',
          'Catatan waktu login, perubahan data pembayaran, dan log audit investigasi anti-fraud.',
        ],
      },
    ],
  },
  {
    id: 'tujuan-pengolahan',
    title: '3. Dasar Hukum & Tujuan Pengolahan Data',
    shortTitle: '3. Tujuan Pengolahan',
    description:
      'Tujuan sah pengolahan data dalam penyelenggaraan kampanye terkelola, QA, rekonsiliasi keuangan, dan kepatuhan hukum.',
    clauses: [
      {
        id: 'privacy-3-1',
        title: '3.1 Pelaksanaan Kampanye Terkelola & Pelaporan Kinerja',
        content:
          'Mengelola onboarding Brand dan Clipper, mencocokkan profil clipper dengan vertikal kampanye, memverifikasi tautan klip melalui QA reviewer, serta mengunci statistik performa saat cut-off untuk menyusun BAST/laporan kepada Brand.',
      },
      {
        id: 'privacy-3-2',
        title: '3.2 Audit Keaslian Tayangan, Masa Sanggah & Anti-Fraud',
        content:
          'Memeriksa keaslian pertumbuhan tayangan dan interaksi guna mendeteksi trafik bot, view farm, boosting berbayar tidak sah, atau duplikasi akun, serta menindaklanjuti klaim keberatan selama masa sanggah.',
      },
      {
        id: 'privacy-3-3',
        title: '3.3 Eksekusi Pembayaran & Administrasi Perpajakan',
        content:
          'Memvalidasi kecocokan identitas rekening/e-wallet sebelum disbursement, mengeksekusi transfer massal atau payout berkala beserta slip rincian pembayaran, dan memenuhi kewajiban pelaporan serta pemotongan PPh Pasal 21/23 sesuai ketentuan fiskal Indonesia.',
      },
    ],
  },
  {
    id: 'penyimpanan-keamanan',
    title: '4. Penyimpanan, Retensi & Keamanan Data',
    shortTitle: '4. Keamanan Data',
    description:
      'Standar enkripsi kredensial, penyimpanan terisolasi untuk dokumen verifikasi keuangan, serta perlindungan privasi antar-pengguna.',
    clauses: [
      {
        id: 'privacy-4-1',
        title: '4.1 Enkripsi Kredensial, Token & Jalur Transmisi',
        content:
          'Kata sandi akun diamankan dengan algoritma hash kriptografis bcrypt, seluruh pertukaran data melalui TLS terenkripsi, dan token autentikasi/OTP di-hash menggunakan SHA-256 dengan masa berlaku singkat.',
      },
      {
        id: 'privacy-4-2',
        title: '4.2 Penyimpanan Privat Dokumen Verifikasi Rekening (KYC)',
        content:
          'Foto bukti kepemilikan rekening bank atau profil e-wallet disimpan di cloud storage privat tanpa akses publik dan hanya dapat ditinjau secara terbatas oleh tim operasional/Administrator berwenang untuk proses verifikasi keuangan.',
      },
      {
        id: 'privacy-4-3',
        title: '4.3 Perlindungan Data Clipper terhadap Klien & Jaminan Tanpa Penjualan Data',
        content:
          'Sesuai standar operasional BM-001 Bab 13.5.7, Klipday membatasi akses data pribadi clipper dan melarang keras pihak Brand menghubungi clipper secara langsung di luar jalur Klipday untuk mengubah kesepakatan kampanye. Klipday tidak pernah menjual, menyewakan, atau memperdagangkan data pribadi pengguna kepada pihak ketiga mana pun.',
      },
      {
        id: 'privacy-4-4',
        title: '4.4 Masa Retensi Data Operasional & Fiskal',
        content:
          'Data profil disimpan selama akun berstatus aktif. Catatan transaksi keuangan, rekonsiliasi invoice, bukti transfer disbursement, serta bukti potong pajak disimpan sekurang-kurangnya 5 (lima) tahun atau sesuai batas waktu ketentuan pembukuan dan perpajakan di Indonesia.',
      },
    ],
  },
  {
    id: 'pembagian-data',
    title: '5. Pembagian Data kepada Mitra Resmi & Pihak Berwenang',
    shortTitle: '5. Pembagian Data',
    description:
      'Lingkup terbatas pembagian data yang diperlukan untuk pembayaran, pelaporan klien, dan kepatuhan regulasi.',
    clauses: [
      {
        id: 'privacy-5-1',
        title: '5.1 Bank Korporat & Penyedia Jasa Pembayaran Berizin',
        content:
          'Data rekening/e-wallet dan nominal pembayaran diteruskan secara aman melalui rekonsiliasi CSV terenkripsi atau integrasi resmi kepada perbankan korporat (seperti BCA BizChannel atau Mandiri MCM) maupun penyedia layanan disbursement dan payment gateway berizin Bank Indonesia (seperti Xendit, Midtrans, atau Oy!) semata-mata untuk mengeksekusi pencairan atau penerimaan dana.',
      },
      {
        id: 'privacy-5-2',
        title: '5.2 Pelaporan Performa Kampanye kepada Brand',
        content:
          'Brand hanya menerima laporan performa kampanye yang relevan berupa username publik sosial media yang berpartisipasi, tautan unggahan klip, dan statistik tayangan tanpa menyertakan dokumen KYC privat, nomor rekening, atau kontak pribadi clipper.',
      },
      {
        id: 'privacy-5-3',
        title: '5.3 Kewajiban Pajak & Perintah Hukum yang Sah',
        content:
          'Data transaksi yang diwajibkan hukum dapat diproses dalam rangka pelaporan perpajakan (PPh 21/23) oleh konsultan atau otoritas pajak resmi, maupun dibuka apabila terdapat perintah sah dari pengadilan atau lembaga penegak hukum Republik Indonesia.',
      },
    ],
  },
  {
    id: 'hak-subjek-data',
    title: '6. Hak Subjek Data Pribadi (Pasal 5–14 UU PDP)',
    shortTitle: '6. Hak Subjek Data',
    description:
      'Hak pengguna untuk mengakses, memperbaiki, menghapus, maupun menarik persetujuan pemrosesan data.',
    clauses: [
      {
        id: 'privacy-6-1',
        title: '6.1 Hak Informasi, Akses & Perbaikan Data',
        content:
          'Pengguna berhak memperoleh kejelasan tujuan pemrosesan data, mengakses salinan ringkasan data profilnya, serta memperbaiki atau memperbarui data kontak dan informasi rekening yang tidak akurat (perubahan data rekening diproses maksimal 2 hari kerja).',
      },
      {
        id: 'privacy-6-2',
        title: '6.2 Hak Penghapusan Data & Penarikan Persetujuan',
        content:
          'Pengguna dapat mengajukan penutupan akun, penghapusan data pribadi, atau penarikan persetujuan pemrosesan data tertentu dengan menghubungi Klipday, sepanjang tidak bertentangan dengan kewajiban penyelesaian kontrak kampanye aktif serta retensi pembukuan dan pajak yang diwajibkan undang-undang.',
      },
    ],
  },
  {
    id: 'penggunaan-cookies',
    title: '7. Penggunaan Kuki (Cookies) & Penyimpanan Sesi',
    shortTitle: '7. Kuki & Sesi',
    description:
      'Penggunaan kuki autentikasi esensial untuk menjaga keamanan sesi pengguna.',
    clauses: [
      {
        id: 'privacy-7-1',
        title: '7.1 Kuki Esensial & Keamanan Sesi',
        content:
          'Klipday menggunakan kuki HTTP-only dan penyimpanan sesi esensial untuk menjaga keamanan sesi masuk serta melindungi akun dari penyalahgunaan lintas situs, tanpa memasang kuki pelacak iklan pihak ketiga.',
      },
    ],
  },
  {
    id: 'kontak-privasi',
    title: '8. Kontak & SLA Permohonan Privasi',
    shortTitle: '8. Kontak Privasi',
    description:
      'Saluran resmi korespondensi privasi dan target waktu tanggapan tim Klipday.',
    clauses: [
      {
        id: 'privacy-8-1',
        title: '8.1 Saluran Permohonan Data & Waktu Tanggapan',
        content:
          'Permohonan pelaksanaan hak subjek data, klarifikasi privasi, atau pengaduan keamanan informasi dapat dikirimkan melalui pos elektronik resmi: privacy@klipday.com. Setelah identitas pemohon diverifikasi, tim Klipday memberikan tanggapan awal dalam waktu maksimal 3 (tiga) hari kerja (Senin–Jumat, di luar hari libur nasional).',
      },
    ],
  },
] as const;
