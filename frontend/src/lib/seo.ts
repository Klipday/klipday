export interface PageSeoOptions {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath?: string;
  readonly noIndex?: boolean;
}

const BASE_URL = 'https://klipday.com';
const INDEX_ROBOTS_CONTENT = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS_CONTENT = 'noindex, nofollow';

const STATIC_ROUTE_SEO_MAP: Readonly<Record<string, PageSeoOptions>> = {
  '/': {
    title: 'Klipday - Agensi & Platform Clipping Video Pendek Indonesia',
    description:
      'Klipday (klipday.com) adalah agensi dan platform layanan clipping terkelola di Indonesia yang menghubungkan Brand dengan jaringan Clipper terkurasi di TikTok, Instagram Reels, dan YouTube Shorts.',
    canonicalPath: '/',
  },
  '/faq': {
    title: 'FAQ - Pertanyaan Umum Clipper & Brand - Klipday',
    description:
      'Pertanyaan umum seputar layanan clipping terkelola Klipday, struktur biaya agensi dan CPM, SLA review dan pencairan payout, masa sanggah, serta kepatuhan pajak.',
    canonicalPath: '/faq',
  },
  '/peraturan': {
    title: 'Peraturan Platform, Aturan Main & SLA - Klipday',
    description:
      'Standar operasional dan peraturan resmi Klipday (BM-001): aturan clipper dan brand, integritas views organik bebas boosting, SLA review konten, masa sanggah, payout, dan perpajakan.',
    canonicalPath: '/peraturan',
  },
  '/syarat-ketentuan': {
    title: 'Syarat & Ketentuan Layanan - Klipday',
    description:
      'Syarat dan ketentuan layanan clipping terkelola Klipday (BM-001): ruang lingkup layanan, aturan Brand dan Clipper, SLA operasional, audit anti-bot, jadwal payout, serta perpajakan.',
    canonicalPath: '/syarat-ketentuan',
  },
  '/kebijakan-privasi': {
    title: 'Kebijakan Privasi - Klipday',
    description:
      'Kebijakan privasi resmi Klipday sesuai UU PDP No. 27/2022: perlindungan data pribadi clipper dan brand, validasi rekening pembayaran, bukti tayangan, serta administrasi pajak.',
    canonicalPath: '/kebijakan-privasi',
  },
  '/signin': {
    title: 'Masuk ke Akun Klipday - Agensi & Platform Clipping',
    description:
      'Masuk ke akun Klipday untuk memantau kampanye, memeriksa progres review klip, serta mengelola saldo dan pencairan.',
    canonicalPath: '/signin',
  },
  '/signup': {
    title: 'Daftar Akun Klipday - Gabung Clipper atau Brand',
    description:
      'Daftar akun Klipday sekarang. Gabung jaringan clipper terkurasi atau mulai kampanye clipping terkelola untuk brand Anda.',
    canonicalPath: '/signup',
  },
  '/verify-email': {
    title: 'Verifikasi Email - Klipday',
    description: 'Verifikasi alamat email akun Klipday Anda dengan kode OTP 6 digit.',
    canonicalPath: '/verify-email',
    noIndex: true,
  },
  '/forgot-password': {
    title: 'Lupa Kata Sandi - Klipday',
    description: 'Ajukan tautan pengaturan ulang kata sandi akun Klipday Anda.',
    canonicalPath: '/forgot-password',
    noIndex: true,
  },
  '/reset-password': {
    title: 'Atur Ulang Kata Sandi - Klipday',
    description: 'Tetapkan kata sandi baru untuk akun Klipday Anda.',
    canonicalPath: '/reset-password',
    noIndex: true,
  },
  '/admin-dashboard': {
    title: 'Dashboard Admin - Klipday',
    description: 'Panel kendali operasional dan ringkasan antrean administrator Klipday.',
    canonicalPath: '/admin-dashboard',
    noIndex: true,
  },
  '/admin-dashboard/campaigns': {
    title: 'Moderasi Kampanye - Klipday',
    description: 'Tinjau, setujui, dan kelola kampanye yang masuk pada platform Klipday.',
    canonicalPath: '/admin-dashboard/campaigns',
    noIndex: true,
  },
  '/admin-dashboard/settlements': {
    title: 'Settlement Kampanye - Klipday',
    description: 'Audit tayangan video dan finalisasi settlement kampanye Klipday.',
    canonicalPath: '/admin-dashboard/settlements',
    noIndex: true,
  },
  '/admin-dashboard/top-ups': {
    title: 'Verifikasi Top Up - Klipday',
    description: 'Verifikasi bukti transfer deposit saldo Brand di Klipday.',
    canonicalPath: '/admin-dashboard/top-ups',
    noIndex: true,
  },
  '/admin-dashboard/withdrawals': {
    title: 'Pencairan Withdraw - Klipday',
    description: 'Proses persetujuan pencairan saldo pengguna di Klipday.',
    canonicalPath: '/admin-dashboard/withdrawals',
    noIndex: true,
  },
  '/admin-dashboard/kyc': {
    title: 'Verifikasi KYC - Klipday',
    description: 'Verifikasi kesesuaian identitas dan rekening pembayaran pengguna Klipday.',
    canonicalPath: '/admin-dashboard/kyc',
    noIndex: true,
  },
  '/admin-dashboard/profile': {
    title: 'Profil Administrator - Klipday',
    description: 'Kelola nama tampilan dan keamanan kata sandi akun administrator Klipday.',
    canonicalPath: '/admin-dashboard/profile',
    noIndex: true,
  },
  '/creator-dashboard': {
    title: 'Dashboard Kreator - Klipday',
    description: 'Ringkasan performa klip, tayangan valid, dan saldo akun Clipper Klipday.',
    canonicalPath: '/creator-dashboard',
    noIndex: true,
  },
  '/creator-dashboard/creator-campaigns': {
    title: 'Eksplorasi Kampanye - Klipday',
    description: 'Temukan kampanye brand aktif dan materi brief di Klipday.',
    canonicalPath: '/creator-dashboard/creator-campaigns',
    noIndex: true,
  },
  '/creator-dashboard/submissions': {
    title: 'Pengajuan Video Saya - Klipday',
    description: 'Pantau status QA, permintaan revisi, dan performa klip yang telah Anda setorkan.',
    canonicalPath: '/creator-dashboard/submissions',
    noIndex: true,
  },
  '/creator-dashboard/wallet': {
    title: 'Dompet Kreator - Klipday',
    description: 'Pantau riwayat pendapatan dan ajukan penarikan saldo komisi Klipday.',
    canonicalPath: '/creator-dashboard/wallet',
    noIndex: true,
  },
  '/creator-dashboard/profile': {
    title: 'Profil Kreator - Klipday',
    description: 'Kelola profil clipper, akun media sosial terhubung, dan rekening payout.',
    canonicalPath: '/creator-dashboard/profile',
    noIndex: true,
  },
  '/brand-dashboard': {
    title: 'Dashboard Brand - Klipday',
    description: 'Pantau performa kampanye, tayangan klip, dan saldo anggaran Brand di Klipday.',
    canonicalPath: '/brand-dashboard',
    noIndex: true,
  },
  '/brand-dashboard/brand-campaigns': {
    title: 'Kampanye Saya - Klipday',
    description: 'Kelola daftar kampanye aktif, draf, maupun arsip kampanye Brand Anda.',
    canonicalPath: '/brand-dashboard/brand-campaigns',
    noIndex: true,
  },
  '/brand-dashboard/wallet': {
    title: 'Dompet Brand - Klipday',
    description: 'Kelola saldo deposit kampanye, mutasi anggaran, dan riwayat pembayaran Brand.',
    canonicalPath: '/brand-dashboard/wallet',
    noIndex: true,
  },
  '/brand-dashboard/profile': {
    title: 'Profil Brand - Klipday',
    description: 'Kelola identitas perusahaan, kontak utama, dan informasi akun Brand di Klipday.',
    canonicalPath: '/brand-dashboard/profile',
    noIndex: true,
  },
  '/notifications': {
    title: 'Notifikasi - Klipday',
    description: 'Pusat pemberitahuan aktivitas kampanye, review klip, dan transaksi keuangan.',
    canonicalPath: '/notifications',
    noIndex: true,
  },
} as const;

/**
 * Resolves the canonical path URL with a trailing slash for root and without trailing slashes for sub-routes.
 *
 * @param canonicalPath - Target path suffix.
 * @returns Full canonical URL under `https://klipday.com`.
 */
function BuildCanonicalUrl(canonicalPath: string): string {
  const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const trimmedPath = normalizedPath.replace(/\/+$/, '');
  if (!trimmedPath) {
    return `${BASE_URL}/`;
  }
  return `${BASE_URL}${trimmedPath}`;
}

/**
 * Updates document head SEO tags dynamically for single-page application navigation.
 * Updates `document.title`, meta description, title, robots/googlebot directives,
 * Open Graph tags, Twitter tags, and the canonical link element.
 *
 * @param options - Page SEO options including title, description, optional canonical path, and `noIndex`.
 * @returns void
 */
export function UpdatePageSeo({
  title,
  description,
  canonicalPath = '',
  noIndex = false,
}: PageSeoOptions): void {
  document.title = title;

  const SetMetaTag = (attributeName: 'name' | 'property', attributeValue: string, content: string) => {
    let element = document.querySelector<HTMLMetaElement>(`meta[${attributeName}="${attributeValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  const robotsContent = noIndex ? NOINDEX_ROBOTS_CONTENT : INDEX_ROBOTS_CONTENT;

  SetMetaTag('name', 'description', description);
  SetMetaTag('name', 'title', title);
  SetMetaTag('name', 'robots', robotsContent);
  SetMetaTag('name', 'googlebot', robotsContent);

  const canonicalUrl = BuildCanonicalUrl(canonicalPath);
  SetMetaTag('property', 'og:title', title);
  SetMetaTag('property', 'og:description', description);
  SetMetaTag('property', 'og:url', canonicalUrl);

  SetMetaTag('name', 'twitter:title', title);
  SetMetaTag('name', 'twitter:description', description);

  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);
}

/**
 * Resolves route-aware SEO metadata (`title`, `description`, `canonicalPath`, `noIndex`)
 * for authenticated dashboards, campaign wizards, detail views, and auth utility routes.
 *
 * @param pathname - Current router pathname from `useLocation().pathname`.
 * @returns Matching `PageSeoOptions` configuration for the route.
 */
export function ResolveRoutePageSeo(pathname: string): PageSeoOptions {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const directMatch = STATIC_ROUTE_SEO_MAP[normalizedPath];
  if (directMatch) {
    return directMatch;
  }

  if (/^\/brand-dashboard\/brand-campaigns\/[^/]+\/create(?:\/.*)?$/.test(normalizedPath)) {
    const wizardSeo: PageSeoOptions = {
      title: 'Buat & Atur Kampanye - Klipday',
      description: 'Atur informasi kampanye, materi sumber, brief kreatif, dan alokasi budget di Klipday.',
      canonicalPath: normalizedPath,
      noIndex: true,
    };
    return wizardSeo;
  }

  if (
    /^\/brand-dashboard\/brand-campaigns\/[^/]+$/.test(normalizedPath) ||
    /^\/campaigns\/[^/]+$/.test(normalizedPath)
  ) {
    const detailSeo: PageSeoOptions = {
      title: 'Detail Kampanye - Klipday',
      description: 'Detail kampanye, panduan brief, materi video sumber, dan pengajuan klip di Klipday.',
      canonicalPath: normalizedPath,
      noIndex: true,
    };
    return detailSeo;
  }

  const isPrivateArea =
    normalizedPath.startsWith('/admin-dashboard') ||
    normalizedPath.startsWith('/creator-dashboard') ||
    normalizedPath.startsWith('/brand-dashboard') ||
    normalizedPath.startsWith('/dashboard') ||
    normalizedPath.startsWith('/notifications') ||
    normalizedPath.startsWith('/campaigns');

  const fallbackSeo: PageSeoOptions = {
    title: 'Klipday - Agensi & Platform Clipping Video Pendek Indonesia',
    description:
      'Klipday (klipday.com) adalah agensi dan platform layanan clipping terkelola di Indonesia untuk Brand dan Clipper.',
    canonicalPath: normalizedPath,
    noIndex: isPrivateArea,
  };
  return fallbackSeo;
}

/**
 * Synchronizes `document.title` and meta tags to match the active route pathname.
 *
 * @param pathname - Current router pathname from `useLocation().pathname`.
 * @returns void
 */
export function SyncRoutePageSeo(pathname: string): void {
  const resolvedSeo = ResolveRoutePageSeo(pathname);
  UpdatePageSeo(resolvedSeo);
}
