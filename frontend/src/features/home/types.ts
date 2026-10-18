export type AudienceType = 'creator' | 'brand';

export interface NavLinkItem {
  readonly label: string;
  readonly href: string;
}

export interface HowItWorksStepItem {
  readonly stepNumber: string;
  readonly badgeText: string;
  readonly title: string;
  readonly description: string;
  readonly imageSrc: string;
}

export interface FaqItem {
  readonly id: number;
  readonly question: string;
  readonly answer: string;
}

export interface FaqHeaderContent {
  readonly sectionPill: string;
  readonly title: string;
  readonly subtitle: string;
}

export interface BottomBannerChannelItem {
  readonly name: string;
  readonly badgeText: string;
  readonly isHighlight?: boolean;
}

export interface BottomBannerAudienceContent {
  readonly heading: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly isExternalCta: boolean;
  readonly widgetHeader: string;
  readonly widgetStatus: string;
  readonly channelsOrHighlights: readonly BottomBannerChannelItem[];
}

export interface HeroAudienceContent {
  readonly headlineLead: string;
  readonly headlineHighlight: string;
  readonly subcopy: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly trustPill: string;
}

export interface HowItWorksAudienceContent {
  readonly sectionPill: string;
  readonly title: string;
  readonly steps: readonly HowItWorksStepItem[];
}

export interface BenefitAudienceContent {
  readonly sectionPill: string;
  readonly title: string;
  readonly cpmCard: {
    readonly overline: string;
    readonly title: string;
    readonly description: string;
    readonly metricLabel: string;
    readonly metricValue: string;
    readonly rawTargetValue: number;
    readonly metricPrefix?: string;
    readonly metricSuffix?: string;
    readonly badgeText: string;
    readonly imageSrc: string;
  };
  readonly followersCard: {
    readonly overline: string;
    readonly title: string;
    readonly description: string;
    readonly metricLabel: string;
    readonly metricValue: string;
    readonly rawTargetValue: number;
    readonly metricPrefix?: string;
    readonly metricSuffix?: string;
    readonly imageSrc: string;
  };
  readonly payoutCard: {
    readonly overline: string;
    readonly title: string;
    readonly description: string;
    readonly statusLabel: string;
    readonly statusValue: string;
    readonly amountOrProtection: string;
    readonly rawTargetValue: number;
    readonly metricPrefix?: string;
    readonly metricSuffix?: string;
    readonly buttonLabel: string;
    readonly buttonHref: string;
    readonly imageSrc: string;
  };
}

export interface BlendedIllustrationProps {
  readonly src: string;
  readonly alt: string;
  readonly className?: string;
  readonly imageClassName?: string;
}

export interface HomeNavbarProps {
  readonly activeAudience: AudienceType;
  readonly onAudienceChange: (audience: AudienceType) => void;
  readonly className?: string;
}

export interface HomeHeroProps {
  readonly activeAudience: AudienceType;
  readonly onAudienceChange: (audience: AudienceType) => void;
  readonly className?: string;
}

export interface HomeHowItWorksProps {
  readonly activeAudience: AudienceType;
  readonly className?: string;
}

export interface HomeBenefitsProps {
  readonly activeAudience: AudienceType;
  readonly className?: string;
}

export interface HomeFaqProps {
  readonly className?: string;
}

export interface HomeDiscordBannerProps {
  readonly activeAudience: AudienceType;
  readonly className?: string;
}

export interface HomeFooterProps {
  readonly className?: string;
}

export interface UseMagneticHoverOptions {
  readonly maxPull?: number;
  readonly strength?: number;
}
