import type { AccordionGroupSection } from '../types';

/**
 * Structured Platform Rules (Peraturan Platform) aligned strictly with
 * KlipDay — Model Bisnis dan Standar Operasional (BM-001).
 */
export const PLATFORM_RULES_SECTIONS: readonly AccordionGroupSection[] = [
  {
    id: 'rules-account-eligibility',
    title: '1. Kelayakan Akun, Verifikasi & SLA Akun Clipper',
    itemCountText: '4 Ketentuan',
    items: [
      {
        id: 'rule-1-1',
        title: '1.1 Satu Akun per Pengguna & Batas Usia 18+ (UU PDP No. 27/2022)',
        content:
          'Setiap pengguna (Clipper maupun Brand) wajib berusia minimal 18 tahun atau cakap hukum serta memberikan data yang benar dan terbaru. Setiap orang hanya diperbolehkan memiliki 1 (satu) akun Klipday. Dilarang keras memakai akun sosial milik orang lain, membuat akun palsu/ganda untuk menggandakan klaim, atau menghindari pembatasan sistem (BM-001 Bab 13.2). Pendaftaran dan pemeriksaan awal diselesaikan maksimal 2 hari kerja setelah data lengkap.',
      },
      {
        id: 'rule-1-2',
        title: '1.2 Verifikasi Akun Media Sosial & Kode Bio (SLA Maks. 2 Hari Kerja)',
        content:
          'Kreator wajib menghubungkan akun media sosial (TikTok, Instagram Reels, atau YouTube Shorts) yang dapat diakses publik sebelum menyetorkan klip. Kepemilikan akun divalidasi menggunakan kode verifikasi bio sementara (KD-XXXX) maupun bukti kepemilikan dengan target SLA verifikasi maksimal 2 hari kerja sejak bukti lengkap diterima. Setelah akun terhubung, kode dapat dihapus dari bio.',
      },
      {
        id: 'rule-1-3',
        title: '1.3 Validasi Rekening Pencairan & Perubahan Data Pembayaran',
        content:
          'Klipday mengumpulkan nama bank atau penyedia e-wallet, nomor rekening, dan nama pemilik secara terpusat melalui formulir dan dashboard terverifikasi. Nama pemilik rekening wajib cocok dengan identitas akun untuk mencegah salah bayar dan fraud. Permintaan perubahan data akun atau rekening pembayaran diproses dengan konfirmasi pemilik akun maksimal 2 hari kerja dan berlaku setelah lolos validasi.',
      },
      {
        id: 'rule-1-4',
        title: '1.4 Penahanan Keamanan & Banding Penangguhan Akun',
        content:
          'Klipday berhak menahan review atau payout selama berlangsungnya pemeriksaan keamanan dan memberikan kesempatan klarifikasi, kecuali tindakan segera diperlukan untuk melindungi klien, pengguna, atau integritas kampanye. Pengajuan banding atas penangguhan akun memperoleh tanggapan awal maksimal 3 hari kerja dengan penjelasan dasar tindakan dan permintaan bukti relevan.',
      },
    ],
  },
  {
    id: 'rules-creator-submission',
    title: '2. Aturan Clipper & Standar Review Konten',
    itemCountText: '7 Ketentuan',
    items: [
      {
        id: 'rule-2-1',
        title: '2.1 Kepatuhan Brief Kampanye & Publikasi Post-First',
        content:
          'Clipper wajib mengikuti brief kampanye secara penuh, termasuk tema, aset sumber yang boleh digunakan, durasi, caption, hashtag wajib, disclosure iklan, format, platform (TikTok, Instagram Reels, YouTube Shorts), dan tenggat. Klip dipublikasikan terlebih dahulu ke akun sosial terverifikasi dan baru dapat diajukan setelah status kampanye aktif.',
      },
      {
        id: 'rule-2-2',
        title: '2.2 Orisinalitas Karya & Konten Lintas Platform',
        content:
          'Setiap klip wajib merupakan hasil penyuntingan orisinal. Dilarang menjiplak, mengunduh ulang, mengklaim karya clipper lain, mengajukan klip yang pernah diklaim sebelumnya, atau mengunggah ulang video yang secara substansial sama (footage, audio, atau alur edit) untuk memperoleh klaim ganda. Konten lintas platform harus diolah secara khusus dan memenuhi ketentuan kampanye.',
      },
      {
        id: 'rule-2-3',
        title: '2.3 Ketentuan Collab Post, Duet, dan Stitch',
        content:
          'Untuk fitur kolaborasi seperti Collab Post, Duet, atau Stitch, hanya pengunggah asli yang berhak mengajukan tautan klip tersebut ke dalam kampanye Klipday, kecuali brief tertulis menyatakan lain.',
      },
      {
        id: 'rule-2-4',
        title: '2.4 Keamanan Merek (Brand Safety) & Larangan Klaim Liar',
        content:
          'Clipper dilarang menampilkan logo atau branding kompetitor serta dilarang membuat klaim produk yang tidak disetujui dalam brief, kecuali diizinkan secara eksplisit. Gunakan hanya materi sumber dan klaim resmi yang disediakan atau disetujui oleh Brand.',
      },
      {
        id: 'rule-2-5',
        title: '2.5 Kepatuhan Hukum & Muatan Terlarang',
        content:
          'Klip dilarang memuat ujaran kebencian/SARA, diskriminasi, pornografi atau muatan seksual, kekerasan berbahaya, hoaks/disinformasi, fitnah, penipuan, maupun promosi barang atau jasa ilegal. Seluruh karya wajib menghormati privasi, hak cipta, hak publisitas, serta hukum yang berlaku di Indonesia.',
      },
      {
        id: 'rule-2-6',
        title: '2.6 Ketentuan Masa Tayang (Larangan Hapus, Private, atau Ubah Klip)',
        content:
          'Clipper dilarang menghapus, memprivatkan, atau mengubah caption maupun klip yang telah diajukan selama masa kampanye dan periode pengukuran berlangsung. Perubahan sebelum persetujuan dapat memicu review ulang, sedangkan perubahan setelah persetujuan wajib memperoleh izin tertulis dari Klipday.',
      },
      {
        id: 'rule-2-7',
        title: '2.7 Standar SLA Review Konten & Revisi (BM-001 Bab 13.3)',
        content:
          'Pemeriksaan kelengkapan (tautan, akun terhubung, hashtag, durasi, format, syarat brief) berlangsung maksimal 1 hari kerja, dilanjutkan review substantif konten maksimal 2 hari kerja sejak submission lengkap diterima. Apabila diminta perbaikan, clipper mengirim ulang klip perbaikan dalam 2 hari kerja (atau sesuai tenggat brief) dengan review ulang maksimal 1 hari kerja. Kasus sensitif atau eskalasi ke Brand memiliki target maksimal 3 hari kerja.',
      },
    ],
  },
  {
    id: 'rules-view-integrity',
    title: '3. Integritas Tayangan, Anti-Bot & Penindakan Pelanggaran',
    itemCountText: '3 Ketentuan',
    items: [
      {
        id: 'rule-3-1',
        title: '3.1 Larangan Manipulasi Views & Iklan/Boosting Berbayar',
        content:
          'Seluruh penayangan wajib berasal dari distribusi organik nyata. Dilarang keras memanipulasi tayangan atau interaksi menggunakan bot, pembelian tayangan, view farm, iklan atau boosting berbayar atas inisiatif pribadi, script, makro, maupun layanan pertukaran engagement artifisial.',
      },
      {
        id: 'rule-3-2',
        title: '3.2 Audit Fraud, Ambang Kewajaran & Penahanan Metrik',
        content:
          'Klipday melakukan pelacakan tayangan berlapis beserta bukti tangkapan layar dan audit anti-bot maksimal 3 hari kerja setelah masa sanggah. Klip dengan lonjakan trafik atau rasio interaksi yang mencurigakan dapat ditahan untuk audit lanjutan sebelum dihitung sebagai pendapatan valid.',
      },
      {
        id: 'rule-3-3',
        title: '3.3 Hak Keberatan & Sanksi Pelanggaran Terstruktur',
        content:
          'Clipper berhak mengajukan keberatan atas hasil review atau perhitungan tayangan dalam masa sanggah 2 hari kerja dengan menyertakan tautan dan bukti relevan. Pelanggaran yang terbukti dapat mengakibatkan penolakan klip, pembatalan pendapatan terkait, penahanan payout selama pemeriksaan, pembatasan akses kampanye, hingga penangguhan akun secara permanen.',
      },
    ],
  },
  {
    id: 'rules-brand-guidelines',
    title: '4. Aturan Brand, Klien & Ruang Lingkup Layanan Terkelola',
    itemCountText: '6 Ketentuan',
    items: [
      {
        id: 'rule-4-1',
        title: '4.1 Brief Final, Minimum Anggaran & Keabsahan Aset',
        content:
          'Brand wajib menyerahkan brief final, tujuan kampanye, target audiens, platform, aset sumber beserta hak penggunaannya, klaim yang disetujui, larangan, hashtag, disclosure, durasi, KPI, anggaran (minimum Rp 1.000.000 pada paket awal), dan tenggat sebelum kampanye diluncurkan. Brand menjamin seluruh materi, merek dagang, musik, rekaman, dan klaim produk sah digunakan secara hukum.',
      },
      {
        id: 'rule-4-2',
        title: '4.2 Ruang Lingkup Layanan Terkelola & Batas Pengecualian',
        content:
          'Klipday mengelola perencanaan kampanye, kurasi clipper, moderasi QA, verifikasi tayangan, pelaporan, dan payout clipper. Layanan standar tidak mencakup pembelian media/iklan berbayar atas nama Brand (kecuali kontrak terpisah), produksi atau syuting konten long-form asli, maupun pengelolaan akun media sosial resmi milik Brand.',
      },
      {
        id: 'rule-4-3',
        title: '4.3 PIC Tunggal & SLA Kurasi Brand (Maks. 3 Hari Kerja)',
        content:
          'Brand menunjuk satu pengambil keputusan dan memberikan umpan balik terkonsolidasi dalam SLA review maksimal 3 hari kerja. Keterlambatan persetujuan atau perubahan brief setelah kampanye berjalan dapat menggeser jadwal, volume distribusi, maupun capaian hasil yang ditargetkan.',
      },
      {
        id: 'rule-4-4',
        title: '4.4 Persetujuan Tertulis Biaya Agensi, Rush Fee & Kepatuhan Vertikal',
        content:
          'Anggaran, tarif CPM, management fee agensi (paket awal 30%), rush fee 10–15% untuk kampanye bertenggat di bawah 30 hari, batas payout per klip bila ada, dan term pembayaran wajib disepakati tertulis sebelum mulai. Vertikal dengan risiko kepatuhan tinggi (seperti fintech atau kesehatan) dapat dikenai peninjauan serta premi risiko tambahan, sementara judi terlarang dan produk ilegal ditolak mutlak.',
      },
      {
        id: 'rule-4-5',
        title: '4.5 Hak Takedown & Larangan Menghubungi Clipper di Luar Jalur',
        content:
          'Brand berhak meminta takedown atas klip yang melanggar brief atau membahayakan keamanan merek melalui Account Manager dengan tautan, alasan, dan urgensi jelas (proses takedown akhir mengikuti mekanisme platform sosial). Brand wajib menghormati privasi data clipper dan dilarang menghubungi clipper untuk mengubah kesepakatan di luar jalur Klipday tanpa persetujuan tertulis.',
      },
      {
        id: 'rule-4-6',
        title: '4.6 Dinamika Algoritma & Proyeksi Performa',
        content:
          'Tayangan dan jangkauan konten dipengaruhi algoritma serta kebijakan masing-masing platform sosial. Angka proyeksi maupun estimasi capaian bukanlah jaminan hasil mutlak kecuali target performa dan skema kompensasinya tercantum eksplisit dalam kontrak tertulis.',
      },
    ],
  },
  {
    id: 'rules-financial-payouts',
    title: '5. Rekonsiliasi Keuangan, Masa Sanggah, Payout & Perpajakan',
    itemCountText: '5 Ketentuan',
    items: [
      {
        id: 'rule-5-1',
        title: '5.1 Cut-off Data, Invoice & Verifikasi Brand',
        content:
          'Hari kerja berlaku Senin–Jumat di luar hari libur nasional. Cut-off dan penguncian statistik tayangan, tautan unggahan, serta bukti performa dilakukan sesuai jadwal kontrak (tanggal 25, akhir bulan, atau penutupan kampanye). Klipday menerbitkan laporan/BAST dan invoice maksimal H+2 hari kerja setelah cut-off, diikuti verifikasi Brand maksimal 3 hari kerja serta pelunasan sesuai term kontrak atau alokasi dana deposit di muka.',
      },
      {
        id: 'rule-5-2',
        title: '5.2 Pernyataan Pendapatan & Masa Sanggah Clipper (2 Hari Kerja)',
        content:
          'Maksimal H+2 hari kerja setelah cut-off, Klipday menerbitkan pernyataan pendapatan (statement) sementara bagi masing-masing clipper. Clipper memiliki Masa Sanggah selama 2 hari kerja sejak statement diterima untuk mengajukan keberatan disertai identitas klip dan bukti pendukung sebelum hasil difinalisasi.',
      },
      {
        id: 'rule-5-3',
        title: '5.3 Prinsip Paid-When-Paid, Jadwal Payout & Saldo Minimum',
        content:
          'Klipday menerapkan prinsip paid-when-paid, yaitu menyalurkan payout kepada clipper dalam waktu H+3 hingga H+5 hari kerja setelah dana Brand diterima dan seluruh audit serta rekonsiliasi selesai (kecuali kampanye retainer dengan cadangan modal kerja yang disetujui). Untuk penarikan saldo dompet mandiri di platform, batas minimum pencairan adalah Rp 50.000.',
      },
      {
        id: 'rule-5-4',
        title: '5.4 Eksekusi Disbursement Resmi & Proteksi Anti-Double Payout',
        content:
          'Pembayaran dilakukan ke rekening bank nasional atau e-wallet terverifikasi melalui kanal perbankan korporat (corporate internet banking) maupun mitra disbursement berizin. Untuk mencegah kesalahan kas atau double payout, pengajuan penarikan yang telah masuk berstatus terkunci dan pembatalannya memerlukan persetujuan verifikasi administratif sebelum dana dikembalikan ke dompet.',
      },
      {
        id: 'rule-5-5',
        title: '5.5 Ketentuan Administrasi Perpajakan Indonesia (PPh Pasal 21 & 23)',
        content:
          'Transaksi Brand berbentuk badan usaha atas jasa agensi pada umumnya tunduk pada pemotongan PPh Pasal 23 sebesar 2% sesuai ketentuan fiskal berlaku disertai pertukaran bukti potong. Pembayaran honor kepada clipper perorangan bukan pegawai dilakukan dengan pemotongan PPh Pasal 21 sesuai peraturan perpajakan Indonesia serta dilengkapi slip atau rincian potongan pada pemberitahuan pembayaran.',
      },
    ],
  },
] as const;
