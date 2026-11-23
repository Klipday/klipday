import type { LegalDocumentSection } from '../types';

/**
 * Last revision date for the Terms of Service.
 */
export const TERMS_LAST_UPDATED = '23 November 2026';

/**
 * Structured sections for Klipday Terms of Service (Syarat & Ketentuan Layanan)
 * aligned with KlipDay — Model Bisnis dan Standar Operasional (BM-001).
 */
export const TERMS_SECTIONS: readonly LegalDocumentSection[] = [
  {
    id: 'definisi-platform',
    title: '1. Definisi, Model Layanan Terkelola & Ruang Lingkup',
    shortTitle: '1. Ruang Lingkup Layanan',
    description:
      'Ketentuan umum mengenai peran Klipday sebagai agensi dan platform layanan clipping terkelola bagi Brand dan Clipper.',
    clauses: [
      {
        id: 'terms-1-1',
        title: '1.1 Layanan Clipping Terkelola (Managed Service Agency)',
        content:
          'Klipday adalah agensi dan platform layanan clipping terkelola yang menghubungkan Brand (Klien) dengan jaringan Clipper terkurasi untuk mendistribusikan konten video pendek dalam skala besar di TikTok, Instagram Reels, YouTube Shorts, dan platform lain yang disepakati. Klipday menjalankan operasi terkelola melalui tim internal dan Account Manager, bukan sekadar marketplace swalayan lepas.',
      },
      {
        id: 'terms-1-2',
        title: '1.2 Cakupan Layanan yang Disediakan',
        content:
          'Layanan Klipday mencakup penyelenggaraan kampanye secara menyeluruh sejak perencanaan hingga pelunasan imbalan:',
        bulletPoints: [
          'Perencanaan strategi dan penyusunan kampanye serta brief bersama Brand.',
          'Rekrutmen, verifikasi kepemilikan akun, penilaian tier/kinerja, dan pengelolaan jaringan clipper.',
          'Peninjauan kualitas (Quality Assurance), kelengkapan brief, dan moderasi konten yang masuk.',
          'Verifikasi tayangan, pelaporan kinerja berkala/akhir, dan rekonsiliasi pembayaran.',
          'Pengelolaan penyaluran pembayaran (payout) kepada clipper beserta administrasi perpajakan terkait.',
        ],
      },
      {
        id: 'terms-1-3',
        title: '1.3 Batasan & Pengecualian Ruang Lingkup',
        content:
          'Kecuali disepakati secara tertulis dalam perjanjian terpisah, layanan standar Klipday tidak mencakup pembelian media/iklan berbayar (paid ads) atas nama Brand, produksi konten long-form asli (seperti syuting dan penyuntingan video master), maupun pengelolaan akun media sosial resmi milik Brand.',
      },
    ],
  },
  {
    id: 'ketentuan-akun',
    title: '2. Ketentuan Akun, Verifikasi & SLA Akun Clipper',
    shortTitle: '2. Ketentuan & SLA Akun',
    description:
      'Kriteria kelayakan akun tunggal, batas usia dewasa 18+, validasi kepemilikan media sosial, dan waktu layanan akun.',
    clauses: [
      {
        id: 'terms-2-1',
        title: '2.1 Batas Usia Minimal 18 Tahun & Kecakapan Hukum',
        content:
          'Setiap pengguna Klipday wajib berusia minimal 18 (delapan belas) tahun dan cakap bertindak menurut hukum Republik Indonesia guna mematuhi ketentuan perlindungan data anak dalam UU No. 27/2022 tentang Pelindungan Data Pribadi (UU PDP).',
      },
      {
        id: 'terms-2-2',
        title: '2.2 Kebijakan Satu Akun per Pengguna & Larangan Akun Ganda',
        content:
          'Setiap individu maupun badan usaha hanya diperbolehkan mendaftarkan dan mengoperasikan 1 (satu) akun Klipday dengan data identitas serta kontak yang benar dan terbaru. Dilarang memakai akun media sosial milik pihak lain, membuat akun palsu/ganda untuk menggandakan klaim pendapatan, atau menghindari pembatasan sistem.',
      },
      {
        id: 'terms-2-3',
        title: '2.3 SLA Pendaftaran, Verifikasi Akun & Banding Penangguhan',
        content:
          'Seluruh target SLA menggunakan hari kerja (Senin–Jumat, di luar hari libur nasional) terhitung sejak data atau materi lengkap diterima:',
        bulletPoints: [
          'Pendaftaran dan pemeriksaan awal kelengkapan akun: maksimal 2 hari kerja.',
          'Verifikasi kepemilikan akun sosial (kode bio KD-XXXX / bukti akses): maksimal 2 hari kerja sejak bukti diterima.',
          'Perubahan data akun atau rekening pembayaran: maksimal 2 hari kerja (efektif setelah lolos validasi kecocokan identitas).',
          'Banding atas penangguhan akun: tanggapan awal maksimal 3 hari kerja dengan rincian dasar tindakan yang dapat dibagikan.',
        ],
      },
    ],
  },
  {
    id: 'hak-kewajiban-brand',
    title: '3. Hak, Kewajiban & Aturan Brand / Klien',
    shortTitle: '3. Aturan Brand & Klien',
    description:
      'Ketentuan brief, struktur biaya agensi, SLA verifikasi laporan, hak takedown, dan larangan transaksi di luar platform.',
    clauses: [
      {
        id: 'terms-3-1',
        title: '3.1 Kelengkapan Brief Final & Legalitas Materi Sumber',
        content:
          'Sebelum kampanye diluncurkan, Brand wajib menyerahkan brief final, tujuan, target audiens, platform, aset beserta hak penggunaannya, klaim produk yang disetujui, larangan, hashtag, disclosure, durasi, KPI, anggaran, dan tenggat. Brand menjamin seluruh materi, merek dagang, musik, rekaman, serta klaim produk dapat digunakan secara sah dan membebaskan Klipday dari tuntutan pihak ketiga atas aset yang diserahkan Brand.',
      },
      {
        id: 'terms-3-2',
        title: '3.2 Struktur Harga, Minimum Anggaran & Biaya Tambahan',
        content:
          'Brand menyetujui secara tertulis anggaran, tarif CPM, management fee agensi (paket awal 30%), batas payout per klip bila ada, ambang kelayakan, serta term pembayaran sebelum peluncuran. Minimum budget paket awal adalah Rp 1.000.000 untuk estimasi durasi 1–3 bulan. Kampanye dengan tenggat di bawah 30 hari dikenakan rush fee 10–15%, dan vertikal kepatuhan tinggi (seperti fintech atau kesehatan) dapat dikenai premi risiko atau ditolak.',
      },
      {
        id: 'terms-3-3',
        title: '3.3 PIC Pengambil Keputusan & SLA Verifikasi Brand',
        content:
          'Brand menunjuk 1 (satu) pengambil keputusan utama dan menyampaikan umpan balik atau verifikasi laporan serta klip secara terkonsolidasi maksimal dalam 3 hari kerja. Keterlambatan persetujuan atau perubahan brief setelah peluncuran memerlukan persetujuan kedua belah pihak dan dapat menggeser jadwal serta capaian kampanye.',
      },
      {
        id: 'terms-3-4',
        title: '3.4 SLA Keuangan Brand & Pengembalian Sisa Deposit',
        content:
          'Cut-off dan penguncian statistik tayangan dilakukan pada tanggal 25, akhir bulan, atau penutupan kampanye sesuai kontrak. Klipday mengirimkan invoice beserta BAST/laporan performa maksimal H+2 hari kerja setelah cut-off, diikuti verifikasi Brand maksimal 3 hari kerja, dan pelunasan sesuai term (deposit di muka atau Net 7 / Net 14, maksimum 14 hari kerja). Untuk skema dana deposit di muka (Rekber), sisa saldo yang tidak terpakai saat penutupan kampanye dikembalikan 100% sesuai rekonsiliasi.',
      },
      {
        id: 'terms-3-5',
        title: '3.5 Hak Takedown, Privasi Clipper & Larangan Non-Circumvention',
        content:
          'Brand dapat mengajukan permintaan takedown atas klip yang melanggar brief atau merugikan keamanan merek melalui Account Manager dengan menyertakan tautan, alasan, dan urgensi (takedown akhir tetap tunduk pada kebijakan platform sosial). Brand wajib menghormati privasi data clipper dan dilarang keras menghubungi clipper untuk mengubah kesepakatan kampanye di luar jalur Klipday tanpa persetujuan tertulis.',
      },
      {
        id: 'terms-3-6',
        title: '3.6 Larangan Produk Ilegal & Ketentuan Performa Algoritma',
        content:
          'Brand dilarang mempromosikan judi online/terlarang, obat/kosmetik ilegal tanpa izin edar, skema penipuan/ponzi, pornografi, atau muatan SARA. Brand memahami bahwa jangkauan konten dipengaruhi algoritma dan kebijakan platform sosial; proyeksi tayangan bukan merupakan jaminan mutlak kecuali target dan kompensasinya tercantum eksplisit dalam kontrak.',
      },
    ],
    callout: {
      title: 'Kejelasan Kontrak & Keamanan Merek',
      description:
        'Setiap kampanye berjalan berdasarkan brief tertulis, penguncian statistik saat cut-off dengan bukti performa dashboard, serta hak eskalasi takedown terkelola melalui Account Manager.',
    },
  },
  {
    id: 'hak-kewajiban-kreator',
    title: '4. Hak, Kewajiban & Aturan Clipper',
    shortTitle: '4. Aturan Clipper',
    description:
      'Kewajiban kepatuhan brief, orisinalitas karya, aturan Collab/Duet/Stitch, larangan penghapusan video, dan SLA review konten.',
    clauses: [
      {
        id: 'terms-4-1',
        title: '4.1 Pelaksanaan Brief, Akun Terverifikasi & Post-First',
        content:
          'Clipper wajib mematuhi brief secara lengkap (tema, aset resmi, durasi, caption, hashtag, disclosure iklan, format, platform, dan tenggat) dan hanya boleh menyetorkan tautan setelah kampanye aktif menggunakan akun media sosial pribadi yang telah terverifikasi.',
      },
      {
        id: 'terms-4-2',
        title: '4.2 Orisinalitas Karya, Konten Lintas Platform & Collab/Duet/Stitch',
        content:
          'Klip wajib merupakan karya suntingan orisinal. Clipper dilarang menjiplak, mengunduh ulang karya clipper lain, atau mengunggah ulang video yang secara substansial sama untuk memperoleh klaim tambahan. Konten lintas platform wajib diedit secara khusus. Untuk Collab Post, Duet, atau Stitch, hanya pengunggah asli yang berhak mengajukan klip kecuali brief menyatakan lain.',
      },
      {
        id: 'terms-4-3',
        title: '4.3 Brand Safety & Larangan Penghapusan atau Pengubahan Klip',
        content:
          'Clipper dilarang menampilkan logo kompetitor atau membuat klaim produk yang tidak disetujui brief. Selama masa kampanye dan periode pengukuran yang ditetapkan, klip yang diajukan dilarang dihapus, diprivatkan, atau diubah caption maupun isinya. Perubahan sebelum persetujuan dapat memicu review ulang, sedangkan perubahan setelah persetujuan memerlukan izin tertulis.',
      },
      {
        id: 'terms-4-4',
        title: '4.4 SLA Review Konten & Mekanisme Perbaikan (Revisi)',
        content:
          'Pemeriksaan kelengkapan otomatis/manual dilakukan maksimal 1 hari kerja dan review substantif konten maksimal 2 hari kerja sejak pengajuan lengkap diterima. Jika ditolak dengan catatan perbaikan, clipper mengirimkan ulang revisi dalam 2 hari kerja (atau sesuai jadwal brief) dan review ulang diselesaikan maksimal 1 hari kerja. Kasus sensitif yang memerlukan eskalasi ke Brand memiliki target penyelesaian maksimal 3 hari kerja. Persetujuan menilai versi yang dikirim dan tidak menjamin performa algoritma platform.',
      },
    ],
  },
  {
    id: 'anti-fraud',
    title: '5. Integritas Tayangan, Larangan Boosting & Audit Anti-Fraud',
    shortTitle: '5. Anti-Fraud & Audit',
    description:
      'Larangan mutlak manipulasi metrik, larangan boosting/iklan berbayar oleh clipper, audit anti-bot, serta sanksi pelanggaran.',
    clauses: [
      {
        id: 'terms-5-1',
        title: '5.1 Keharusan Penayangan Organik Nyata',
        content:
          'Seluruh tayangan yang dihitung untuk imbalan wajib berasal dari distribusi organik penonton nyata pada platform media sosial terkait tanpa rekayasa trafik dalam bentuk apa pun.',
      },
      {
        id: 'terms-5-2',
        title: '5.2 Larangan Bot, View Farm & Boosting Berbayar',
        content:
          'Clipper dilarang keras melakukan manipulasi tayangan maupun interaksi melalui cara berikut:',
        bulletPoints: [
          'Penggunaan bot, script otomatis, makro, atau simulator penayangan.',
          'Pembelian views, view farm, maupun jaringan engagement pods artifisial.',
          'Iklan atau boosting berbayar atas inisiatif pribadi untuk menggelembungkan metrik klip.',
        ],
      },
      {
        id: 'terms-5-3',
        title: '5.3 Audit Anti-Bot & Sanksi Pelanggaran',
        content:
          'Klip dengan metrik mencurigakan dapat ditahan untuk diaudit. Audit fraud dan anti-bot diselesaikan maksimal 3 hari kerja setelah masa sanggah berakhir. Pelanggaran yang terbukti mengakibatkan penolakan klip, pembatalan pendapatan terkait, penahanan payout selama pemeriksaan, pembatasan kampanye, atau penangguhan akun permanen.',
      },
    ],
    callout: {
      title: 'Toleransi Nol atas Manipulasi & Paid Boosting',
      description:
        'Setiap klip yang terbukti menggunakan bot, view farm, atau boosting berbayar akan didiskualifikasi tanpa kompensasi dan dapat berujung pada penutupan akun permanen.',
    },
  },
  {
    id: 'keuangan-penarikan',
    title: '6. Rekonsiliasi Keuangan, Masa Sanggah, Payout & Pajak',
    shortTitle: '6. Payout & Perpajakan',
    description:
      'Tahapan statement pendapatan, masa sanggah, prinsip paid-when-paid, disbursement, dan administrasi PPh 21/23.',
    clauses: [
      {
        id: 'terms-6-1',
        title: '6.1 Statement Pendapatan & Masa Sanggah (2 Hari Kerja)',
        content:
          'Klipday mengirimkan pernyataan pendapatan (statement) sementara maksimal H+2 hari kerja setelah cut-off. Clipper berhak mengajukan keberatan atau koreksi data tayangan dalam Masa Sanggah selama 2 hari kerja sejak statement diterima disertai tautan dan bukti pendukung.',
      },
      {
        id: 'terms-6-2',
        title: '6.2 Prinsip Paid-When-Paid, Jadwal Payout & Saldo Minimum',
        content:
          'Klipday membayarkan hak clipper setelah menerima dana pembayaran dari Brand dan menyelesaikan seluruh proses rekonsiliasi serta audit (paid-when-paid), dengan target waktu eksekusi H+3 hingga H+5 hari kerja (pengecualian berlaku bagi kampanye retainer dengan cadangan modal kerja yang disetujui). Untuk penarikan saldo dompet mandiri di dashboard, batas minimum pencairan adalah Rp 50.000.',
      },
      {
        id: 'terms-6-3',
        title: '6.3 Validasi Rekening Terpusat, Disbursement & Anti-Double Payout',
        content:
          'Pencairan disalurkan ke rekening bank nasional atau dompet digital yang telah lolos verifikasi kecocokan nama pemilik menggunakan corporate internet banking atau mitra disbursement berizin (seperti Xendit, Midtrans, atau Oy!). Pengajuan penarikan bersifat terkunci untuk mencegah risiko double payout dan hanya dapat dibatalkan melalui persetujuan verifikasi Admin.',
      },
      {
        id: 'terms-6-4',
        title: '6.4 Ketentuan Perpajakan Indonesia (PPh Pasal 21 & Pasal 23)',
        content:
          'Klien Brand berbentuk badan usaha pada umumnya melakukan pemotongan PPh Pasal 23 sebesar 2% atas jasa agensi dan menyerahkan bukti potong resmi kepada Klipday. Atas honor yang dibayarkan kepada clipper perorangan bukan pegawai, dilakukan pemotongan PPh Pasal 21 sesuai peraturan perpajakan Indonesia yang berlaku disertai pengiriman slip/rincian potongan.',
      },
    ],
  },
  {
    id: 'kekayaan-intelektual',
    title: '7. Hak Kekayaan Intelektual & Lisensi Materi',
    shortTitle: '7. Hak Intelektual',
    description:
      'Ketentuan hak atas materi sumber milik Brand serta kepatuhan hak cipta elemen audio dan visual dalam klip.',
    clauses: [
      {
        id: 'terms-7-1',
        title: '7.1 Lisensi Terbatas Materi Sumber Brand',
        content:
          'Brand memberikan lisensi terbatas, non-eksklusif, dan sesuai ruang lingkup kampanye kepada Klipday dan clipper terkurasi semata-mata untuk menyunting dan mendistribusikan klip sesuai brief yang disetujui.',
      },
      {
        id: 'terms-7-2',
        title: '7.2 Kepatuhan Hak Cipta Musik & Elemen Tambahan',
        content:
          'Clipper bertanggung jawab memastikan audio, efek suara, tipografi, maupun elemen visual tambahan di dalam klip tidak melanggar hak cipta, hak publisitas, atau lisensi penggunaan komersial di platform media sosial tujuan.',
      },
    ],
  },
  {
    id: 'penyelesaian-sengketa',
    title: '8. Hukum yang Berlaku & Penyelesaian Sengketa',
    shortTitle: '8. Hukum & Sengketa',
    description:
      'Yurisdiksi hukum Republik Indonesia, musyawarah mufakat, serta domisili penyelesaian perselisihan.',
    clauses: [
      {
        id: 'terms-8-1',
        title: '8.1 Hukum yang Berlaku',
        content:
          'Syarat & Ketentuan ini diatur dan ditafsirkan sepenuhnya berdasarkan hukum Negara Kesatuan Republik Indonesia.',
      },
      {
        id: 'terms-8-2',
        title: '8.2 Musyawarah untuk Mufakat & Domisili Pengadilan',
        content:
          'Perselisihan yang timbul akan diselesaikan terlebih dahulu melalui musyawarah untuk mufakat dalam jangka waktu 30 (tiga puluh) hari kalender. Apabila tidak tercapai penyelesaian damai, para pihak sepakat menyelesaikan sengketa melalui Pengadilan Negeri yang berwenang di wilayah hukum Republik Indonesia.',
      },
    ],
  },
] as const;
