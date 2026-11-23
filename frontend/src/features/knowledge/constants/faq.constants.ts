import type { AccordionGroupSection } from '../types';

/**
 * Complete FAQ sections aligned with KlipDay — Model Bisnis dan Standar Operasional (BM-001).
 */
export const PLATFORM_FAQ_SECTIONS: readonly AccordionGroupSection[] = [
  {
    id: 'faq-creator',
    title: '1. Seputar Clipper & Pengerjaan Kampanye',
    itemCountText: '7 Tanya Jawab',
    items: [
      {
        id: 'faq-c-1',
        title: 'Apa peran Klipday dan bagaimana cara kerja clipper di dalamnya?',
        content:
          'Klipday adalah agensi dan platform layanan clipping terkelola yang menghubungkan Brand dengan jaringan clipper terkurasi. Brand menyerahkan materi sumber dan tujuan kampanye, lalu Klipday menyusun brief, menyeleksi clipper, melakukan quality assurance (QA) klip, memantau tayangan di TikTok, Instagram Reels, atau YouTube Shorts, dan mengelola pencairan honor berdasarkan performa tayangan.',
      },
      {
        id: 'faq-c-2',
        title: 'Apakah saya harus memiliki ribuan followers untuk mulai menjadi clipper?',
        content:
          'Tidak harus. Algoritma konten pendek modern menilai kekuatan hook awal, retensi penonton, dan kualitas penyuntingan dibandingkan sekadar jumlah pengikut. Selama akun sosial Anda lolos verifikasi kepemilikan (SLA maksimal 2 hari kerja), bersifat publik, dan memenuhi brief kampanye, setiap tayangan organik yang sah tetap dihitung.',
      },
      {
        id: 'faq-c-3',
        title: 'Mengapa diperlukan verifikasi akun sosial & kode bio KD-XXXX?',
        content:
          'Setiap clipper hanya boleh menggunakan satu akun Klipday dan dilarang memakai akun sosial milik orang lain atau akun ganda. Verifikasi kode bio sementara (KD-XXXX) atau bukti kepemilikan memastikan akun TikTok/Reels/Shorts yang ditautkan benar-benar Anda kendalikan. Setelah verifikasi berhasil (SLA maksimal 2 hari kerja sejak bukti diterima), kode di bio dapat langsung dihapus.',
      },
      {
        id: 'faq-c-4',
        title: 'Bagaimana penghitungan komisi CPM dan sistem tier kinerja clipper?',
        content:
          'Pendapatan dihitung berdasarkan tarif Cost Per Mille (CPM) per 1.000 tayangan valid yang ditetapkan di tiap kampanye sesuai tingkat kesulitan, platform, dan tenggat (parameter paket awal Rp 5.000 – Rp 20.000 per 1.000 views atau nilai spesifik brief). Clipper yang konsisten menjaga kualitas juga memperoleh skor kinerja dan tier yang membuka akses ke kampanye bernilai lebih tinggi.',
      },
      {
        id: 'faq-c-5',
        title: 'Berapa lama proses review dan revisi klip yang sudah saya ajukan?',
        content:
          'Mengacu pada SLA Klipday (hari kerja Senin–Jumat di luar libur nasional): pemeriksaan kelengkapan teknis memakan waktu maksimal 1 hari kerja, dilanjutkan review substantif konten maksimal 2 hari kerja sejak pengajuan lengkap. Jika diminta revisi, Anda perlu mengirimkan klip perbaikan dalam 2 hari kerja (atau sesuai brief), lalu review ulang selesai maksimal 1 hari kerja.',
      },
      {
        id: 'faq-c-6',
        title: 'Apakah saya boleh mempromosikan klip dengan paid ads / boosting berbayar?',
        content:
          'Dilarang keras. Klipday hanya membayar tayangan organik murni. Memanipulasi metrik menggunakan bot, pembelian views, view farm, script/makro, engagement pods, atau iklan/boosting berbayar melanggar aturan platform dan mengakibatkan penolakan klip, pembatalan pendapatan, hingga penangguhan akun.',
      },
      {
        id: 'faq-c-7',
        title: 'Bagaimana aturan untuk Collab Post, Duet, Stitch, dan menghapus video?',
        content:
          'Untuk Collab Post, Duet, atau Stitch, hanya pengunggah asli yang berhak mengajukan klip kecuali brief menyatakan lain. Setelah klip diajukan, Anda dilarang menghapus, memprivatkan, atau mengubah caption selama masa kampanye dan periode pengukuran berlangsung tanpa izin tertulis.',
      },
    ],
  },
  {
    id: 'faq-brand',
    title: '2. Seputar Brand, Layanan Terkelola & Anggaran',
    itemCountText: '6 Tanya Jawab',
    items: [
      {
        id: 'faq-b-1',
        title: 'Apa perbedaan Klipday dibanding marketplace swalayan atau endorse biasa?',
        content:
          'Klipday menjalankan model layanan terkelola (managed agency service), bukan sekadar marketplace lepas tanpa pendampingan. Brand didampingi Account Manager sebagai satu titik kontak, mendapatkan bantuan penyusunan brief, kurasi jaringan clipper, moderasi QA setiap klip, verifikasi tayangan berlapis, serta laporan performa resmi sehingga tidak perlu mengelola puluhan kreator satu per satu.',
      },
      {
        id: 'faq-b-2',
        title: 'Berapa minimum budget kampanye dan bagaimana struktur biayanya?',
        content:
          'Minimum budget kampanye pada parameter awal dimulai dari Rp 1.000.000 dengan estimasi penggunaan budget 1–3 bulan. Struktur harga terdiri dari biaya tayangan berbasis performa (CPM pasar) ditambah management fee agensi sebesar 30%. Untuk kampanye dengan tenggat ketat di bawah 30 hari, berlaku rush fee tambahan sebesar 10–15%.',
      },
      {
        id: 'faq-b-3',
        title: 'Apa saja yang termasuk dan tidak termasuk dalam layanan Klipday untuk Brand?',
        content:
          'Layanan mencakup strategi & penyusunan kampanye, kurasi & pengelolaan clipper, pengelolaan brief & QA konten, pelacakan tayangan, pelaporan performa, hingga administrasi payout & pajak clipper. Layanan standar tidak mencakup pembelian media berbayar atas nama Brand (kecuali kontrak terpisah), syuting/produksi video long-form asli dari nol, maupun pengelolaan harian akun media sosial resmi milik Brand.',
      },
      {
        id: 'faq-b-4',
        title: 'Berapa lama waktu peninjauan oleh Brand dan bagaimana jika ada konten menyimpang?',
        content:
          'Brand menunjuk satu pengambil keputusan dengan SLA review maksimal 3 hari kerja agar timeline kampanye tetap terjaga. Apabila terdapat klip yang melanggar brief atau menimbulkan risiko keamanan merek, Brand berhak meminta takedown segera melalui Account Manager dengan menyertakan tautan, alasan, dan tingkat urgensinya.',
      },
      {
        id: 'faq-b-5',
        title: 'Apakah ada pembatasan kategori bisnis atau industri tertentu?',
        content:
          'Ya. Produk dan layanan ilegal, judi terlarang/slot, obat/kosmetik tanpa izin resmi, atau penipuan investasi ditolak mutlak. Sementara vertikal dengan risiko kepatuhan tinggi seperti fintech atau kesehatan tertentu akan melalui peninjauan kepatuhan dan dapat dikenakan premi risiko khusus.',
      },
      {
        id: 'faq-b-6',
        title: 'Bagaimana jika budget kampanye masih tersisa saat periode berakhir?',
        content:
          'Seluruh dana kampanye yang disetorkan melalui mekanisme deposit/Rekber hanya diperhitungkan untuk tayangan sah dari klip yang lolos QA dan verifikasi Brand. Sisa saldo anggaran yang tidak terpakai saat penutupan kampanye (settlement) akan direkonsiliasi dan dikembalikan utuh ke dompet atau rekening Brand sesuai kontrak.',
      },
    ],
  },
  {
    id: 'faq-wallet',
    title: '3. Seputar Rekonsiliasi, SLA Payout & Perpajakan',
    itemCountText: '5 Tanya Jawab',
    items: [
      {
        id: 'faq-w-1',
        title: 'Bagaimana alur cut-off data, masa sanggah, dan audit tayangan bekerja?',
        content:
          'Pada tanggal cut-off (tanggal 25, akhir bulan, atau penutupan kampanye sesuai kontrak), Klipday mengunci statistik tayangan dan bukti dashboard. Dalam H+2 hari kerja, statement pendapatan sementara dikirim ke clipper (dan BAST/invoice dikirim ke Brand). Clipper lalu memiliki Masa Sanggah 2 hari kerja untuk mengajukan keberatan beserta bukti, disusul audit fraud & anti-bot maksimal 3 hari kerja.',
      },
      {
        id: 'faq-w-2',
        title: 'Kapan pembayaran (payout) dicairkan kepada clipper?',
        content:
          'Klipday menerapkan prinsip paid-when-paid: payout disalurkan H+3 hingga H+5 hari kerja setelah dana pembayaran dari Brand diterima dan seluruh proses rekonsiliasi serta audit selesai (kecuali untuk kampanye retainer tertentu dengan cadangan modal kerja yang disetujui). Untuk penarikan saldo dompet mandiri di dashboard, batas minimumnya adalah Rp 50.000.',
      },
      {
        id: 'faq-w-3',
        title: 'Mengapa data bank / e-wallet harus divalidasi terpusat dengan nama yang cocok?',
        content:
          'Untuk mencegah salah transfer dan penyalahgunaan akun, setiap bank tujuan atau e-wallet (seperti BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, atau ShopeePay) wajib diverifikasi melalui unggahan bukti kepemilikan dengan nama pemilik yang identik dengan profil terdaftar. Perubahan data rekening diproses dengan SLA maksimal 2 hari kerja.',
      },
      {
        id: 'faq-w-4',
        title: 'Bagaimana perlakuan pajak (PPh 21 & PPh 23) di Klipday?',
        content:
          'Dalam administrasi operasional Indonesia, klien Brand berbentuk badan usaha pada umumnya memotong PPh Pasal 23 sebesar 2% atas jasa agensi dan menyediakan bukti potong untuk kredit pajak tahunan. Sementara atas honor kepada clipper perorangan bukan pegawai, Klipday melakukan pemotongan PPh Pasal 21 sesuai aturan perpajakan yang berlaku dan mengirimkan rincian potongan melalui slip pembayaran.',
      },
      {
        id: 'faq-w-5',
        title: 'Apakah pengajuan penarikan yang sudah masuk bisa dibatalkan?',
        content:
          'Untuk menjaga akurasi rekonsiliasi mass transfer / corporate banking serta mencegah risiko pembayaran ganda (double payout), penarikan yang telah diajukan berstatus terkunci. Permohonan pembatalan harus melewati pemeriksaan dan persetujuan Admin terlebih dahulu sebelum saldo dikembalikan ke dompet.',
      },
    ],
  },
] as const;
