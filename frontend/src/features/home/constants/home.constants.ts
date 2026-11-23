import type {
  AudienceType,
  AutomatedPayoutCampaignRow,
  BenefitAudienceContent,
  BottomBannerAudienceContent,
  BrandEscrowClipRowItem,
  BrandMultiplierClipItem,
  FaqHeaderContent,
  FaqItem,
  FooterLinkColumn,
  HeroAudienceContent,
  HeroPayoutShareCardItem,
  HeroVideoClipStageItem,
  HowItWorksAudienceContent,
  ManifestoAudienceContent,
  NavLinkItem,
  PayoutTickerItem,
  VerticalClipCardItem,
} from '../types';

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
      'Biar ratusan clipper bantu ramein produkmu di TikTok dengan berbagai gaya konten. Tanpa biaya endorse mahal di awal, cukup bayar tiap 1.000 penayangan asli.',
    ctaLabel: 'Buat Campaign Sekarang',
    ctaHref: '/signup',
    trustPill: 'Budget tersimpan aman di Rekber Klipday, bayar hanya penayangan asli, sisa saldo otomatis kembali',
  },
} as const;

export const HERO_LEFT_VIDEO_CLIPS: readonly HeroVideoClipStageItem[] = [
  {
    id: 'clip-outer',
    handle: '@podcast_bisnis',
    sizeClassName:
      'hidden md:flex md:w-[130px] md:h-[190px] lg:w-[132px] lg:h-[194px] xl:w-[168px] xl:h-[244px]',
    imageSrc:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=480&q=80',
    captionLead: 'OKE KITA',
    captionHighlight: 'PRAKTEK AJA',
    timecode: '00:20:38:19',
    delay: 0,
  },
  {
    id: 'clip-middle',
    handle: '@adit_clip',
    sizeClassName:
      'flex w-[98px] h-[144px] sm:w-[136px] sm:h-[198px] md:w-[114px] md:h-[166px] lg:w-[114px] lg:h-[168px] xl:w-[142px] xl:h-[206px]',
    imageSrc:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=420&q=80',
    captionLead: 'modal hp bisa',
    captionHighlight: 'tembus FYP',
    delay: 0.25,
  },
  {
    id: 'clip-inner',
    handle: '@maya_cut',
    sizeClassName:
      'hidden lg:flex lg:w-[98px] lg:h-[144px] xl:w-[116px] xl:h-[168px]',
    imageSrc:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=380&q=80',
    captionLead: 'hook 3 detik',
    captionHighlight: 'auto cuan',
    delay: 0.5,
  },
] as const;

export const HERO_RIGHT_PAYOUT_CARDS: readonly HeroPayoutShareCardItem[] = [
  {
    id: 'payout-inner',
    handle: '@fajar_edit',
    creatorAmount: '+Rp2.324.049',
    brandMetric: '193.6K Views',
    payoutChannel: 'Mandiri',
    sizeClassName:
      'hidden lg:flex lg:w-[108px] lg:h-[144px] xl:w-[128px] xl:h-[168px]',
    amountClassName: 'text-[11px] xl:text-[13px]',
    delay: 0.45,
  },
  {
    id: 'payout-middle',
    handle: '@maya_cut',
    creatorAmount: '+Rp4.230.245',
    brandMetric: '352.5K Views',
    payoutChannel: 'DANA',
    sizeClassName:
      'flex w-[106px] h-[144px] sm:w-[146px] sm:h-[198px] md:w-[122px] md:h-[166px] lg:w-[124px] lg:h-[168px] xl:w-[152px] xl:h-[206px]',
    amountClassName: 'text-[11px] sm:text-sm md:text-xs xl:text-[15px]',
    delay: 0.2,
  },
  {
    id: 'payout-outer',
    handle: '@adit_clip',
    creatorAmount: '+Rp3.049.994',
    brandMetric: '254.1K Views',
    payoutChannel: 'BCA',
    sizeClassName:
      'hidden md:flex md:w-[138px] md:h-[190px] lg:w-[142px] lg:h-[194px] xl:w-[178px] xl:h-[244px]',
    amountClassName: 'text-[13px] lg:text-sm xl:text-[17px]',
    delay: 0,
    isLive: true,
  },
] as const;

export const HOME_HOW_IT_WORKS_CONTENT: Record<AudienceType, HowItWorksAudienceContent> = {
  creator: {
    sectionPill: 'Cara Kerja',
    title: 'Cuma 3 Langkah Buat Mulai Cuan',
    steps: [
      {
        stepNumber: '01',
        badgeText: 'LANGKAH 01',
        title: 'Pilih Campaign yang Kamu Suka',
        description:
          'Cari brand atau produk yang pas sama gaya kontenmu. Bahan video mentah dan arahan brief udah disiapin lengkap, jadi kamu nggak perlu bikin konten dari nol.',
      },
      {
        stepNumber: '02',
        badgeText: 'LANGKAH 02',
        title: 'Potong Video lalu Upload ke TikTok',
        description:
          'Ambil momen paling menarik, kasih hook yang bikin orang betah nonton, terus upload langsung ke akun TikTok kamu. Abis tayang, tinggal tempel link videonya di Klipday.',
      },
      {
        stepNumber: '03',
        badgeText: 'LANGKAH 03',
        title: 'Views Jalan, Saldo Ikut Nambah',
        description:
          'Begitu videomu disetujui brand, tiap penayangan asli dari penonton langsung terhitung jadi saldo. Udah kumpul minimal Rp50.000? Bisa langsung kamu cairin kapan aja.',
      },
    ],
  },
  brand: {
    sectionPill: 'Cara Kerja',
    title: 'Cara Simpel Bikin Produkmu Rame di FYP',
    steps: [
      {
        stepNumber: '01',
        badgeText: 'LANGKAH 01',
        title: 'Siapin Bahan Video dan Atur Budget',
        description:
          'Upload footage produk atau podcast kamu, tulis arahan singkat buat kreator, lalu tentukan sendiri bayaran per 1.000 views sesuai budget promosi.',
      },
      {
        stepNumber: '02',
        badgeText: 'LANGKAH 02',
        title: 'Cek dan Pilih Klip yang Masuk',
        description:
          'Para clipper bakal mulai setor potongan video terbaik mereka. Kamu bebas pilih video mana yang layak jalan atau minta revisi kalau ada bagian yang belum pas.',
      },
      {
        stepNumber: '03',
        badgeText: 'LANGKAH 03',
        title: 'Bayar Cuma Buat Video yang Ditonton',
        description:
          'Saldo campaign cuma kepotong dari klip pilihanmu yang beneran ditonton audiens nyata. Kalau masa campaign selesai dan budget masih sisa, uangnya balik utuh ke dompetmu.',
      },
    ],
  },
} as const;

export const BRAND_MULTIPLIER_PHONE_CLIPS: readonly BrandMultiplierClipItem[] = [
  {
    id: 'brand-clip-left',
    handle: '@maya_cut',
    views: '84K',
    thumbnailSrc: '/assets/images/clip-maya.webp',
    thumbnailAlt: 'Cuplikan video produk gaya ulasan cepat oleh @maya_cut',
    rotate: -7,
    yRange: [4, -4, 4],
    duration: 4.4,
  },
  {
    id: 'brand-clip-center',
    handle: '@adit_clipper',
    views: '142K',
    thumbnailSrc: '/assets/images/clip-adit.webp',
    thumbnailAlt: 'Cuplikan video produk utama di FYP oleh @adit_clipper',
    rotate: 0,
    yRange: [-5, 5, -5],
    duration: 3.8,
    isFocal: true,
  },
  {
    id: 'brand-clip-right',
    handle: '@fajar_edit',
    views: '61K',
    thumbnailSrc: '/assets/images/clip-fajar.webp',
    thumbnailAlt: 'Cuplikan video highlight fitur produk oleh @fajar_edit',
    rotate: 7,
    yRange: [3, -5, 3],
    duration: 4.8,
  },
] as const;

export const BRAND_ESCROW_CLIP_ROWS: readonly BrandEscrowClipRowItem[] = [
  {
    id: 'escrow-clip-1',
    handle: '@maya_cut',
    views: '142K views',
    cost: '-Rp 1.704.000',
    thumbnailSrc: '/assets/images/clip-maya.webp',
    thumbnailAlt: 'Thumbnail klip @maya_cut',
  },
  {
    id: 'escrow-clip-2',
    handle: '@fajar_edit',
    views: '98K views',
    cost: '-Rp 1.176.000',
    thumbnailSrc: '/assets/images/clip-fajar.webp',
    thumbnailAlt: 'Thumbnail klip @fajar_edit',
  },
] as const;

export const HOME_BENEFITS_CONTENT: Record<AudienceType, BenefitAudienceContent> = {
  creator: {
    sectionPill: 'Benefit',
    title: 'Kenapa Anak Clipper Betah di Sini',
    cpmCard: {
      title: 'Tahu Bayarannya Sebelum Mulai Edit',
      description:
        'Nggak perlu nebak komisi atau nunggu barang laku dulu. Sejak awal kamu udah tahu persis berapa rupiah yang masuk tiap videomu tembus 1.000 views.',
      metricLabel: 'Rata rata bayaran campaign',
      metricValue: 'Rp 12.000 per 1.000 views',
      rawTargetValue: 12000,
      metricPrefix: 'Rp ',
      metricSuffix: ' per 1.000 views',
      badgeText: 'Populer',
    },
    followersCard: {
      title: 'Akun Baru Tetap Bisa Gajian',
      description:
        'Baru bikin akun TikTok kemarin? Aman banget. Di TikTok sekarang yang penting 3 detik pertama videomu asik ditonton. Begitu tembus FYP, setiap views langsung dibayar.',
      metricLabel: 'Syarat minimal followers',
      metricValue: '0 Followers',
      rawTargetValue: 0,
      metricSuffix: ' Followers',
    },
    payoutCard: {
      title: 'Kumpul Rp50.000 Langsung Tarik',
      description:
        'Nggak usah nunggu akhir bulan buat nikmatin hasil editanmu. Begitu saldo nyentuh Rp50.000, langsung cairin ke rekening bank atau e-wallet pilihanmu kapan aja.',
      statusLabel: 'Saldo Tersedia',
      statusValue: 'Siap Ditarik',
      amountOrProtection: 'Rp 500.000',
      rawTargetValue: 500000,
      metricPrefix: 'Rp ',
      buttonLabel: 'Tarik Saldo',
      buttonHref: '/signup',
    },
  },
  brand: {
    sectionPill: 'Benefit',
    title: 'Cara Baru Promosi Tanpa Takut Boncos',
    cpmCard: {
      title: 'Nggak Ada Views, Nggak Keluar Biaya',
      description:
        'Udah lewat masanya bayar mahal di depan tapi penonton sepi. Di Klipday, budget promosimu cuma jalan kalau video kreator beneran ditonton audiens asli.',
      metricLabel: 'Biaya Tanpa Views',
      metricValue: 'Rp 0',
      rawTargetValue: 0,
      metricPrefix: 'Rp ',
      badgeText: '100% Penonton Nyata',
    },
    followersCard: {
      title: 'Satu Materi Jadi Ratusan Konten',
      description:
        'Satu video panjang dari brand kamu bisa diolah ratusan clipper dengan gaya pancingan yang beda di tiap akun. Makin sering lewat di FYP orang, makin nempel brand kamu.',
      metricLabel: 'Variasi gaya konten',
      metricValue: 'Ratusan klip',
      rawTargetValue: 100,
      metricSuffix: ' klip',
    },
    payoutCard: {
      title: 'Sisa Budget Pasti Balik Utuh',
      description:
        'Dana promosi disimpan aman di sistem rekening bersama Klipday selama campaign jalan. Kalau waktu campaign habis dan budget belum kepakai semua, sisanya otomatis balik ke saldo akunmu.',
      statusLabel: 'Jaminan Saldo Aman',
      statusValue: 'Aktif 100%',
      amountOrProtection: '100% Terlindungi',
      rawTargetValue: 100,
      metricSuffix: '% Terlindungi',
      buttonLabel: 'Buat Campaign Sekarang',
      buttonHref: '/signup',
    },
  },
} as const;

export const HOME_MANIFESTO_CONTENT: Record<AudienceType, ManifestoAudienceContent> = {
  creator: {
    line1: '“Berhenti Doom Scrolling.',
    line2: 'Gabung Sekarang,',
    line3: 'Raih Jutaan Dari Views.”',
    subtitle:
      'Gabung jadi bagian dari kami dan raih jutaan rupiah dari setiap views yang kamu dapet.',
  },
  brand: {
    line1: '“Berhenti Bakar Duit buat Marketing.',
    line2: 'Raih Jutaan Views,',
    line3: 'dari Ratusan Video Viral Produkmu.”',
    subtitle:
      'Cukup bayar untuk penayangan asli, sementara ratusan clipper membantu produkmu terus muncul di FYP setiap hari.',
  },
} as const;

export const DEFAULT_DISCORD_INVITE_URL = 'https://discord.gg/zzMgga7eZ';
export const DEFAULT_WHATSAPP_SUPPORT_URL = 'https://wa.me/628998732627';

export const HOME_BOTTOM_BANNER_CONTENT: Record<AudienceType, BottomBannerAudienceContent> = {
  creator: {
    sectionPill: 'Komunitas',
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
    sectionPill: 'Mulai Sekarang',
    heading: 'Siap Bikin Produkmu Rame di TikTok?',
    description:
      'Bikin campaign pertamamu cuma butuh beberapa menit. Siapkan bahan videonya, atur budget sesuai kemampuan, dan biarkan ratusan clipper bantu sebarin brand kamu.',
    ctaLabel: 'Pasang Campaign Sekarang',
    ctaHref: '/signup',
    isExternalCta: false,
    widgetHeader: 'ESTIMASI JANGKAUAN CAMPAIGN',
    widgetStatus: 'Saldo Terlindungi',
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
      'Klipday adalah agensi dan platform layanan clipping terkelola yang menghubungkan brand dengan jaringan clipper terkurasi untuk distribusi konten pendek di TikTok, Instagram Reels, dan YouTube Shorts. Klipday menyusun brief, menyeleksi clipper, melakukan quality assurance (QA), memantau tayangan, hingga mengelola pembayaran.',
  },
  {
    id: 2,
    question: 'Akun sosial masih 0 followers apa beneran bisa ikutan?',
    answer:
      'Bisa banget. Algoritma konten pendek menilai kualitas hook awal dan retensi penonton, bukan jumlah followers semata. Selama akun kamu lolos verifikasi kepemilikan (maksimal 2 hari kerja), bersifat publik, dan memenuhi brief, semua tayangan organik yang sah tetap dihitung.',
  },
  {
    id: 3,
    question: 'Gimana cara mulai cari cuan dari ngeklip?',
    answer:
      'Daftar akun gratis (satu akun per orang), verifikasi akun sosial lewat kode bio, lalu pilih kampanye aktif dan ikuti brief-nya. Edit materi menjadi klip orisinal tanpa logo kompetitor, unggah dulu ke akunmu, lalu setorkan link ke Klipday untuk dicek tim QA (kelengkapan maks. 1 hari kerja, review substantif maks. 2 hari kerja).',
  },
  {
    id: 4,
    question: 'Kapan views dihitung dan bagaimana jadwal payout-nya?',
    answer:
      'Setelah klip disetujui, tayangan organik dilacak hingga tanggal cut-off atau penutupan kampanye. Statement pendapatan dikirim maksimal H+2 hari kerja, disusul masa sanggah 2 hari kerja dan audit anti-bot maksimal 3 hari kerja, lalu payout disalurkan H+3 hingga H+5 hari kerja setelah dana brand diterima.',
  },
  {
    id: 5,
    question: 'Berapa minimal saldo penarikan dan apa syarat rekeningnya?',
    answer:
      'Batas minimal penarikan saldo dompet di dashboard adalah Rp 50.000 melalui transfer bank maupun e-wallet. Nama pemilik rekening harus sama dengan identitas akun terverifikasi (perubahan data rekening diproses maks. 2 hari kerja), serta mengikuti pemotongan pajak PPh Pasal 21 sesuai ketentuan yang berlaku.',
  },
  {
    id: 6,
    question: 'Untuk pemilik brand, berapa minimum budget dan apa jaminannya?',
    answer:
      'Minimum budget dimulai dari Rp 1.000.000 dengan biaya agensi 30% dan tarif CPM per 1.000 tayangan yang disepakati (plus rush fee 10–15% jika tenggat di bawah 30 hari). Semua klip diaudit bebas bot maupun boosting berbayar, dilindungi hak takedown lewat Account Manager, dan sisa deposit kembali utuh saat settlement.',
  },
] as const;

export const HOME_FOOTER_COLUMNS: readonly FooterLinkColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Cara Kerja', href: '#cara-kerja' },
      { label: 'Benefit', href: '#benefit' },
      { label: 'Masuk', href: '/signin' },
      { label: 'Daftar Akun', href: '/signup' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Peraturan Platform', href: '/peraturan' },
      { label: 'Komunitas Discord', href: DEFAULT_DISCORD_INVITE_URL, isExternal: true },
      { label: 'Kontak Support', href: DEFAULT_WHATSAPP_SUPPORT_URL, isExternal: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
      { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
    ],
  },
] as const;

export const AUTOMATED_PAYOUT_CAMPAIGN_ROWS: readonly AutomatedPayoutCampaignRow[] = [
  {
    id: 'row-1',
    title: 'Podcast Bisnis Ep. 42',
    progress: 46,
    payout: 'Rp 276.000',
    gradient: 'from-rose-500 to-rose-400',
    delay: 0.1,
  },
  {
    id: 'row-2',
    title: 'Review Skincare Glow',
    progress: 66,
    payout: 'Rp 396.000',
    gradient: 'from-emerald-500 to-emerald-400',
    delay: 0.25,
  },
  {
    id: 'row-3',
    title: 'E-Commerce Promo FYP',
    progress: 54,
    payout: 'Rp 324.000',
    gradient: 'from-rose-500 via-amber-400 to-emerald-400',
    delay: 0.4,
  },
] as const;

export const HOME_PAYOUT_TICKER_ITEMS: readonly PayoutTickerItem[] = [
  { id: 'p1', username: '@adit_clip', amount: 'Rp 450.000', channel: 'BCA', timeAgo: '2m lalu' },
  { id: 'p2', username: '@maya321', amount: 'Rp 150.000', channel: 'DANA', timeAgo: '4m lalu' },
  { id: 'p3', username: '@rendy_edits', amount: 'Rp 720.000', channel: 'Mandiri', timeAgo: '5m lalu' },
  { id: 'p4', username: '@sarah_cuan', amount: 'Rp 280.000', channel: 'GoPay', timeAgo: '7m lalu' },
  { id: 'p5', username: '@fajar_clipping', amount: 'Rp 1.250.000', channel: 'BRI', timeAgo: '9m lalu' },
  { id: 'p6', username: '@budi_santoso', amount: 'Rp 500.000', channel: 'BCA', timeAgo: '12m lalu' },
  { id: 'p7', username: '@dimas_tiktok', amount: 'Rp 340.000', channel: 'OVO', timeAgo: '14m lalu' },
  { id: 'p8', username: '@rizky_creative', amount: 'Rp 890.000', channel: 'BNI', timeAgo: '16m lalu' },
  { id: 'p9', username: '@anita_clips', amount: 'Rp 210.000', channel: 'DANA', timeAgo: '19m lalu' },
  { id: 'p10', username: '@kevin_editz', amount: 'Rp 600.000', channel: 'Mandiri', timeAgo: '22m lalu' },
  { id: 'p11', username: '@tiara_story', amount: 'Rp 420.000', channel: 'BCA', timeAgo: '25m lalu' },
  { id: 'p12', username: '@bayu_pratama', amount: 'Rp 1.050.000', channel: 'BRI', timeAgo: '28m lalu' },
] as const;

export const VERTICAL_CLIPS_MOCKUP_ITEMS: readonly VerticalClipCardItem[] = [
  {
    id: 'clip-1',
    handle: '@maya_cut',
    views: '86K',
    thumbnailSrc: '/assets/images/clip-maya.webp',
    thumbnailAlt: 'Thumbnail klip video ulasan produk oleh @maya_cut',
    yRange: [-6, 6, -6],
    duration: 4.6,
  },
  {
    id: 'clip-2',
    handle: '@adit_clipper',
    views: '124K',
    thumbnailSrc: '/assets/images/clip-adit.webp',
    thumbnailAlt: 'Thumbnail klip video podcast oleh @adit_clipper',
    isFocal: true,
    yRange: [6, -8, 6],
    duration: 3.8,
  },
  {
    id: 'clip-3',
    handle: '@fajar_edit',
    views: '54K',
    thumbnailSrc: '/assets/images/clip-fajar.webp',
    thumbnailAlt: 'Thumbnail klip video ulasan teknologi oleh @fajar_edit',
    yRange: [-8, 4, -8],
    duration: 5.2,
    delay: 0.4,
  },
] as const;
