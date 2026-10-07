import { Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  CampaignStepSkeleton,
  CampaignWizardError,
  CampaignWizardHeader,
  CampaignWizardSkeleton,
  CampaignWizardStepper,
} from '../components';
import { CAMPAIGN_WIZARD_STEPS, GetWizardStepPath } from '../config/wizard-steps';
import { UseCampaignQuery } from '../hooks';
import { GetHighestAccessibleStepNumber } from '../utils';

/**
 * Layout orchestrator for the campaign creation workflow wizard.
 * Houses the wizard header with back navigation,
 * the progress stepper showing current step completion and locks,
 * route guards ensuring users cannot skip incomplete mandatory steps,
 * centralized error recovery, and the dynamic nested route outlet for each step.
 *
 * @returns The rendered campaign wizard layout shell.
 */
function CampaignWizardLayout() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();

  const { data: campaign, isLoading, isError, error, refetch } = UseCampaignQuery(id);

  const matchedStep = CAMPAIGN_WIZARD_STEPS.find((step) => location.pathname.includes(step.slug));
  const currentStepNumber = matchedStep?.stepNumber ?? 1;

  const highestAllowedStep = GetHighestAccessibleStepNumber(campaign);
  const isForbiddenStep = !isLoading && !isError && Boolean(campaign) && currentStepNumber > highestAllowedStep;

  useEffect(() => {
    if (isForbiddenStep) {
      toast.warning('Harap lengkapi langkah sebelumnya terlebih dahulu.', {
        id: 'forbidden-step-toast',
      });
    } else {
      toast.dismiss('forbidden-step-toast');
    }
  }, [isForbiddenStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (!id) {
    return <Navigate to="/brand-dashboard/brand-campaigns" replace />;
  }

  if (isLoading) {
    return <CampaignWizardSkeleton />;
  }

  if (isError) {
    return <CampaignWizardError message={error?.message} onRetry={() => refetch()} />;
  }

  if (
    campaign?.campaignStatus &&
    campaign.campaignStatus !== 'DRAFT' &&
    campaign.campaignStatus !== 'REVISION' &&
    campaign.campaignStatus !== 'AWAITING_PAYMENT'
  ) {
    return <Navigate to="/brand-dashboard/brand-campaigns?status=IN_REVIEW" replace />;
  }

  if (campaign?.campaignStatus === 'AWAITING_PAYMENT' && !location.pathname.includes('step-6')) {
    const step6Path = GetWizardStepPath('step-6', id);
    return <Navigate to={step6Path} replace />;
  }

  if (isForbiddenStep) {
    const fallbackStep = CAMPAIGN_WIZARD_STEPS[highestAllowedStep - 1] ?? CAMPAIGN_WIZARD_STEPS[0];
    const fallbackPath = GetWizardStepPath(fallbackStep.slug, id);
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <div className="w-full max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col gap-4">
        <CampaignWizardHeader />
        <div className="pt-2">
          <CampaignWizardStepper campaign={campaign} />
        </div>
      </div>

      <div>
        <Suspense fallback={<CampaignStepSkeleton />}>
          <Outlet context={{ campaign }} />
        </Suspense>
      </div>
    </div>
  );
}

export default CampaignWizardLayout;
