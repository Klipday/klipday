import type { LegalDocumentSection } from '../types';

/**
 * Last revision date for the Terms of Service.
 */
export const TERMS_LAST_UPDATED = '7 November 2026';

/**
 * Structured sections for Klipday Terms of Service (Syarat & Ketentuan Layanan).
 * Fully aligned with Indonesian contract law, UU PDP No. 27/2022, and Klipday's
 * two-sided marketplace architecture.
 */
export const TERMS_SECTIONS: readonly LegalDocumentSection[] = [
  {
    id: 'definisi-platform',
    title: '1. Definisi & Ketentuan Umum Platform',
    shortTitle: '1. Definisi Platform',
    description:
      'Ketentuan umum dan batasan peran platform Klipday sebagai marketplace video clipping dua sisi.',
    clauses: [
      {
        id: 'terms-1-1',
        title: '1.1 Marketplace Video Clipping Dua Sisi',
        content:
          'Klipday adalah platform marketplace teknologi dua sisi (two-sided marketplace) yang memfasilitasi kolaborasi promosi digital antara Brand (pengiklan pemilik produk/layanan) dan Kreator atau Clipper (pembuat dan penyunting konten video pendek). Klipday bertindak sebagai perantara berbasis sistem teknologi dan bukan merupakan agensi periklanan langsung maupun pemberi kerja.',
      },
      {
        id: 'terms-1-2',
        title: '1.2 Pengguna Platform',
        content:
          'Pengguna Klipday mencakup Brand dan Kreator/Clipper yang telah menyelesaikan proses registrasi akun resmi. Setiap Pengguna tunduk pada seluruh syarat, pedoman komunitas, serta kebijakan operasional yang berlaku di Klipday.',
      },
      {
        id: 'terms-1-3',
        title: '1.3 Persetujuan atas Syarat & Ketentuan',
        content:
          'Dengan mendaftar, mengakses, atau menggunakan layanan Klipday, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh isi Syarat & Ketentuan ini secara sadar dan tanpa paksaan. Jika Anda tidak menyetujui ketentuan ini, Anda tidak diperkenankan menggunakan platform Klipday.',
      },
    ],
  },
  {
    id: 'ketentuan-akun',
    title: '2. Ketentuan Akun & Batas Usia 18+',
    shortTitle: '2. Ketentuan Akun',
    description:
      'Kriteria kelayakan pendaftaran, kepatuhan batas usia dewasa legal, dan integritas akun tunggal.',
    clauses: [
      {
        id: 'terms-2-1',
        title: '2.1 Batas Usia Minimum 18 Tahun (UU PDP No. 27/2022 & KUHPerdata)',
        content:
          'Setiap pengguna Klipday wajib berusia minimal 18 (delapan belas) tahun atau telah cakap menurut hukum yang berlaku di Republik Indonesia. Ketentuan ini diberlakukan demi mematuhi ketentuan perlindungan data anak di bawah umur dalam UU No. 27/2022 tentang Pelindungan Data Pribadi (UU PDP) serta keabsahan perjanjian hukum perdata.',
      },
      {
        id: 'terms-2-2',
        title: '2.2 Larangan Akun Ganda (Anti-Multi Accounting)',
        content:
          'Setiap individu atau badan hukum hanya berhak memiliki dan mengoperasikan 1 (satu) akun terdaftar di Klipday. Dilarang keras membuat banyak akun untuk tujuan memanipulasi kuota kampanye, menduplikasi penyerahan video, atau merekayasa sistem referral.',
      },
      {
        id: 'terms-2-3',
        title: '2.3 Keamanan Kredensial & Tanggung Jawab Akun',
        content:
          'Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi, kode OTP, dan akses akun masing-masing. Seluruh aktivitas yang terjadi di bawah akun pengguna dianggap sebagai tindakan sah dari pemilik akun yang bersangkutan.',
      },
    ],
  },
  {
    id: 'hak-kewajiban-brand',
    title: '3. Hak & Kewajiban Brand',
    shortTitle: '3. Ketentuan Brand',
    description:
      'Ketentuan alokasi anggaran escrow, standar kurasi klip, dan pengembalian sisa dana promosi.',
    clauses: [
      {
        id: 'terms-3-1',
        title: '3.1 Alokasi Anggaran Escrow Terkunci 100% di Muka',
        content:
          'Brand wajib menyetorkan dan mengunci 100% anggaran kampanye ke dalam sistem Escrow Klipday sebelum kampanye dipublikasikan ke marketplace. Anggaran promosi ini dijamin aman dan hanya dicairkan kepada kreator atas views organik video yang telah disetujui.',
      },
      {
        id: 'terms-3-2',
        title: '3.2 Hak dan Batas Kurasi Submisi (Maksimal Revisi 2 Kali)',
        content:
          'Brand berhak meninjau, menyetujui, menolak dengan alasan objektif, atau meminta revisi atas video yang diajukan oleh kreator. Demi keadilan kerja kreator, permintaan revisi dibatasi maksimal sebanyak 2 (dua) kali per submisi dengan catatan instruksi yang terukur.',
      },
      {
        id: 'terms-3-3',
        title: '3.3 Standar Waktu Kurasi Brand (SLA 3x24 Jam Kerja)',
        content:
          'Brand berkewajiban melakukan kurasi terhadap klip video yang masuk dalam waktu maksimal 3x24 jam kerja. Apabila Brand tidak merespons dalam batas waktu tersebut, sistem Klipday berhak melakukan persetujuan otomatis demi melindungi hak kreator.',
      },
      {
        id: 'terms-3-4',
        title: '3.4 Larangan Konten & Produk Ilegal',
        content:
          'Brand dilarang keras membuat kampanye atau membagikan materi video yang memuat produk atau muatan terlarang berikut:',
        bulletPoints: [
          'Judi online, kasino virtual, taruhan, atau permainan slot.',
          'Obat keras atau suplemen tanpa izin edar resmi BPOM dan Kementerian Kesehatan RI.',
          'Skema ponzi, investasi ilegal, atau penggandaan uang tanpa izin OJK.',
          'Pornografi, muatan asusila, atau kekerasan eksplisit.',
          'Ujaran kebencian, diskriminasi SARA, atau pencemaran nama baik.',
          'Pelanggaran hak cipta, merek dagang, atau kekayaan intelektual pihak ketiga.',
        ],
      },
      {
        id: 'terms-3-5',
        title: '3.5 Pengembalian Otomatis Sisa Anggaran (Auto-Refund 100%)',
        content:
          'Ketika masa tayang kampanye berakhir atau ditutup (settlement), seluruh sisa anggaran yang belum terserap oleh views kreator akan secara otomatis dikembalikan 100% ke saldo dompet Brand tanpa potongan penalti administrasi.',
      },
    ],
    callout: {
      title: 'Jaminan Proteksi Escrow 100%',
      description:
        'Seluruh anggaran promosi Brand tersimpan aman di escrow Klipday dan hanya dicairkan atas penayangan organik yang valid. Sisa anggaran yang belum terserap dijamin kembali utuh 100% ke saldo dompet Brand saat settlement.',
    },
  },
  {
    id: 'hak-kewajiban-kreator',
    title: '4. Hak & Kewajiban Kreator (Clipper)',
    shortTitle: '4. Ketentuan Kreator',
    description:
      'Tata cara penyerahan video post-first, verifikasi kepemilikan akun sosial, dan imbalan komisi.',
    clauses: [
      {
        id: 'terms-4-1',
        title: '4.1 Model Post-First ke Akun TikTok Pribadi',
        content:
          'Klipday menggunakan model Post-First: kreator wajib mempublikasikan video editan secara publik ke akun TikTok pribadi mereka terlebih dahulu, kemudian menyetorkan tautan video aktif (live video URL) ke halaman kampanye di platform Klipday.',
      },
      {
        id: 'terms-4-2',
        title: '4.2 Verifikasi Kepemilikan Akun Sosial via Kode Bio (KD-XXXX)',
        content:
          'Guna membuktikan kepemilikan akun dan mencegah pembajakan username orang lain, kreator wajib mencantumkan kode token sementara (contoh: KD-XXXX, berlaku 10 menit) di bio profil TikTok saat menghubungkan akun. Setelah verifikasi sukses, kode dapat langsung dihapus dari bio.',
      },
      {
        id: 'terms-4-3',
        title: '4.3 Larangan Menghapus atau Memprivat Video Disetujui',
        content:
          'Video yang telah disetujui oleh Brand dilarang keras untuk dihapus, diarsipkan, atau diubah status privasinya (menjadi private atau friends-only) selama masa kampanye aktif. Pelanggaran ketentuan ini berakibat penghentian kalkulasi views dan pembatalan komisi terkait.',
      },
      {
        id: 'terms-4-4',
        title: '4.4 Standar Kreativitas Editing & Anti-Reupload Mentahan',
        content:
          'Video yang disetorkan wajib melalui proses penyuntingan kreatif nyata (seperti penambahan hook pembuka, pemotongan ritme, subtitle narasi, atau sound effect pendukung). Dilarang keras mengunggah ulang mentahan video tanpa proses edit atau mencuri klip editan milik kreator lain.',
      },
      {
        id: 'terms-4-5',
        title: '4.5 Perhitungan Imbalan Komisi Berbasis CPM Views Organik',
        content:
          'Imbalan kreator dihitung secara transparan berdasarkan tarif Cost Per Mille (CPM) per 1.000 penayangan valid yang ditetapkan oleh Brand, dikalikan dengan akumulasi penayangan organik yang diverifikasi secara berkala oleh sistem penjejak Klipday.',
      },
    ],
  },
  {
    id: 'anti-fraud',
    title: '5. Anti-Fraud & Integritas Metrik Penayangan',
    shortTitle: '5. Anti-Fraud & Metrik',
    description:
      'Larangan manipulasi penayangan artifisial, deteksi kecurangan otomatis, dan sanksi diskualifikasi.',
    clauses: [
      {
        id: 'terms-5-1',
        title: '5.1 Keharusan Views Organik Nyata',
        content:
          'Seluruh penayangan (views) yang dihitung sebagai dasar komisi wajib berasal dari penonton manusia nyata di platform TikTok melalui distribusi algoritma FYP dan penjelajahan organik.',
      },
      {
        id: 'terms-5-2',
        title: '5.2 Larangan Praktik Manipulatif & Rekayasa Trafik',
        content:
          'Kreator dilarang keras merekayasa penayangan video dengan metode manipulatif apa pun, termasuk namun tidak terbatas pada:',
        bulletPoints: [
          'Penggunaan bot views otomatis atau generator lalu lintas palsu.',
          'Script auto-refresh peramban atau reload berkala paksa.',
          'Jaringan pertukaran tayangan artifisial (engagement pods / view-for-view).',
          'Manipulasi lalu lintas melalui proxy, VPN terdistribusi, atau jaringan emulator.',
        ],
      },
      {
        id: 'terms-5-3',
        title: '5.3 Sanksi Diskualifikasi, Pembatalan Saldo & Penangguhan Akun',
        content:
          'Sistem Klipday memantau pola anomali trafik secara berkelanjutan. Jika ditemukan indikasi manipulasi, Klipday berhak secara mutlak mendiskualifikasi video terkait (status REJECTED), membatalkan seluruh saldo komisi yang dihasilkan tanpa ganti rugi, serta membekukan atau menonaktifkan akun pelaku secara permanen.',
      },
    ],
    callout: {
      title: 'Toleransi Nol atas Manipulasi Trafik',
      description:
        'Sistem penjejak Klipday mengaudit lonjakan dan integritas views secara otomatis. Praktik manipulasi penayangan berakibat diskualifikasi submisi tanpa kompensasi dan penutupan akun permanen.',
    },
  },
  {
    id: 'keuangan-penarikan',
    title: '6. Keuangan & Ketentuan Pencairan Saldo (Withdrawal)',
    shortTitle: '6. Pencairan Saldo',
    description:
      'Syarat batas minimum penarikan, verifikasi identitas KYC, dan perlindungan anti-double payout.',
    clauses: [
      {
        id: 'terms-6-1',
        title: '6.1 Batas Minimum Pencairan Dana (Rp 50.000)',
        content:
          'Kreator dapat mengajukan penarikan saldo dompet kapan saja setelah akumulasi saldo komisi yang valid mencapai batas minimal Rp 50.000, tanpa perlu menunggu periode tutup buku akhir bulan.',
      },
      {
        id: 'terms-6-2',
        title: '6.2 Verifikasi Identitas (KYC) Sebelum Penarikan Pertama',
        content:
          'Demi mematuhi regulasi keuangan perbankan dan pencegahan pencucian uang, pengguna wajib menyelesaikan verifikasi identitas (KYC) dengan mengunggah foto KTP yang valid sebelum pengajuan penarikan dana pertama kali dapat diproses.',
      },
      {
        id: 'terms-6-3',
        title: '6.3 Kesesuaian Nama Rekening Bank / E-Wallet',
        content:
          'Nama pemilik pada rekening bank atau akun e-wallet tujuan penarikan wajib identik dengan nama legal pada identitas profil KYC pengguna:',
        bulletPoints: [
          'Rekening bank konvensional maupun syariah nasional (BCA, Mandiri, BRI, BNI, CIMB Niaga, Permata, dsb.).',
          'Dompet digital terdaftar resmi (DANA, GoPay, OVO, ShopeePay).',
          'Pencairan dana ke rekening perantara atau pihak ketiga yang tidak selaras akan ditolak otomatis oleh sistem.',
        ],
      },
      {
        id: 'terms-6-4',
        title: '6.4 Proteksi Terkontrol Anti Double-Payout',
        content:
          'Setiap permohonan penarikan yang telah diajukan akan berstatus terkunci dan tidak dapat dibatalkan secara sepihak oleh pengguna tanpa verifikasi administratif, demi melindungi catatan perbankan dan mencegah risiko pembayaran ganda.',
      },
      {
        id: 'terms-6-5',
        title: '6.5 Waktu Pemrosesan Payout (SLA 1x24 Jam Hari Kerja)',
        content:
          'Penarikan dana yang memenuhi seluruh syarat akan diproses oleh tim keuangan Klipday dalam waktu maksimal 1x24 jam pada hari kerja, disertai nomor referensi transaksi perbankan resmi.',
      },
    ],
  },
  {
    id: 'kekayaan-intelektual',
    title: '7. Hak Kekayaan Intelektual & Lisensi Konten',
    shortTitle: '7. Hak Intelektual',
    description:
      'Ketentuan kepemilikan materi video, lisensi penggunaan materi promosi, dan tanggung jawab hak cipta.',
    clauses: [
      {
        id: 'terms-7-1',
        title: '7.1 Lisensi Materi Brand untuk Kebutuhan Promosi',
        content:
          'Brand memberikan lisensi terbatas, non-eksklusif, dan bebas royalti kepada Klipday dan kreator yang berpartisipasi semata-mata untuk mengolah, menyunting, dan mempublikasikan materi video sesuai arahan kampanye yang disetujui.',
      },
      {
        id: 'terms-7-2',
        title: '7.2 Tanggung Jawab Hak Cipta Suara & Elemen Tambahan',
        content:
          'Kreator bertanggung jawab memastikan bahwa elemen musik latar, efek suara, atau grafis tambahan yang disisipkan ke dalam video mematuhi kebijakan hak cipta dan ketentuan penggunaan komersial di platform TikTok.',
      },
    ],
  },
  {
    id: 'penyelesaian-sengketa',
    title: '8. Hukum yang Berlaku & Penyelesaian Sengketa',
    shortTitle: '8. Hukum & Sengketa',
    description:
      'Yurisdiksi hukum Republik Indonesia dan mekanisme mediasi musyawarah mufakat.',
    clauses: [
      {
        id: 'terms-8-1',
        title: '8.1 Hukum yang Berlaku',
        content:
          'Syarat & Ketentuan ini diatur dan ditafsirkan sepenuhnya berdasarkan hukum yang berlaku di Negara Kesatuan Republik Indonesia.',
      },
      {
        id: 'terms-8-2',
        title: '8.2 Musyawarah untuk Mufakat',
        content:
          'Apabila terjadi perselisihan atau perbedaan penafsiran antara Pengguna dan Klipday terkait pelaksanaan layanan, para pihak sepakat untuk menyelesaikannya secara damai melalui musyawarah mufakat dalam kurun waktu 30 (tiga puluh) hari kalender.',
      },
      {
        id: 'terms-8-3',
        title: '8.3 Domisili Hukum Pengadilan',
        content:
          'Apabila sengketa tidak dapat diselesaikan melalui musyawarah mufakat, para pihak sepakat untuk memilih domisili hukum yang tetap dan umum pada Pengadilan Negeri di wilayah hukum Republik Indonesia yang berwenang.',
      },
    ],
  },
];
