import {
  CAMPAIGN_PLATFORM_OPTIONS,
  type BasicInfoFormValues,
  type CampaignCategoryOption,
  type CampaignPlatformOption,
  type CampaignTypeOption,
} from '../schemas';
import type { Campaign } from '../types';

const VALID_PLATFORM_SET = new Set<string>(CAMPAIGN_PLATFORM_OPTIONS);

/**
 * Extracts and maps campaign basic info data into form initial values,
 * falling back to clean defaults when values are missing.
 *
 * @param campaign - Optional partial campaign entity.
 * @returns Initialized BasicInfoFormValues object.
 */
export function GetInitialBasicInfo(campaign?: Partial<Campaign> | null): BasicInfoFormValues {
  const rawPlatforms = Array.isArray(campaign?.platforms) ? campaign.platforms : [];
  const validPlatforms = rawPlatforms.filter((p): p is CampaignPlatformOption => VALID_PLATFORM_SET.has(p));
  const platforms: CampaignPlatformOption[] = validPlatforms.length > 0 ? validPlatforms : ['TIKTOK'];

  const initialValues: BasicInfoFormValues = {
    title: campaign?.title ?? '',
    description: campaign?.description ?? '',
    campaignType: (campaign?.campaignType as CampaignTypeOption) ?? 'PRODUCT',
    campaignCategory: (campaign?.campaignCategory as CampaignCategoryOption) ?? 'BEAUTY_SKINCARE',
    thumbnailUrl: campaign?.thumbnailUrl ?? '',
    platforms,
    mainMediaUrl: campaign?.mainMediaUrl ?? '',
  };

  return initialValues;
}
