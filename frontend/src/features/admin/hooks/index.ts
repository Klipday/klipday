import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DisqualifySettlementSubmission,
  FinalizeCampaignSettlement,
  GetAdminCampaignSettlementSummary,
  GetAdminKycList,
  GetAdminModerationCampaigns,
  GetAdminSettlementCampaigns,
  GetAdminTopUps,
  GetAdminWithdrawals,
  ModerateCampaign,
  RecalculateCampaignSettlementFifo,
  ReviewAdminKyc,
  ReviewAdminWithdrawal,
  ReviewBrandTopUp,
  ToggleCampaignFeatured,
  TriggerCampaignMetricsSync,
  UpdateSettlementSubmissionViews,
} from '../api';
import type {
  AdminModerateCampaignPayload,
  AdminModerationQueryParams,
  AdminSettlementQueryParams,
  DisqualifySettlementSubmissionPayload,
  GetAdminKycParams,
  GetAdminTopUpsParams,
  GetAdminWithdrawalsParams,
  ReviewAdminWithdrawalPayload,
  ReviewBrandTopUpPayload,
  ReviewKycPayload,
  ToggleCampaignFeaturedPayload,
  UpdateSettlementSubmissionViewsPayload,
} from '../types';

export const ADMIN_SETTLEMENTS_QUERY_KEY = ['admin-settlements'] as const;
export const ADMIN_MODERATION_CAMPAIGNS_QUERY_KEY = ['admin-moderation-campaigns'] as const;
export const ADMIN_TOPUPS_QUERY_KEY = ['admin-top-ups'] as const;
export const ADMIN_WITHDRAWALS_QUERY_KEY = ['admin-withdrawals'] as const;
export const ADMIN_KYC_QUERY_KEY = ['admin', 'kyc'] as const;
export const ADMIN_DASHBOARD_QUERY_KEY = ['admin', 'dashboard'] as const;

/**
 * Queries the paginated list of campaigns ready for settlement review (`GET /admin/settlements`).
 *
 * @param params - Filter, search, page, and limit query parameters.
 * @returns TanStack Query result containing settlement cards and tab counts.
 */
export function UseAdminSettlementCampaignsQuery(params?: AdminSettlementQueryParams) {
  const queryResult = useQuery({
    queryKey: [...ADMIN_SETTLEMENTS_QUERY_KEY, params],
    queryFn: () => GetAdminSettlementCampaigns(params),
    staleTime: 1000 * 15,
  });

  return queryResult;
}

/**
 * Queries the FIFO settlement ledger and ordered submission queue for a campaign
 * (`GET /admin/settlements/campaigns/:id`).
 *
 * @param campaignId - Target campaign UUID.
 * @returns TanStack Query result containing the campaign settlement summary.
 */
export function UseAdminCampaignSettlementSummaryQuery(campaignId: string | undefined) {
  const queryResult = useQuery({
    queryKey: ['admin-campaign-settlement', campaignId],
    queryFn: () => {
      if (!campaignId) {
        throw new Error('ID Kampanye diperlukan');
      }
      const responsePromise = GetAdminCampaignSettlementSummary(campaignId);
      return responsePromise;
    },
    enabled: Boolean(campaignId),
    staleTime: 1000 * 10,
  });

  return queryResult;
}

/**
 * Mutation hook to disqualify an APPROVED submission during settlement audit and trigger FIFO reshuffle.
 *
 * @returns TanStack Mutation object for disqualifying a submission.
 */
export function UseDisqualifySettlementSubmissionMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: DisqualifySettlementSubmissionPayload) =>
      DisqualifySettlementSubmission(payload),
    onSuccess: (_data, variables) => {
      toast.success('Video didiskualifikasi. Alokasi reward telah disesuaikan otomatis.');
      queryClient.invalidateQueries({
        queryKey: ['admin-campaign-settlement', variables.campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTLEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: ['campaign-submissions', variables.campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaign', variables.campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mendiskualifikasi pengajuan video.');
    },
  });

  return mutation;
}

/**
 * Mutation hook to update verified views on a submission and recalculate FIFO reward allocations.
 *
 * @returns TanStack Mutation object for updating verified views.
 */
export function UseUpdateSettlementSubmissionViewsMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: UpdateSettlementSubmissionViewsPayload) =>
      UpdateSettlementSubmissionViews(payload),
    onSuccess: (_data, variables) => {
      toast.success('Tayangan diperbarui dan alokasi reward telah disesuaikan.');
      queryClient.invalidateQueries({
        queryKey: ['admin-campaign-settlement', variables.campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTLEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: ['campaign-submissions', variables.campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui tayangan video.');
    },
  });

  return mutation;
}

/**
 * Mutation hook to recalculate FIFO reward allocations across all APPROVED submissions on a campaign.
 *
 * @returns TanStack Mutation object for recalculating FIFO allocations.
 */
export function UseRecalculateSettlementFifoMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (campaignId: string) => RecalculateCampaignSettlementFifo(campaignId),
    onSuccess: (_data, campaignId) => {
      toast.success('Alokasi reward berhasil dihitung ulang.');
      queryClient.invalidateQueries({
        queryKey: ['admin-campaign-settlement', campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTLEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghitung ulang alokasi reward FIFO.');
    },
  });

  return mutation;
}

/**
 * Mutation hook to finalize campaign settlement: distributes verified creator rewards,
 * refunds unspent escrow to the brand, and transitions the campaign to FINISHED.
 *
 * @returns TanStack Mutation object for finalizing campaign settlement.
 */
export function UseFinalizeCampaignSettlementMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (campaignId: string) => FinalizeCampaignSettlement(campaignId),
    onSuccess: (_data, campaignId) => {
      toast.success(
        'Settlement kampanye selesai! Reward kreator dan sisa budget brand telah didistribusikan.',
      );
      queryClient.invalidateQueries({
        queryKey: ['admin-campaign-settlement', campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTLEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: ['campaign', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaign-submissions', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaigns'],
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyelesaikan settlement kampanye.');
    },
  });

  return mutation;
}

/**
 * Queries the paginated list of campaigns for admin moderation review (`GET /admin/campaigns`).
 *
 * @param params - Filter, search, page, and limit query parameters.
 * @returns TanStack Query result containing campaign moderation cards and tab counts.
 */
export function UseAdminModerationCampaignsQuery(params?: AdminModerationQueryParams) {
  const queryResult = useQuery({
    queryKey: [...ADMIN_MODERATION_CAMPAIGNS_QUERY_KEY, params],
    queryFn: () => GetAdminModerationCampaigns(params),
    staleTime: 1000 * 15,
  });

  return queryResult;
}

/**
 * Mutation hook to submit an administrative campaign moderation decision (APPROVE, REVISION, REJECT_PAYMENT, REJECT_CAMPAIGN).
 *
 * @param campaignId - Target campaign UUID.
 * @param options - Optional callbacks including onSuccess.
 * @returns TanStack Mutation object.
 */
export function UseModerateCampaignMutation(
  campaignId?: string,
  options?: { onSuccess?: () => void },
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: AdminModerateCampaignPayload) => {
      const targetId = campaignId;
      if (!targetId) {
        throw new Error('ID Kampanye diperlukan');
      }
      return ModerateCampaign(targetId, payload);
    },
    onSuccess: (_data, variables) => {
      if (variables.action === 'APPROVE') {
        toast.success('Kampanye berhasil disetujui dan ditayangkan ke kreator!');
      } else if (variables.action === 'REVISION') {
        toast.success('Permintaan revisi berhasil dikirim ke brand.');
      } else if (variables.action === 'REJECT_PAYMENT') {
        toast.success('Bukti transfer ditolak. Kampanye dikembalikan ke status menunggu pembayaran.');
      } else if (variables.action === 'REJECT_CAMPAIGN') {
        toast.success('Kampanye ditolak permanen.');
      }

      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
        queryClient.invalidateQueries({ queryKey: ['campaign-submissions', campaignId] });
      }
      queryClient.invalidateQueries({ queryKey: ADMIN_MODERATION_CAMPAIGNS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['brand-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memproses keputusan moderasi kampanye.');
    },
  });

  return mutation;
}

/**
 * Mutation hook to toggle and configure featured promotion status on a campaign.
 * Invalidates ['admin-moderation-campaigns'] and ['featured-campaigns'] query keys.
 *
 * @param campaignId - Target campaign UUID.
 * @param options - Optional callbacks including onSuccess.
 * @returns TanStack Mutation object.
 */
export function UseToggleCampaignFeaturedMutation(
  campaignId?: string,
  options?: { onSuccess?: () => void },
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ToggleCampaignFeaturedPayload) => {
      const targetId = campaignId;
      if (!targetId) {
        throw new Error('ID Kampanye diperlukan');
      }
      return ToggleCampaignFeatured(targetId, payload);
    },
    onSuccess: (data) => {
      if (data.isFeatured) {
        toast.success(
          `Kampanye berhasil disematkan ke Carousel Featured (#${data.featuredOrder ?? 1}).`,
        );
      } else {
        toast.success('Kampanye berhasil dihapus dari Carousel Featured.');
      }

      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      }
      queryClient.invalidateQueries({ queryKey: ADMIN_MODERATION_CAMPAIGNS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'featured'] });
      queryClient.invalidateQueries({ queryKey: ['featured-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['brand-campaigns'] });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui status featured kampanye.');
    },
  });

  return mutation;
}

/**
 * Queries the paginated list of manual brand top-ups (`GET /admin/top-ups`).
 *
 * @param params - Filter, search, page, and limit query parameters.
 * @returns TanStack Query result containing top-up items, counts, and pagination metadata.
 */
export function UseAdminTopUpsQuery(params?: GetAdminTopUpsParams) {
  const queryResult = useQuery({
    queryKey: [...ADMIN_TOPUPS_QUERY_KEY, params],
    queryFn: () => GetAdminTopUps(params),
    staleTime: 1000 * 10,
  });

  return queryResult;
}

/**
 * Mutation hook to review a manual brand top-up request (APPROVE or REJECT).
 *
 * @param options - Optional callbacks including onSuccess.
 * @returns TanStack Mutation object.
 */
export function UseReviewBrandTopUpMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ReviewBrandTopUpPayload) => ReviewBrandTopUp(payload),
    onSuccess: (_data, variables) => {
      if (variables.decision === 'APPROVE') {
        toast.success('Permintaan top-up berhasil disetujui. Saldo brand telah ditambahkan.');
      } else {
        toast.success('Permintaan top-up berhasil ditolak.');
      }

      queryClient.invalidateQueries({ queryKey: ADMIN_TOPUPS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['brand-wallet'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memproses verifikasi top up.');
    },
  });

  return mutation;
}

/**
 * Queries the paginated list of creator and brand withdrawal requests (`GET /admin/withdrawals`).
 *
 * @param params - Filter, role, search, page, and limit query parameters.
 * @returns TanStack Query result containing withdrawal items, counts, and pagination metadata.
 */
export function UseAdminWithdrawalsQuery(params?: GetAdminWithdrawalsParams) {
  const queryResult = useQuery({
    queryKey: [...ADMIN_WITHDRAWALS_QUERY_KEY, params],
    queryFn: () => GetAdminWithdrawals(params),
    staleTime: 1000 * 10,
  });

  return queryResult;
}

/**
 * Mutation hook to review a withdrawal request (APPROVE or REJECT).
 *
 * @param options - Optional callbacks including onSuccess.
 * @returns TanStack Mutation object.
 */
export function UseReviewAdminWithdrawalMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ReviewAdminWithdrawalPayload) => ReviewAdminWithdrawal(payload),
    onSuccess: (_data, variables) => {
      if (variables.decision === 'APPROVE') {
        toast.success('Penarikan saldo berhasil disetujui. Bukti transfer telah dicatat.');
      } else {
        toast.success('Penarikan saldo ditolak dan saldo berhasil dikembalikan ke akun pemohon.');
      }

      queryClient.invalidateQueries({ queryKey: ADMIN_WITHDRAWALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['creator-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['brand-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['creator-active-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['brand-active-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memproses review penarikan saldo.');
    },
  });

  return mutation;
}

/**
 * Queries the paginated list of creator and brand payout account KYC submissions (`GET /admin/kyc`).
 *
 * @param params - Filter, role, search, page, and limit query parameters.
 * @returns TanStack Query result containing KYC items, status counts, and pagination metadata.
 */
export function UseAdminKycQuery(params?: GetAdminKycParams) {
  const queryResult = useQuery({
    queryKey: [...ADMIN_KYC_QUERY_KEY, params],
    queryFn: () => GetAdminKycList(params),
    staleTime: 1000 * 10,
  });

  return queryResult;
}

/**
 * Mutation hook to review a creator or brand payout account KYC submission (APPROVE or REJECT).
 * Invalidates admin KYC queue as well as creator and brand payout account caches.
 *
 * @param options - Optional callbacks including onSuccess.
 * @returns TanStack Mutation object.
 */
export function UseReviewAdminKycMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ReviewKycPayload) => ReviewAdminKyc(payload),
    onSuccess: (_data, variables) => {
      if (variables.decision === 'APPROVE') {
        toast.success(
          'Rekening KYC berhasil diverifikasi dan siap digunakan untuk penarikan saldo.',
        );
      } else {
        toast.success('Pengajuan rekening KYC berhasil ditolak.');
      }

      queryClient.invalidateQueries({ queryKey: ADMIN_KYC_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['creator-payout-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['brand-payout-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['brand', 'payout-accounts'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_WITHDRAWALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memproses verifikasi rekening KYC.');
      queryClient.invalidateQueries({ queryKey: ADMIN_KYC_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });
    },
  });

  return mutation;
}

/**
 * Mutation hook to trigger an on-demand TikTok views and FIFO reward recalculation sync.
 *
 * @param options - Optional callbacks including onSuccess.
 * @returns TanStack Mutation object.
 */
export function UseTriggerCampaignMetricsSyncMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (campaignId?: string) => TriggerCampaignMetricsSync(campaignId),
    onSuccess: (data, campaignId) => {
      const updatedCount = data.run.submissionsUpdated;
      const scrapedCount = data.run.submissionsScraped;
      toast.success(
        `Sinkronisasi selesai: ${scrapedCount} video diperiksa, ${updatedCount} tayangan diperbarui.`,
      );

      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: ['admin-campaign-settlement', campaignId],
        });
        queryClient.invalidateQueries({
          queryKey: ['campaign-submissions', campaignId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTLEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyinkronkan tayangan video.');
    },
  });

  return mutation;
}




