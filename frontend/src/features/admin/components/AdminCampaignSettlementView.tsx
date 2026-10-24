import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  UseAdminCampaignSettlementSummaryQuery,
  UseDisqualifySettlementSubmissionMutation,
  UseFinalizeCampaignSettlementMutation,
} from '../hooks';
import type {
  AdminCampaignSettlementViewProps,
  AdminFifoSubmissionItemDto,
} from '../types';
import {
  FormatCompactViews,
  FormatRupiah,
  GetFreezeReasonLabel,
} from '../utils/formatters';
import { AdminDisqualifySubmissionDialog } from './AdminDisqualifySubmissionDialog';
import { AdminFifoSubmissionRow } from './AdminFifoSubmissionRow';
import { AdminFinalizeSettlementDialog } from './AdminFinalizeSettlementDialog';

/**
 * Admin FIFO Settlement & Disqualification Reshuffle panel rendered on Campaign Detail
 * (`/campaigns/:id?tab=admin-submissions`).
 * Presents the 4-column hairline-divided Settlement Ledger Bar and the FIFO submission queue.
 *
 * @param props - Component props containing campaignId and optional className.
 * @returns The rendered admin campaign settlement panel.
 */
export function AdminCampaignSettlementView({
  campaignId,
  className,
}: AdminCampaignSettlementViewProps) {
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = UseAdminCampaignSettlementSummaryQuery(campaignId);

  const disqualifyMutation = UseDisqualifySettlementSubmissionMutation();
  const finalizeMutation = UseFinalizeCampaignSettlementMutation();

  const [targetDisqualifySub, setTargetDisqualifySub] =
    useState<AdminFifoSubmissionItemDto | null>(null);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  const HandleRequestDisqualify = (submission: AdminFifoSubmissionItemDto) => {
    setTargetDisqualifySub(submission);
  };

  const HandleConfirmDisqualify = (reviewNote: string) => {
    if (!targetDisqualifySub || !campaignId) {
      return;
    }

    disqualifyMutation.mutate(
      {
        submissionId: targetDisqualifySub.id,
        campaignId,
        reviewNote,
      },
      {
        onSuccess: () => {
          setTargetDisqualifySub(null);
        },
      },
    );
  };

  const HandleConfirmFinalize = () => {
    if (!campaignId) {
      return;
    }
    finalizeMutation.mutate(campaignId, {
      onSuccess: () => {
        setIsFinalizeDialogOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/50 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-card p-5 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/50">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="p-5 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-60" />
              </div>
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    const errorMsg =
      error instanceof Error ? error.message : 'Gagal memuat data settlement kampanye.';
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">{errorMsg}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-3 h-8 text-xs"
        >
          Muat Ulang
        </Button>
      </div>
    );
  }

  const isSettled = summary.campaignStatus === 'FINISHED';
  const activeCount = isSettled ? summary.verifiedCount : summary.approvedCount;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Flat Hairline-Divided 4-Column Settlement Ledger Bar */}
      <div className="grid grid-cols-1 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
        {/* Col 1: Total Anggaran Kampanye */}
        <div className="p-5">
          <p className="text-xs text-muted-foreground">Total Anggaran Kampanye</p>
          <p className="mt-1.5 font-mono text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {FormatRupiah(summary.budget)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            CPM {FormatRupiah(summary.cpm)} / 1K · Min.{' '}
            {FormatCompactViews(summary.minViews)} views
          </p>
        </div>

        {/* Col 2: Anggaran Terpakai (Reward Kreator) */}
        <div className="p-5">
          <p className="text-xs text-muted-foreground">
            Anggaran Terpakai (Reward Kreator)
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {FormatRupiah(summary.allocatedCreatorRewards)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Dari {activeCount} video yang {isSettled ? 'terverifikasi' : 'disetujui'}
          </p>
        </div>

        {/* Col 3: Budget Tersisa (Pengembalian ke Brand) */}
        <div className="p-5">
          <p className="text-xs text-muted-foreground">
            Budget Tersisa (Kembali ke Brand)
          </p>
          <p
            className={cn(
              'mt-1.5 font-mono text-xl font-semibold tracking-tight tabular-nums',
              summary.brandRefundAmount > 0 ? 'text-emerald-500' : 'text-foreground',
            )}
          >
            {FormatRupiah(summary.brandRefundAmount)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {isSettled
              ? `Telah dikembalikan ke saldo ${summary.brand.companyName}`
              : `Akan dikembalikan ke saldo ${summary.brand.companyName}`}
          </p>
        </div>

        {/* Col 4: Primary Action CTA */}
        <div className="flex flex-col justify-center bg-muted/15 p-5">
          {isSettled ? (
            <Button
              type="button"
              disabled
              variant="outline"
              className="h-10 w-full border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-500 opacity-100"
            >
              Settlement Telah Selesai
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!summary.canFinalize || finalizeMutation.isPending}
              onClick={() => setIsFinalizeDialogOpen(true)}
              className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
            >
              Setujui & Selesaikan Settlement
            </Button>
          )}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Status: {GetFreezeReasonLabel(summary.freezeReason)}
          </p>
        </div>
      </div>

      {/* Audit Adjustment Info Banner */}
      {summary.disqualifiedCount > 0 && !isSettled && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <span>
            <strong className="font-medium text-foreground">
              Penyesuaian Anggaran Otomatis:
            </strong>{' '}
            Terdapat {summary.disqualifiedCount} video yang didiskualifikasi. Alokasi
            reward otomatis dialihkan ke urutan kreator berikutnya dan sisa{' '}
            <span className="font-mono font-medium text-foreground">
              {FormatRupiah(summary.brandRefundAmount)}
            </span>{' '}
            akan dikembalikan ke saldo Brand.
          </span>
        </div>
      )}

      {/* Submissions Queue Section */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex flex-col gap-1 border-b border-border/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[13px] font-semibold tracking-tight text-foreground">
            Daftar Pengajuan Video
          </span>
          <span className="text-xs text-muted-foreground">
            Diurutkan berdasarkan waktu pengiriman video paling awal
          </span>
        </div>

        {summary.submissions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              Belum ada pengajuan video pada kampanye ini
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Seluruh anggaran kampanye ({FormatRupiah(summary.budget)}) akan dikembalikan ke
              saldo Brand saat settlement diselesaikan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {summary.submissions.map((sub) => (
              <AdminFifoSubmissionRow
                key={sub.id}
                submission={sub}
                isSettled={isSettled}
                isDisqualifying={disqualifyMutation.isPending}
                onRequestDisqualify={HandleRequestDisqualify}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <AdminDisqualifySubmissionDialog
        submission={targetDisqualifySub}
        open={Boolean(targetDisqualifySub)}
        isPending={disqualifyMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setTargetDisqualifySub(null);
          }
        }}
        onConfirm={HandleConfirmDisqualify}
      />

      <AdminFinalizeSettlementDialog
        summary={summary}
        open={isFinalizeDialogOpen}
        isPending={finalizeMutation.isPending}
        onOpenChange={setIsFinalizeDialogOpen}
        onConfirm={HandleConfirmFinalize}
      />
    </div>
  );
}
