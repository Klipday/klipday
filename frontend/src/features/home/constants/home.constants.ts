import type {
  AudienceType,
  BenefitAudienceContent,
  BottomBannerAudienceContent,
  FaqHeaderContent,
  FaqItem,
  HeroAudienceContent,
  HowItWorksAudienceContent,
  NavLinkItem,
} from '../types';

export const LANDING_PAGE_ASSETS: readonly string[] = [
  '/assets/images/step_creator_01.png',
  '/assets/images/step_creator_02.png',
  '/assets/images/step_creator_03.png',
  '/assets/images/step_brand_01.png',
  '/assets/images/step_brand_02.png',
  '/assets/images/step_brand_03.png',
  '/assets/images/benefit_creator_01.png',
  '/assets/images/benefit_creator_02.png',
  '/assets/images/benefit_creator_03.png',
  '/assets/images/benefit_brand_01.png',
  '/assets/images/benefit_brand_02.png',
  '/assets/images/benefit_brand_03.png',
  '/assets/images/discord_banner_creator.png?v=2',
  '/assets/images/cta_banner_brand.png?v=2',
] as const;

export const HOME_NAV_LINKS: readonly NavLinkItem[] = [
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Benefit', href: '#benefit' },
  { label: 'FAQ', href: '#faq' },
] as const;

export const HOME_HERO_CONTENT: Record<AudienceType, HeroAudienceContent> = {
  creator: {
    headlineLead: 'Klip Everyday.',
    headlineHighlight: 'Cuan Everyday.',
    subcopy:
      'Ambil bahan video dari brand, potong bagian paling seru, terus post ke TikTok. Tiap 1.000 views langsung jadi cuan walau akunmu masih 0 followers.',
    ctaLabel: 'Mulai Ngeklip',
    ctaHref: '/signup',
    trustPill: 'Budget brand dikunci aman, cair mulai Rp50.000, tanpa minimal followers',
  },
  brand: {
    headlineLead: 'Viral Everyday.',
    headlineHighlight: 'Cuan Everyday.',
    subcopy:
      'Biar ratusan clipper bantu ramein produkmu di TikTok dengan berbagai gaya konten. Tanpa biaya endorse mahal di awal, cukup bayar tiap 1.000 views organik.',
    ctaLabel: 'Buat Campaign Sekarang',
    ctaHref: '/signup',
    trustPill: 'Dana aman di sistem escrow, murni views organik, sisa budget otomatis kembali',
  },
} as const;

export const HOME_HOW_IT_WORKS_CONTENT: Record<AudienceType, HowItWorksAudienceContent> = {
  creator: {
    sectionPill: 'CARA KERJA',
    title: 'Cuma 3 Langkah Buat Mulai Cuan',
    steps: [
      {
        stepNumber: '01',
        badgeText: 'LANGKAH 01',
        title: 'Pilih Campaign yang Kamu Suka',
        description:
          'Cari brand atau produk yang pas sama gaya kontenmu. Bahan video mentah dan arahan brief udah disiapin lengkap, jadi kamu nggak perlu bikin konten dari nol.',
        imageSrc: '/assets/images/step_creator_01.png',
      },
      {
        stepNumber: '02',
        badgeText: 'LANGKAH 02',
        title: 'Potong Video lalu Upload ke TikTok',
        description:
          'Ambil momen paling menarik, kasih hook yang bikin orang betah nonton, terus upload langsung ke akun TikTok kamu. Abis tayang, tinggal tempel link videonya di Klipday.',
        imageSrc: '/assets/images/step_creator_02.png',
      },
      {
        stepNumber: '03',
        badgeText: 'LANGKAH 03',
        title: 'Views Jalan, Saldo Ikut Nambah',
        description:
          'Begitu videomu disetujui brand, tiap views organik yang masuk langsung kehitung jadi saldo. Udah kumpul minimal Rp50.000? Bisa langsung kamu cairin kapan aja.',
        imageSrc: '/assets/images/step_creator_03.png',
      },
    ],
  },
  brand: {
    sectionPill: 'CARA KERJA',
    title: 'Cara Simpel Bikin Produkmu Rame di FYP',
    steps: [
      {
        stepNumber: '01',
        badgeText: 'LANGKAH 01',
        title: 'Siapin Bahan Video dan Atur Budget',
        description:
          'Upload footage produk atau podcast kamu, tulis arahan singkat buat kreator, lalu tentukan sendiri bayaran per 1.000 views sesuai budget promosi.',
        imageSrc: '/assets/images/step_brand_01.png',
      },
      {
        stepNumber: '02',
        badgeText: 'LANGKAH 02',
        title: 'Cek dan Pilih Klip yang Masuk',
        description:
          'Para clipper bakal mulai setor potongan video terbaik mereka. Kamu bebas pilih video mana yang layak jalan atau minta revisi kalau ada bagian yang belum pas.',
        imageSrc: '/assets/images/step_brand_02.png',
      },
      {
        stepNumber: '03',
        badgeText: 'LANGKAH 03',
        title: 'Bayar Cuma Buat Video yang Ditonton',
        description:
          'Saldo campaign cuma kepotong dari klip pilihanmu yang beneran dapet views organik. Kalau masa campaign selesai dan budget masih sisa, uangnya balik utuh ke dompetmu.',
        imageSrc: '/assets/images/step_brand_03.png',
      },
    ],
  },
} as const;

export const HOME_BENEFITS_CONTENT: Record<AudienceType, BenefitAudienceContent> = {
  creator: {
    sectionPill: 'BENEFIT',
    title: 'Kenapa Anak Clipper Betah di Sini',
    cpmCard: {
      overline: 'HITUNGAN JELAS',
      title: 'Tahu Bayarannya Sebelum Mulai Edit',
      description:
        'Nggak perlu nebak komisi atau nunggu barang laku dulu. Sejak awal kamu udah tahu persis berapa rupiah yang masuk tiap videomu tembus 1.000 views.',
      metricLabel: 'Rata rata bayaran campaign',
      metricValue: 'Rp 12.000 per 1.000 views',
      rawTargetValue: 12000,
      metricPrefix: 'Rp ',
      metricSuffix: ' per 1.000 views',
      badgeText: 'Populer',
      imageSrc: '/assets/images/benefit_creator_01.png',
    },
    followersCard: {
      overline: 'TERBUKA BUAT SEMUA',
      title: 'Akun Baru Tetap Bisa Gajian',
      description:
        'Baru bikin akun TikTok kemarin? Aman banget. Di TikTok sekarang yang penting 3 detik pertama videomu asik ditonton. Begitu tembus FYP, setiap views langsung dibayar.',
      metricLabel: 'Syarat minimal followers',
      metricValue: '0 Followers',
      rawTargetValue: 0,
      metricSuffix: ' Followers',
      imageSrc: '/assets/images/benefit_creator_02.png',
    },
    payoutCard: {
      overline: 'CAIR KAPAN AJA',
      title: 'Kumpul Rp50.000 Langsung Tarik',
      description:
        'Nggak usah nunggu tanggal tua buat nikmatin hasil editanmu. Begitu saldo nyentuh Rp50.000, langsung cairin ke rekening BCA, Mandiri, BRI, atau saldo DANA, GoPay, dan OVO.',
      statusLabel: 'Saldo Tersedia',
      statusValue: 'Siap Ditarik',
      amountOrProtection: 'Rp 500.000',
      rawTargetValue: 500000,
      metricPrefix: 'Rp ',
      buttonLabel: 'Tarik Saldo',
      buttonHref: '/signup',
      imageSrc: '/assets/images/benefit_creator_03.png',
    },
  },
  brand: {
    sectionPill: 'BENEFIT',
    title: 'Cara Baru Promosi Tanpa Takut Boncos',
    cpmCard: {
      overline: 'MURNI HASIL NYATA',
      title: 'Nggak Ada Views, Nggak Keluar Biaya',
      description:
        'Udah lewat masanya bayar mahal di depan tapi penonton sepi. Di Klipday, budget promosimu cuma jalan kalau video kreator beneran ditonton audiens asli.',
      metricLabel: 'Biaya Tanpa Views',
      metricValue: 'Rp 0',
      rawTargetValue: 0,
      metricPrefix: 'Rp ',
      badgeText: '100% Organik',
      imageSrc: '/assets/images/benefit_brand_01.png',
    },
    followersCard: {
      overline: 'SEBARAN ORGANIK',
      title: 'Satu Materi Jadi Ratusan Konten',
      description:
        'Satu video panjang dari brand kamu bisa diolah ratusan clipper dengan gaya pancingan yang beda di tiap akun. Makin sering lewat di FYP orang, makin nempel brand kamu.',
      metricLabel: 'Variasi gaya konten',
      metricValue: 'Ratusan klip',
      rawTargetValue: 100,
      metricSuffix: ' klip',
      imageSrc: '/assets/images/benefit_brand_02.png',
    },
    payoutCard: {
      overline: 'DANA TERLINDUNGI',
      title: 'Sisa Budget Pasti Balik Utuh',
      description:
        'Dana promosi disimpan aman di sistem escrow selama campaign jalan. Kalau waktu campaign habis dan budget belum kepakai semua, sisanya otomatis balik ke saldo akunmu.',
      statusLabel: 'Proteksi Escrow',
      statusValue: 'Aktif 100%',
      amountOrProtection: '100% Terproteksi',
      rawTargetValue: 100,
      metricSuffix: '% Terproteksi',
      buttonLabel: 'Buat Campaign Sekarang',
      buttonHref: '/signup',
      imageSrc: '/assets/images/benefit_brand_03.png',
    },
  },
} as const;

export const DEFAULT_DISCORD_INVITE_URL = 'https://discord.gg/S2wYRNt7Q';

export const HOME_BOTTOM_BANNER_CONTENT: Record<AudienceType, BottomBannerAudienceContent> = {
  creator: {
    heading: 'Ngumpul Bareng Anak Clipper Lainnya',
    description:
      'Dapet bocoran campaign baru paling cepet, obrolin cara bikin hook yang gampang FYP, sampai liat temen kreator lain cairin cuan tiap hari di Discord Klipday.',
    ctaLabel: 'Gabung Discord',
    ctaHref: DEFAULT_DISCORD_INVITE_URL,
    isExternalCta: true,
    widgetHeader: 'KLIPDAY CREATOR HUB',
    widgetStatus: '1.2k Online',
    channelsOrHighlights: [
      { name: 'campaign baru', badgeText: 'Baru', isHighlight: true },
      { name: 'bahas hook', badgeText: 'Ramai', isHighlight: false },
      { name: 'bukti cair', badgeText: 'Aktif', isHighlight: false },
    ],
  },
  brand: {
    heading: 'Siap Bikin Produkmu Rame di TikTok?',
    description:
      'Bikin campaign pertamamu cuma butuh beberapa menit. Siapkan bahan videonya, atur budget sesuai kemampuan, dan biarkan ratusan clipper bantu sebarin brand kamu.',
    ctaLabel: 'Pasang Campaign Sekarang',
    ctaHref: '/signup',
    isExternalCta: false,
    widgetHeader: 'ESTIMASI JANGKAUAN CAMPAIGN',
    widgetStatus: 'Escrow Aktif',
    channelsOrHighlights: [
      { name: '100% Views Terverifikasi', badgeText: 'Rp 0 Risiko', isHighlight: true },
      { name: 'Pilih Klip Sendiri', badgeText: 'Bisa Revisi', isHighlight: false },
      { name: 'Sisa Saldo Kembali Otomatis', badgeText: '100% Aman', isHighlight: false },
    ],
  },
} as const;

export const HOME_FAQ_HEADER: FaqHeaderContent = {
  sectionPill: 'FAQ',
  title: 'Yang Sering Ditanyain',
  subtitle:
    'Jawaban singkat soal cara mulai ngeklip, syarat akun, keamanan budget brand, sampai urusan tarik saldo.',
} as const;

export const HOME_FAQS: readonly FaqItem[] = [
  {
    id: 1,
    question: 'Sebenarnya Klipday itu platform apa?',
    answer:
      'Klipday itu tempat ketemunya brand sama para pembuat video pendek atau clipper. Brand nyiapin bahan video dan budget promosi, lalu clipper bantu potong dan upload ke TikTok. Bayarannya dihitung transparan dari setiap 1.000 views organik yang masuk.',
  },
  {
    id: 2,
    question: 'Akun TikTok masih 0 followers apa beneran bisa ikutan?',
    answer:
      'Bisa banget. Kamu nggak butuh ribuan followers buat mulai dapet cuan di sini. Algoritma TikTok sekarang jauh lebih ngelihat seberapa menarik pembuka videomu dan seberapa betah orang nonton sampai habis. Selama klip kamu asik dan masuk FYP, semua views valid tetap dibayar penuh.',
  },
  {
    id: 3,
    question: 'Gimana cara mulai cari cuan dari ngeklip?',
    answer:
      'Tinggal daftar akun gratis, pilih campaign yang lagi buka, terus ambil bahan video dari brand. Abis kamu potong dan edit pakai aplikasi favoritmu seperti CapCut, upload videonya ke TikTok kamu sendiri lalu tempel link videonya di Klipday. Begitu disetujui brand, tiap views yang masuk langsung ngasilin saldo.',
  },
  {
    id: 4,
    question: 'Kapan views video saya mulai dihitung jadi saldo?',
    answer:
      'Begitu link video yang kamu setor dicek dan disetujui sama pihak brand, hitungan views langsung jalan. Kamu juga nggak perlu khawatir soal bayaran karena budget brand udah dikunci aman di sistem Klipday sejak sebelum campaign dibuka.',
  },
  {
    id: 5,
    question: 'Minimal saldo berapa baru bisa ditarik ke rekening?',
    answer:
      'Begitu saldo kamu kekumpul minimal Rp50.000, kamu udah bisa langsung tarik kapan aja tanpa nunggu akhir bulan. Pencairan bisa dikirim ke berbagai rekening bank lokal seperti BCA, Mandiri, BRI, BNI, sampai dompet digital seperti DANA, GoPay, dan OVO.',
  },
  {
    id: 6,
    question: 'Kalau saya pemilik brand, gimana jaminan budget saya nggak hangus?',
    answer:
      'Aman banget karena semua budget campaign disimpan dulu di sistem escrow Klipday. Uangmu cuma kepotong buat bayar klip yang udah kamu setujui dan beneran ditonton orang secara organik. Kalau periode campaign udah selesai dan dana masih sisa, uangnya balik utuh ke saldo dompet akunmu.',
  },
] as const;

export const HOME_FOOTER_LINKS: readonly NavLinkItem[] = [
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Benefit', href: '#benefit' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Aturan Main', href: '/peraturan' },
] as const;
