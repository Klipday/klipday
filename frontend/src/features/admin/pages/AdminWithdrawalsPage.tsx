/**
 * Admin Withdrawals review queue page orchestrator (`/admin-dashboard/withdrawals`).
 * Serves as the placeholder canvas for verifying creator and brand payout withdrawal requests.
 *
 * @returns The rendered Admin Withdrawals page.
 */
export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Verifikasi Penarikan Saldo (Withdraw)
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Tinjau dan verifikasi pencairan dana saldo aktif kreator dan brand ke rekening bank atau e-wallet tujuan.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-2">
        <p className="text-sm font-medium text-foreground">Antrean Penarikan Saldo</p>
        <p className="text-xs text-muted-foreground">
          Modul verifikasi dan disbursement penarikan saldo sedang dalam tahap persiapan.
        </p>
      </div>
    </div>
  );
}
