import type { AccordionGroupSection } from '../types';

/**
 * 5 complete, structured platform rule sections for Klipday.
 * Adheres strictly to real platform mechanics (Escrow, Post-First TikTok,
 * KD-XXXX bio verification, 2x revision limit, age 18+ privacy under UU PDP 27/2022,
 * anti-double payout guard, and genuine organic view integrity).
 */
export const PLATFORM_RULES_SECTIONS: readonly AccordionGroupSection[] = [
  {
    id: 'rules-account-eligibility',
    title: '1. Kelayakan Akun & Data Pribadi',
    itemCountText: '4 Ketentuan',
    items: [
      {
        id: 'rule-1-1',
        title: '1.1 Batas Usia Minimal 18 Tahun (UU PDP No. 27/2022)',
        content:
          'Setiap pengguna platform (baik Creator maupun Brand) wajib berusia minimal 18 tahun pada saat mendaftar. Data tanggal lahir diverifikasi saat pengisian profil KYC, disimpan secara strictly private, dan tidak pernah dibagikan kepada pihak Brand maupun publik sesuai dengan regulasi pelindungan data pribadi di Indonesia.',
      },
      {
        id: 'rule-1-2',
        title: '1.2 Kebijakan Satu Identitas Akun (Anti-Multi Accounting)',
        content:
          'Setiap individu atau badan usaha hanya diperbolehkan memiliki satu akun terdaftar di Klipday. Dilarang keras membuat akun ganda untuk memanipulasi kuota pendaftaran campaign, mengeksploitasi sistem referral, atau membagi video yang sama ke beberapa akun.',
      },
      {
        id: 'rule-1-3',
        title: '1.3 Kesesuaian Nama Rekening Pencairan & KYC',
        content:
          'Nama pemilik pada rekening bank atau akun e-wallet yang didaftarkan untuk pencairan saldo wajib identik dengan nama legal pada profil akun pengguna. Hal ini diberlakukan demi menjamin keamanan transaksi dan memenuhi ketentuan regulasi keuangan serta Anti-Pencucian Uang.',
      },
      {
        id: 'rule-1-4',
        title: '1.4 Keamanan Akun & Kerahasiaan Kredensial',
        content:
          'Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi dan akses email akun masing-masing. Segala tindakan, pengajuan video, atau transaksi penarikan saldo yang dilakukan melalui akun yang terautentikasi sah dianggap sebagai instruksi resmi dari pemilik akun.',
      },
    ],
  },
  {
    id: 'rules-creator-submission',
    title: '2. Pedoman Creator & Video Submission',
    itemCountText: '6 Ketentuan',
    items: [
      {
        id: 'rule-2-1',
        title: '2.1 Alur Pengunggahan Post-First ke Akun TikTok Pribadi',
        content:
          'Klipday menerapkan model Post-First: kreator wajib mempublikasikan video editan ke akun TikTok pribadi mereka secara publik (bukan private, bukan friends-only, dan bukan draft) terlebih dahulu, baru kemudian menyetorkan tautan (live video URL) ke halaman campaign di Klipday.',
      },
      {
        id: 'rule-2-2',
        title: '2.2 Verifikasi Kepemilikan Akun TikTok Lewat Kode Bio (KD-XXXX)',
        content:
          'Untuk membuktikan kepemilikan akun sosial dan mencegah pembajakan username orang lain, kreator wajib mencantumkan kode verifikasi unik sementara (contoh: KD-XXXX, masa berlaku 10 menit) di bio profil TikTok saat menghubungkan akun. Setelah verifikasi berhasil terhubung, kode tersebut dapat langsung dihapus dari bio.',
      },
      {
        id: 'rule-2-3',
        title: '2.3 Kepatuhan Terhadap Brief, Hashtag & Tag Akun Brand',
        content:
          'Video editan wajib mematuhi seluruh arahan kreatif (creative brief) dari Brand, termasuk mencantumkan tagar wajib (#hashtag), mention tag akun Brand (@mention), serta ajakan bertindak (Call to Action) yang tertera pada panduan campaign.',
      },
      {
        id: 'rule-2-4',
        title: '2.4 Standar Kualitas Editing & Larangan Re-Upload Mentahan',
        content:
          'Kreator dilarang keras mengunggah ulang mentahan materi video produk tanpa proses editing nyata. Video harus menampilkan kreativitas clipping (seperti hook pembuka yang memikat, pacing potongan ritme, subtitle narasi, atau sound effect pendukung). Mengambil atau mencuri editan milik kreator lain dilarang keras.',
      },
      {
        id: 'rule-2-5',
        title: '2.5 Ketentuan Masa Tayang Video (Larangan Hapus/Private Video)',
        content:
          'Video yang telah disetujui oleh Brand dilarang dihapus, diarsipkan, atau diubah status privasinya menjadi privat selama masa campaign aktif berlangsung. Menghapus atau memprivat video akan menghentikan pencatatan views dan membatalkan komisi yang belum dicairkan.',
      },
      {
        id: 'rule-2-6',
        title: '2.6 Batas Maksimal Revisi Klip (Maksimal 2 Kali)',
        content:
          'Brand memiliki hak untuk mengajukan permintaan revisi maksimal sebanyak 2 kali dengan menyertakan catatan evaluasi yang jelas. Kreator wajib menindaklanjuti revisi tersebut dan menyetorkan tautan video perbaikan sebelum tenggat waktu yang ditentukan.',
      },
    ],
  },
  {
    id: 'rules-view-integrity',
    title: '3. Keaslian Penayangan & Larangan Manipulasi Views',
    itemCountText: '3 Ketentuan',
    items: [
      {
        id: 'rule-3-1',
        title: '3.1 Keaslian Penayangan (Views Organik Nyata)',
        content:
          'Seluruh penayangan (views) yang dihitung sebagai dasar komisi wajib berasal dari penayangan organik asli oleh penonton nyata di platform TikTok, yang dihasilkan dari daya tarik konten dan distribusi algoritma FYP.',
      },
      {
        id: 'rule-3-2',
        title: '3.2 Larangan Manipulasi Views & Rekayasa Trafik',
        content:
          'Kreator dilarang keras melakukan segala bentuk rekayasa atau manipulasi jumlah tayangan, termasuk membeli views palsu, menggunakan script/aplikasi pemicu views otomatis, atau bergabung dalam grup pertukaran tayangan artifisial (engagement pods).',
      },
      {
        id: 'rule-3-3',
        title: '3.3 Peninjauan Pelanggaran & Sanksi Penonaktifan Akun',
        content:
          'Apabila ditemukan indikasi manipulasi tayangan atau kecurangan data pada video yang disetorkan, Klipday berhak melakukan peninjauan, mendiskualifikasi video (status REJECTED), membatalkan seluruh komisi yang dihasilkan video terkait, serta menonaktifkan akun pelaku secara permanen.',
      },
    ],
  },
  {
    id: 'rules-brand-guidelines',
    title: '4. Pedoman Brand & Pembuatan Campaign',
    itemCountText: '5 Ketentuan',
    items: [
      {
        id: 'rule-4-1',
        title: '4.1 Jaminan Sistem Escrow 100% di Muka',
        content:
          'Seluruh anggaran campaign yang ditetapkan oleh Brand wajib disetorkan dan dikunci 100% di dalam sistem Escrow Klipday sebelum status campaign dinyatakan aktif dan tayang di marketplace.',
      },
      {
        id: 'rule-4-2',
        title: '4.2 Kategori Produk & Konten yang Dilarang Keras',
        content:
          'Brand dilarang mengiklankan produk atau layanan ilegal, judi online/slot, obat-obatan atau kosmetik tanpa izin edar resmi BPOM/Kemenkes, skema cepat kaya/investasi bodong/ponzi, konten pornografi/asusila, serta ujaran kebencian/SARA. Pelanggaran berakibat pembatalan campaign tanpa pengembalian dana.',
      },
      {
        id: 'rule-4-3',
        title: '4.3 Kewajiban Penyediaan Aset Video Mentahan & Brief yang Jelas',
        content:
          'Brand berkewajiban menyediakan materi video mentah (raw footage) berkualitas memadai, panduan pesan utama yang akurat, serta aturan Do & Don\'t yang jelas dan tidak menyesatkan bagi para kreator.',
      },
      {
        id: 'rule-4-4',
        title: '4.4 Standar Waktu Kurasi Brand (SLA Maksimal 3x24 Jam)',
        content:
          'Brand wajib melakukan kurasi terhadap setiap klip video yang disetorkan oleh kreator dalam kurun waktu maksimal 3 hari kerja (SLA 3x24 jam), baik untuk menyetujui (Approve), meminta revisi (Revision), atau menolak (Reject) dengan alasan objektif.',
      },
      {
        id: 'rule-4-5',
        title: '4.5 Pengembalian Otomatis Sisa Budget (100% Auto-Refund)',
        content:
          'Jika masa campaign telah berakhir atau target penayangan selesai dan anggaran campaign masih tersisa, seluruh sisa dana yang tidak terpakai akan secara otomatis dikembalikan 100% ke saldo dompet Brand tanpa potongan penalti.',
      },
    ],
  },
  {
    id: 'rules-financial-payouts',
    title: '5. Finansial, Dompet & Pencairan Dana (Payouts)',
    itemCountText: '4 Ketentuan',
    items: [
      {
        id: 'rule-5-1',
        title: '5.1 Batas Minimum Pencairan Dana (Rp 50.000)',
        content:
          'Kreator dapat mengajukan penarikan saldo dompet kapan saja setelah akumulasi komisi verified views mencapai batas minimal Rp 50.000, tanpa perlu menunggu jadwal tanggal tertentu di akhir bulan.',
      },
      {
        id: 'rule-5-2',
        title: '5.2 Metode Pembayaran & Rekening Payout yang Didukung',
        content:
          'Pencairan dana mendukung rekening seluruh bank nasional terkemuka (seperti BCA, Mandiri, BRI, BNI, Jago, SeaBank) serta akun e-wallet resmi (DANA, GoPay, OVO, ShopeePay) yang telah lolos verifikasi rekening.',
      },
      {
        id: 'rule-5-3',
        title: '5.3 Prosedur Pembatalan Penarikan Terkontrol (Anti-Double Payout)',
        content:
          'Untuk melindungi integritas pencatatan kas perbankan dan mencegah risiko double payout, penarikan yang sudah diajukan tidak dapat dibatalkan sepihak secara instan. Permohonan pembatalan akan diproses dengan status "Menunggu Pembatalan" dan disetujui oleh tim Admin sebelum saldo dikembalikan ke dompet.',
      },
      {
        id: 'rule-5-4',
        title: '5.4 Waktu Pemrosesan & Bukti Transfer Resmi',
        content:
          'Setiap permohonan penarikan dana diproses maksimal 1x24 jam pada hari kerja setelah diverifikasi oleh tim keuangan, lengkap dengan kode referensi unik transaksi dan bukti transfer resmi perbankan.',
      },
    ],
  },
] as const;
