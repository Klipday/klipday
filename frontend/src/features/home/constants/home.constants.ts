import type {
  AudienceType,
  AutomatedPayoutCampaignRow,
  BenefitAudienceContent,
  BottomBannerAudienceContent,
  FaqHeaderContent,
  FaqItem,
  FloatingPayoutChannelItem,
  FooterNavGroup,
  HeroAudienceContent,
  HeroPayoutShareCardItem,
  HeroVideoClipStageItem,
  HowItWorksAudienceContent,
  ManifestoAudienceContent,
  NavLinkItem,
  PayoutTickerItem,
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
    dateLabel: '12/11/2026 • 11:20',
    creatorAmount: '+Rp2.324.049',
    brandMetric: '193.6K Views',
    period: '05/11/2026 - 12/11/2026',
    sizeClassName:
      'hidden lg:flex lg:w-[108px] lg:h-[144px] xl:w-[128px] xl:h-[168px]',
    amountClassName: 'text-[10px] xl:text-xs',
    emblemSizeClassName: 'size-8 xl:size-10',
    delay: 0.45,
  },
  {
    id: 'payout-middle',
    handle: '@maya_cut',
    dateLabel: '12/11/2026 • 11:42',
    creatorAmount: '+Rp4.230.245',
    brandMetric: '352.5K Views',
    period: '05/11/2026 - 12/11/2026',
    sizeClassName:
      'flex w-[106px] h-[144px] sm:w-[146px] sm:h-[198px] md:w-[122px] md:h-[166px] lg:w-[124px] lg:h-[168px] xl:w-[152px] xl:h-[206px]',
    amountClassName: 'text-[11px] sm:text-sm md:text-xs xl:text-[15px]',
    emblemSizeClassName: 'size-8 sm:size-11 md:size-9 xl:size-12',
    delay: 0.2,
  },
  {
    id: 'payout-outer',
    handle: '@adit_clip',
    dateLabel: '12/11/2026 • 12:00',
    creatorAmount: '+Rp3.049.994',
    brandMetric: '254.1K Views',
    period: '05/11/2026 - 12/11/2026',
    sizeClassName:
      'hidden md:flex md:w-[138px] md:h-[190px] lg:w-[142px] lg:h-[194px] xl:w-[178px] xl:h-[244px]',
    amountClassName: 'text-xs lg:text-sm xl:text-lg',
    emblemSizeClassName: 'size-10 lg:size-11 xl:size-14',
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

export const FLOATING_PAYOUT_CHANNELS: readonly FloatingPayoutChannelItem[] = [
  {
    id: 'bca',
    label: 'BCA',
    dotClassName: 'bg-sky-400',
    positionClassName: 'top-2.5 left-3 sm:left-6 -rotate-3',
    delay: 0,
  },
  {
    id: 'bri',
    label: 'BRI',
    dotClassName: 'bg-blue-400',
    positionClassName: 'top-2 left-1/2 -translate-x-1/2 rotate-2',
    delay: 0.4,
  },
  {
    id: 'dana',
    label: 'DANA',
    dotClassName: 'bg-cyan-400',
    positionClassName: 'top-2.5 right-3 sm:right-6 rotate-3',
    delay: 0.2,
  },
  {
    id: 'mandiri',
    label: 'Mandiri',
    dotClassName: 'bg-amber-400',
    positionClassName: 'bottom-2.5 left-3 sm:left-6 rotate-3',
    delay: 0.6,
  },
  {
    id: 'ovo',
    label: 'OVO',
    dotClassName: 'bg-violet-400',
    positionClassName: 'bottom-2 left-1/2 -translate-x-1/2 -rotate-2',
    delay: 0.8,
  },
  {
    id: 'gopay',
    label: 'GoPay',
    dotClassName: 'bg-emerald-400',
    positionClassName: 'bottom-2.5 right-3 sm:right-6 -rotate-3',
    delay: 1.0,
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
        'Nggak usah nunggu tanggal tua buat nikmatin hasil editanmu. Begitu saldo nyentuh Rp50.000, langsung cairin ke rekening BCA, Mandiri, BRI, atau saldo DANA, GoPay, dan OVO.',
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
    line1: '“Berhenti Bakar Budget.',
    line2: 'Gerakkan Ratusan Clipper,',
    line3: 'Dominasi FYP Tanpa Boncos.”',
    subtitle:
      'Ubah satu materi video brand kamu jadi ratusan klip viral dan bayar cuma buat views yang valid.',
  },
} as const;

export const DEFAULT_DISCORD_INVITE_URL = 'https://discord.gg/S2wYRNt7Q';

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
      'Klipday itu tempat ketemunya brand sama para pembuat video pendek atau clipper. Brand nyiapin bahan video dan budget promosi, lalu clipper bantu potong dan upload ke TikTok. Bayarannya dihitung transparan dari setiap 1.000 penayangan video yang sah.',
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
      'Aman banget karena semua budget campaign disimpan di sistem rekening bersama (Rekber) Klipday. Saldomu hanya terpotong untuk membayar klip yang sudah kamu setujui dan benar-benar ditonton penonton asli tanpa bot. Jika masa campaign selesai dan budget masih tersisa, uangnya kembali utuh ke saldo akunmu.',
  },
] as const;

export const HOME_FOOTER_LINKS: readonly NavLinkItem[] = [
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Benefit', href: '#benefit' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Aturan Main', href: '/peraturan' },
  { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
] as const;

export const HOME_FOOTER_NAV_GROUPS: readonly FooterNavGroup[] = [
  {
    title: 'Navigasi',
    links: [
      { label: 'Cara Kerja', href: '#cara-kerja' },
      { label: 'Benefit', href: '#benefit' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Ekosistem',
    links: [
      { label: 'Untuk Creator (Clipper)', href: '/signup?role=creator' },
      { label: 'Untuk Brand', href: '/signup?role=brand' },
      { label: 'Pasang Campaign', href: '/signup?role=brand' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Aturan Main', href: '/peraturan' },
      { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
      { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
    ],
  },
] as const;

export const HOME_FOOTER_SOCIAL_LINKS: readonly NavLinkItem[] = [
  { label: 'TikTok', href: 'https://tiktok.com/@klipday', isExternal: true },
  { label: 'Instagram', href: 'https://instagram.com/klipday', isExternal: true },
  { label: 'Kontak Support', href: 'mailto:support@klipday.com', isExternal: true },
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
