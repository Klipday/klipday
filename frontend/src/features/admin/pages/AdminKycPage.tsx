/**
 * Admin KYC verification queue page orchestrator (`/admin-dashboard/kyc`).
 * Serves as the placeholder canvas for verifying user identity documents and payout accounts.
 *
 * @returns The rendered Admin KYC page.
 */
export default function AdminKycPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Verifikasi Identitas & Rekening (KYC)
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Tinjau dan verifikasi kesesuaian dokumen rekening bank dan akun e-wallet pengguna platform.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-2">
        <p className="text-sm font-medium text-foreground">Antrean Verifikasi Dokumen KYC</p>
        <p className="text-xs text-muted-foreground">
          Modul verifikasi kepatuhan KYC pengguna sedang dalam tahap persiapan.
        </p>
      </div>
    </div>
  );
}
