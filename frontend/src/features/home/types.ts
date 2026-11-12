import type { ReactNode } from 'react';

export type AudienceType = 'creator' | 'brand';

export interface NavLinkItem {
  readonly label: string;
  readonly href: string;
  readonly isExternal?: boolean;
}

export interface FooterNavGroup {
  readonly title: string;
  readonly links: readonly NavLinkItem[];
}

export interface HowItWorksStepItem {
  readonly stepNumber: string;
  readonly badgeText: string;
  readonly title: string;
  readonly description: string;
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
  readonly sectionPill: string;
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

export interface HeroVideoClipStageItem {
  readonly id: string;
  readonly handle: string;
  readonly sizeClassName: string;
  readonly imageSrc: string;
  readonly captionLead: string;
  readonly captionHighlight: string;
  readonly timecode?: string;
  readonly delay: number;
}

export interface HeroPayoutShareCardItem {
  readonly id: string;
  readonly handle: string;
  readonly dateLabel: string;
  readonly creatorAmount: string;
  readonly brandMetric: string;
  readonly period: string;
  readonly sizeClassName: string;
  readonly amountClassName: string;
  readonly emblemSizeClassName: string;
  readonly delay: number;
  readonly isLive?: boolean;
}

export interface FloatingPayoutChannelItem {
  readonly id: string;
  readonly label: string;
  readonly dotClassName: string;
  readonly positionClassName: string;
  readonly delay: number;
}

export interface AutomatedPayoutCampaignRow {
  readonly id: string;
  readonly title: string;
  readonly progress: number;
  readonly payout: string;
  readonly gradient: string;
  readonly delay: number;
}

export interface PayoutTickerItem {
  readonly id: string;
  readonly username: string;
  readonly amount: string;
  readonly channel: string;
  readonly timeAgo: string;
}

export interface BenefitAudienceContent {
  readonly sectionPill: string;
  readonly title: string;
  readonly cpmCard: {
    readonly title: string;
    readonly description: string;
    readonly metricLabel: string;
    readonly metricValue: string;
    readonly rawTargetValue: number;
    readonly metricPrefix?: string;
    readonly metricSuffix?: string;
    readonly badgeText: string;
  };
  readonly followersCard: {
    readonly title: string;
    readonly description: string;
    readonly metricLabel: string;
    readonly metricValue: string;
    readonly rawTargetValue: number;
    readonly metricPrefix?: string;
    readonly metricSuffix?: string;
  };
  readonly payoutCard: {
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
  };
}

export interface HomeActivityTickerProps {
  readonly className?: string;
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

export interface SectionBadgeProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export interface VerticalClipsCarouselMockupProps {
  readonly className?: string;
}

export interface AutomatedPayoutMockupProps {
  readonly className?: string;
}

export interface CreatorCampaignCardVisualProps {
  readonly className?: string;
}

export interface BrandCreateCampaignVisualProps {
  readonly className?: string;
}

export interface BrandClipReviewVisualProps {
  readonly className?: string;
}

export interface BrandEscrowTrackerVisualProps {
  readonly className?: string;
}

export interface UseMagneticHoverOptions {
  readonly maxPull?: number;
  readonly strength?: number;
}
