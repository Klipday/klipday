import type { AccordionGroupSection } from '../types';

/**
 * Complete, structured FAQ sections for Klipday.
 * Covers Creator inquiries, Brand & Advertiser inquiries, and Wallet/Payouts inquiries
 * with zero mentions of bot systems, focusing on genuine organic views and escrow mechanics.
 */
export const PLATFORM_FAQ_SECTIONS: readonly AccordionGroupSection[] = [
  {
    id: 'faq-creator',
    title: '1. Seputar Creator & Clipper',
    itemCountText: '7 Tanya Jawab',
    items: [
      {
        id: 'faq-c-1',
        title: 'Apakah saya harus memiliki ribuan followers untuk ikutan campaign?',
        content:
          'Sama sekali tidak! Anda bisa bergabung dan menghasilkan cuan bahkan dengan 0 followers. Algoritma TikTok modern menilai kualitas hook video, tingkat retensi, dan interaksi audiens, bukan sekadar jumlah followers akun. Selama video Anda menarik dan ditonton banyak orang, setiap penayangan organik yang sah tetap dibayar penuh.',
      },
      {
        id: 'faq-c-2',
        title: 'Bagaimana cara menghitung pendapatan komisi Cost Per Mille (CPM)?',
        content:
          'CPM adalah tarif rupiah yang dibayarkan untuk setiap 1.000 penayangan (views) video yang sah. Rumus perhitungan komisi adalah: (Jumlah Views ÷ 1.000) × Tarif CPM Campaign. Sebagai contoh, jika video Anda mencapai 50.000 views pada campaign dengan rate CPM Rp 12.000, maka komisi yang Anda peroleh adalah (50.000 ÷ 1.000) × Rp 12.000 = Rp 600.000.',
      },
      {
        id: 'faq-c-3',
        title: 'Mengapa saya harus memasukkan kode KD-XXXX di bio TikTok saya?',
        content:
          'Kode tersebut adalah proses verifikasi kepemilikan akun satu kali (one-time handshake) untuk memastikan bahwa akun TikTok yang didaftarkan benar-benar milik Anda dan bukan milik orang lain. Begitu sistem berhasil mendeteksi kode dan memverifikasi profil Anda, kode tersebut bisa langsung Anda hapus dari bio TikTok.',
      },
      {
        id: 'faq-c-4',
        title: 'Kapan komisi views saya mulai dihitung dan masuk ke saldo?',
        content:
          'Perhitungan penayangan dan komisi dimulai segera setelah video yang Anda setorkan berstatus Disetujui (Approved) oleh pihak Brand. Dana campaign sudah dikunci di sistem Escrow sejak awal, sehingga bayaran Anda 100% terjamin selama masa campaign berlangsung.',
      },
      {
        id: 'faq-c-5',
        title: 'Apa yang harus saya lakukan jika video saya diminta revisi oleh Brand?',
        content:
          'Buka halaman campaign terkait dan periksa catatan revisi yang ditinggalkan oleh Brand. Lakukan perbaikan pada video Anda sesuai arahan, unggah ulang video hasil revisi ke akun TikTok Anda, kemudian perbarui tautan video pada tombol "Kirim Revisi" di Klipday sebelum batas waktu berakhir.',
      },
      {
        id: 'faq-c-6',
        title: 'Bisakah saya mengedit video menggunakan aplikasi apa saja?',
        content:
          'Tentu saja! Anda bebas menggunakan aplikasi editing favorit Anda seperti CapCut, Premiere Pro, VN Video Editor, DaVinci Resolve, atau software lainnya, asalkan video akhir berformat vertikal (9:16) dan memiliki audio serta visual yang jernih.',
      },
      {
        id: 'faq-c-7',
        title: 'Berapa banyak campaign yang bisa saya ikuti sekaligus?',
        content:
          'Tidak ada batasan jumlah campaign. Anda bebas bergabung dan menyetorkan video ke semua campaign aktif yang tersedia di marketplace, selama Anda mematuhi brief dan aturan masing-masing campaign.',
      },
    ],
  },
  {
    id: 'faq-brand',
    title: '2. Seputar Brand & Pengiklan',
    itemCountText: '6 Tanya Jawab',
    items: [
      {
        id: 'faq-b-1',
        title: 'Apa bedanya Klipday dengan endorse influencer konvensional?',
        content:
          'Pada endorse konvensional, Brand membayar biaya mahal di depan tanpa jaminan bahwa video tersebut akan viral atau ditonton audiens target. Di Klipday, Anda hanya membayar berdasarkan hasil nyata penayangan organik yang terverifikasi (pay-per-verified-view), dengan konten kreatif yang diproduksi oleh puluhan hingga ratusan kreator berbeda.',
      },
      {
        id: 'faq-b-2',
        title: 'Bagaimana sistem Escrow menjamin anggaran kampanye saya anti-boncos?',
        content:
          'Dana campaign Anda dikunci secara aman di rekening Escrow terpisah sebelum campaign tayang. Budget Anda hanya akan terpotong secara bertahap saat video yang sudah Anda setujui (Approved) beneran ditonton orang. Jika durasi campaign selesai dan anggaran masih bersisa, sisa dana tersebut 100% otomatis kembali ke saldo dompet Anda.',
      },
      {
        id: 'faq-b-3',
        title: 'Bagaimana cara Klipday melacak views video kreator?',
        content:
          'Klipday secara berkala mencatat metrik penayangan publik langsung dari tautan video TikTok resmi yang disetorkan oleh kreator yang telah disetujui, memastikan seluruh views yang dihitung adalah penayangan nyata selama campaign aktif.',
      },
      {
        id: 'faq-b-4',
        title: 'Apakah ada batasan views per video (Max Views Cap)?',
        content:
          'Ya. Setiap campaign dilengkapi pengaturan batas maksimum penayangan per video (Max Views Cap). Hal ini dirancang agar anggaran iklan Anda terdistribusi secara merata ke berbagai variasi hook dan angle konten, serta mencegah seluruh budget habis hanya oleh satu video saja.',
      },
      {
        id: 'faq-b-5',
        title: 'Berapa lama waktu yang saya miliki untuk menyetujui atau meminta revisi video?',
        content:
          'Brand memiliki batas waktu Service Level Agreement (SLA) maksimal 3 hari kerja (3x24 jam) untuk menentukan status klip yang disetorkan kreator (Setujui, Minta Revisi, atau Tolak dengan alasan).',
      },
      {
        id: 'faq-b-6',
        title: 'Bagaimana jika durasi campaign selesai namun budget saya belum habis?',
        content:
          'Seluruh sisa saldo yang belum terserap akan secara otomatis dikembalikan 100% ke saldo dompet Brand seketika saat status campaign berubah menjadi Selesai (Finished), dan saldo tersebut dapat Anda gunakan kembali untuk campaign berikutnya atau ditarik ke rekening perusahaan Anda.',
      },
    ],
  },
  {
    id: 'faq-wallet',
    title: '3. Seputar Keuangan, Dompet & Penarikan Saldo',
    itemCountText: '5 Tanya Jawab',
    items: [
      {
        id: 'faq-w-1',
        title: 'Berapa batas minimal penarikan saldo (withdraw)?',
        content:
          'Batas minimal penarikan saldo di Klipday adalah Rp 50.000. Saldo dapat ditarik kapan saja begitu mencapai batas ini tanpa perlu menunggu tanggal gajian di akhir bulan.',
      },
      {
        id: 'faq-w-2',
        title: 'Bank dan e-wallet apa saja yang bisa digunakan untuk mencairkan saldo?',
        content:
          'Klipday mendukung penarikan ke seluruh jaringan perbankan nasional (seperti BCA, Mandiri, BRI, BNI, Permata, Jago, SeaBank) serta akun e-wallet resmi terkemuka (DANA, GoPay, OVO, ShopeePay).',
      },
      {
        id: 'faq-w-3',
        title: 'Berapa lama proses transfer penarikan dana sampai masuk ke rekening/e-wallet?',
        content:
          'Proses penarikan dana diproses dalam kurun waktu maksimal 1x24 jam pada hari kerja setelah diverifikasi oleh tim keuangan Klipday.',
      },
      {
        id: 'faq-w-4',
        title: 'Apakah ada biaya admin saat melakukan deposit atau penarikan saldo?',
        content:
          'Klipday tidak membebankan potongan komisi tersembunyi pada saat penarikan saldo. Biaya transfer antar-bank standar mengikuti ketentuan jaringan kliring perbankan nasional (misalnya BI-FAST Rp 2.500 jika berlaku antar-bank berbeda).',
      },
      {
        id: 'faq-w-5',
        title: 'Mengapa rekening bank atau e-wallet saya membutuhkan verifikasi KYC?',
        content:
          'Verifikasi rekening KYC (pemeriksaan foto buku tabungan atau screenshot akun e-wallet) diwajibkan untuk menjamin bahwa dana penarikan benar-benar terkirim ke pemilik akun yang sah dan mencegah terjadinya kesalahan transfer.',
      },
    ],
  },
] as const;
