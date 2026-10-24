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
    subcopy: 'Ambil materi dari brand, edit gaya kamu, upload ke TikTok. Dibayar per 1.000 views—bahkan dari 0 followers.',
    ctaLabel: 'Mulai Ngeklip',
    ctaHref: '/signup',
    trustPill: '⚡ Garansi Escrow 100%  •  Cair Mulai Rp50.000  •  Tanpa Minimal Followers',
  },
  brand: {
    headlineLead: 'Viral Everyday.',
    headlineHighlight: 'Cuan Everyday.',
    subcopy: 'Kerahkan ratusan clipper buat sebarin produkmu di TikTok. Gak perlu bayar mahal di depan—cukup bayar per 1.000 views organik.',
    ctaLabel: 'Buat Campaign Sekarang',
    ctaHref: '/signup',
    trustPill: '🛡️ Dana Aman di Escrow  •  100% Views Organik Terverifikasi  •  Auto-Refund Sisa Budget',
  },
} as const;

export const HOME_HOW_IT_WORKS_CONTENT: Record<AudienceType, HowItWorksAudienceContent> = {
  creator: {
    sectionPill: 'CARA KERJA',
    title: '3 Langkah Ubah Editan Jadi Cuan',
    steps: [
      {
        stepNumber: '01',
        badgeText: 'LANGKAH 01',
        title: 'Pilih Campaign & Ambil Materi',
        description: 'Cari brand yang cocok sama niche kamu. Mentahan video dan panduan brief udah disiapin, tinggal comot.',
        imageSrc: '/assets/images/step_creator_01.png',
      },
      {
        stepNumber: '02',
        badgeText: 'LANGKAH 02',
        title: 'Edit, Upload, & Setor Link',
        description: 'Racik klipnya di CapCut atau aplikasi andalanmu, post langsung ke TikTok kamu, terus tempel link-nya di Klipday.',
        imageSrc: '/assets/images/step_creator_02.png',
      },
      {
        stepNumber: '03',
        badgeText: 'LANGKAH 03',
        title: 'Views Jalan, Saldo Nambah',
        description: 'Begitu klip di-approve, tiap views organik langsung dihitung jadi rupiah. Tembus Rp50.000, langsung tarik!',
        imageSrc: '/assets/images/step_creator_03.png',
      },
    ],
  },
  brand: {
    sectionPill: 'CARA KERJA',
    title: 'Bikin Brand Kamu Rame di FYP dalam 3 Langkah',
    steps: [
      {
        stepNumber: '01',
        badgeText: 'LANGKAH 01',
        title: 'Pasang Brief & Kunci Budget',
        description: 'Upload video mentahan produkmu, tentukan aturan main, dan atur sendiri tarif per 1.000 views (CPM) sesuai budget.',
        imageSrc: '/assets/images/step_brand_01.png',
      },
      {
        stepNumber: '02',
        badgeText: 'LANGKAH 02',
        title: 'Kurasi Klip yang Masuk',
        description: 'Ratusan clipper bakal setor video. Kamu pegang kendali penuh: approve yang sesuai brief, atau minta revisi kalau kurang pas.',
        imageSrc: '/assets/images/step_brand_02.png',
      },
      {
        stepNumber: '03',
        badgeText: 'LANGKAH 03',
        title: 'Terima Beres, Bayar Sesuai Views',
        description: 'Budget cuma kepotong dari klip yang kamu approve dan beneran ditonton orang. Sisa budget? Otomatis balik 100% ke saldo.',
        imageSrc: '/assets/images/step_brand_03.png',
      },
    ],
  },
} as const;

export const HOME_BENEFITS_CONTENT: Record<AudienceType, BenefitAudienceContent> = {
  creator: {
    sectionPill: 'BENEFIT',
    title: 'Dibikin Biar Cuanmu Maksimal',
    cpmCard: {
      overline: 'BAYARAN TRANSPARAN',
      title: 'Rate CPM Jelas di Depan',
      description: 'Gak ada cerita gacha komisi. Kamu tahu persis berapa rupiah yang didapat per 1.000 views sebelum mulai ngedit.',
      metricLabel: 'Rata-rata CPM Campaign',
      metricValue: 'Rp 12.000 / 1K views',
      rawTargetValue: 12000,
      metricPrefix: 'Rp ',
      metricSuffix: ' / 1K views',
      badgeText: '• Top Tier',
      imageSrc: '/assets/images/benefit_creator_01.png',
    },
    followersCard: {
      overline: 'TANPA MINIMAL FOLLOWERS',
      title: 'Modal Skill Edit, Bukan Nama Besar',
      description: 'Akun baru bikin kemarin? Tetap bisa gajian. Selama hook kamu nendang dan masuk FYP, views tetap dibayar penuh.',
      metricLabel: 'Syarat Min. Followers',
      metricValue: '0 Followers',
      rawTargetValue: 0,
      metricSuffix: ' Followers',
      imageSrc: '/assets/images/benefit_creator_02.png',
    },
    payoutCard: {
      overline: 'PENCAIRAN ANTI RIBET',
      title: 'Cair Cepat, Tanpa Drama',
      description: 'Gak perlu nunggu akhir bulan. Saldo kumpul Rp50.000 langsung tarik kapan aja ke BCA, Mandiri, DANA, GoPay, atau OVO.',
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
    title: 'Dibikin Biar Budgetmu Gak Bocor',
    cpmCard: {
      overline: '100% BERBASIS PERFORMA',
      title: 'Gak Ada Views, Gak Bayar',
      description: 'Lupakan endorse mahal yang views-nya zonk. Di sini kamu cuma bayar views asli yang lolos verifikasi views kami.',
      metricLabel: 'Biaya Tanpa Views',
      metricValue: 'Rp 0',
      rawTargetValue: 0,
      metricPrefix: 'Rp ',
      badgeText: '• 100% Organik',
      imageSrc: '/assets/images/benefit_brand_01.png',
    },
    followersCard: {
      overline: 'DOMINASI ALGORITMA',
      title: 'Satu Produk, Ratusan Gaya Hook',
      description: 'Biarkan ratusan kreator meracik angle terbaik buat produkmu. Makin banyak variasi klip di TikTok, makin besar peluang pecah FYP.',
      metricLabel: 'Variasi Hook & Angle',
      metricValue: '100+ Angle',
      rawTargetValue: 100,
      metricSuffix: '+ Angle',
      imageSrc: '/assets/images/benefit_brand_02.png',
    },
    payoutCard: {
      overline: 'GARANSI ESCROW AMAN',
      title: 'Budget Dijamin Anti-Boncos',
      description: 'Dana campaign dikunci aman di sistem Escrow. Kalau periode campaign selesai dan budget masih sisa, dananya utuh kembali ke dompetmu.',
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
    heading: 'Nongkrong Bareng Creator Lain',
    description: 'Info campaign baru tercepat, bedah rumus hook FYP, dan bukti cair harian. Semua ngumpul di Discord.',
    ctaLabel: 'Gabung Discord',
    ctaHref: DEFAULT_DISCORD_INVITE_URL,
    isExternalCta: true,
    widgetHeader: 'KLIPDAY CREATOR HUB',
    widgetStatus: '1.2k Online',
    channelsOrHighlights: [
      { name: 'campaign-baru', badgeText: 'New', isHighlight: true },
      { name: 'tips-hook', badgeText: '12+', isHighlight: false },
      { name: 'bukti-cair', badgeText: '99+', isHighlight: false },
    ],
  },
  brand: {
    heading: 'Siap Bikin Produkmu Rame di TikTok?',
    description: 'Mulai campaign pertamamu dalam 5 menit. Kunci budget di Escrow, terima ratusan variasi klip, dan bayar cuma buat views yang terbukti organik.',
    ctaLabel: 'Pasang Campaign Sekarang',
    ctaHref: '/signup',
    isExternalCta: false,
    widgetHeader: 'ESTIMASI JANGKAUAN CAMPAIGN',
    widgetStatus: 'Escrow Aktif',
    channelsOrHighlights: [
      { name: '100% Views Terverifikasi', badgeText: 'Rp 0 Risiko', isHighlight: true },
      { name: 'Full Kurasi Klip', badgeText: '2x Revisi', isHighlight: false },
      { name: 'Auto-Refund Sisa Saldo', badgeText: '100% Aman', isHighlight: false },
    ],
  },
} as const;

export const HOME_FAQ_HEADER: FaqHeaderContent = {
  sectionPill: 'FAQ',
  title: 'Yang Sering Ditanyain',
  subtitle: 'Semua hal penting seputar cara kerja, syarat akun, keamanan budget, dan pencairan cuan di Klipday.',
} as const;

export const HOME_FAQS: readonly FaqItem[] = [
  {
    id: 1,
    question: 'Apa itu Klipday?',
    answer:
      'Klipday adalah marketplace video pendek (clipping) berbasis performa pertama di Indonesia. Kami mempertemukan Brand yang butuh ribuan konten viral organik dengan kreator (clipper) yang siap mengedit video dan dibayar transparan per 1.000 views (CPM).',
  },
  {
    id: 2,
    question: 'Berapa minimal followers buat ikutan campaign?',
    answer:
      'Nol! Kamu gak butuh ribuan followers buat mulai cari cuan di Klipday. Algoritma TikTok sekarang murni menilai kualitas hook dan retensi video. Selama editanmu menarik dan masuk FYP, setiap views organik yang terverifikasi tetap dibayar penuh.',
  },
  {
    id: 3,
    question: 'Gimana cara dapetin uang di Klipday?',
    answer:
      'Gampang banget: pilih campaign yang aktif, download materi mentahan dari brand, edit sesuai brief, lalu upload ke akun TikTok kamu. Setelah itu, setor link videonya di Klipday. Begitu klipmu di-approve oleh Brand, argo komisi langsung jalan mengikuti jumlah views.',
  },
  {
    id: 4,
    question: 'Kapan views dan pendapatan saya mulai dihitung?',
    answer:
      'Perhitungan views dimulai segera setelah video yang kamu submit berstatus Approved oleh Brand. Semua dana campaign sudah dikunci di sistem Escrow sejak awal, jadi bayaranmu 100% terjamin selama masa campaign berlangsung.',
  },
  {
    id: 5,
    question: 'Berapa minimal penarikan saldo (withdraw)?',
    answer:
      'Saldo bisa kamu tarik kapan saja begitu mencapai minimal Rp 50.000. Pencairan mendukung transfer bank lokal (BCA, Mandiri, BRI, BNI, dll.) maupun e-wallet (DANA, GoPay, OVO) tanpa perlu nunggu akhir bulan.',
  },
  {
    id: 6,
    question: 'Kalau saya Brand, apakah budget saya aman?',
    answer:
      'Sangat aman dan anti-boncos. Klipday menggunakan sistem Protected Escrow: dana yang kamu depositkan dikunci di dalam sistem dan hanya terpotong saat klip yang sudah kamu approve menghasilkan views organik asli. Jika masa campaign selesai dan budget masih tersisa, sisa dana otomatis kembali 100% ke saldo dompetmu.',
  },
] as const;

export const HOME_FOOTER_LINKS: readonly NavLinkItem[] = [
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Benefit', href: '#benefit' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Peraturan Platform', href: '/peraturan' },
] as const;
