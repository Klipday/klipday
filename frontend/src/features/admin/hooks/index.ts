import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DisqualifySettlementSubmission,
  FinalizeCampaignSettlement,
  GetAdminCampaignSettlementSummary,
  GetAdminModerationCampaigns,
  GetAdminSettlementCampaigns,
  GetAdminTopUps,
  ModerateCampaign,
  RecalculateCampaignSettlementFifo,
  ReviewBrandTopUp,
  UpdateSettlementSubmissionViews,
} from '../api';
import type {
  AdminModerateCampaignPayload,
  AdminModerationQueryParams,
  AdminSettlementQueryParams,
  DisqualifySettlementSubmissionPayload,
  GetAdminTopUpsParams,
  ReviewBrandTopUpPayload,
  UpdateSettlementSubmissionViewsPayload,
} from '../types';

export const ADMIN_SETTLEMENTS_QUERY_KEY = ['admin-settlements'] as const;
export const ADMIN_MODERATION_CAMPAIGNS_QUERY_KEY = ['admin-moderation-campaigns'] as const;
export const ADMIN_TOPUPS_QUERY_KEY = ['admin-top-ups'] as const;

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

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memproses keputusan moderasi kampanye.');
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

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memproses verifikasi top up.');
    },
  });

  return mutation;
}

