-- AlterEnum: Add INSTAGRAM and YOUTUBE to platform enum
ALTER TYPE "platform" ADD VALUE IF NOT EXISTS 'INSTAGRAM';
ALTER TYPE "platform" ADD VALUE IF NOT EXISTS 'YOUTUBE';

-- AlterTable: Replace Campaign.platform with Campaign.platforms[] and add max_submissions_per_platform
ALTER TABLE "campaigns"
ADD COLUMN "platforms" "platform"[] NOT NULL DEFAULT ARRAY['TIKTOK']::"platform"[],
ADD COLUMN "max_submissions_per_platform" INTEGER DEFAULT 1;

UPDATE "campaigns"
SET "platforms" = ARRAY["platform"]::"platform"[]
WHERE "platform" IS NOT NULL;

ALTER TABLE "campaigns"
DROP COLUMN "platform";

-- AlterTable: Add platform and external_video_id to submissions
ALTER TABLE "submissions"
ADD COLUMN "platform" "platform" NOT NULL DEFAULT 'TIKTOK',
ADD COLUMN "external_video_id" TEXT;

-- Backfill submission platform from linked social account when available
UPDATE "submissions" AS s
SET "platform" = csa."platform"
FROM "creator_social_accounts" AS csa
WHERE s."social_account_id" = csa."id";

-- Drop old single-submission-per-creator unique constraint
DROP INDEX IF EXISTS "submissions_campaign_id_creator_id_key";

-- Add query indexes and active-video duplicate prevention
CREATE INDEX "submissions_campaign_id_creator_id_platform_status_idx"
ON "submissions"("campaign_id", "creator_id", "platform", "status");

CREATE INDEX "submissions_campaign_id_platform_external_video_id_idx"
ON "submissions"("campaign_id", "platform", "external_video_id");

CREATE UNIQUE INDEX "submissions_campaign_platform_external_video_active_key"
ON "submissions"("campaign_id", "platform", "external_video_id")
WHERE "status" = 'ACTIVE' AND "external_video_id" IS NOT NULL;
