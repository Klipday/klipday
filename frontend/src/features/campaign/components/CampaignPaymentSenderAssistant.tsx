import { SUPPORTED_BANKS, SUPPORTED_EWALLETS } from '@/features/brand/constants';
import { cn } from '@/lib/utils';
import type { CampaignPaymentSenderAssistantProps } from '../types';

/**
 * Smart assistant component for Step 6 manual payment transfer.
 * Provides quick-select buttons from the brand's registered KYC payout accounts
 * to auto-fill sender provider and account holder details while keeping fields editable.
 *
 * @param props - Registered payout accounts, currently selected values, select handler, and state.
 * @returns Rendered quick-fill assistant element or null if no accounts exist.
 */
export function CampaignPaymentSenderAssistant({
  accounts,
  selectedProvider,
  selectedAccountName,
  onSelectAccount,
  disabled = false,
  className,
}: CampaignPaymentSenderAssistantProps) {
  if (accounts.length === 0) {
    return null;
  }

  const allProviders = [...SUPPORTED_BANKS, ...SUPPORTED_EWALLETS];

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4 space-y-2.5',
        className,
      )}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Asisten Pengisian Cepat
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            • Rekening KYC
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Klik akun terdaftar untuk mengisi data pengirim otomatis
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-0.5">
        {accounts.map((acc) => {
          const providerDef = allProviders.find(
            (p) => p.code.toUpperCase() === acc.provider.toUpperCase(),
          );
          const isProviderMatched =
            Boolean(selectedProvider) &&
            (selectedProvider.toUpperCase() === acc.provider.toUpperCase() ||
              (providerDef && providerDef.name.toUpperCase() === selectedProvider.toUpperCase()));

          const isAccountMatched =
            Boolean(selectedAccountName) &&
            selectedAccountName.trim().toLowerCase() === acc.accountHolderName.trim().toLowerCase();

          const isMatched = isProviderMatched && isAccountMatched;

          const maskedAccount = acc.accountNumber.length > 4
            ? `••••${acc.accountNumber.slice(-4)}`
            : acc.accountNumber;

          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => onSelectAccount(acc)}
              disabled={disabled}
              className={cn(
                'group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors cursor-pointer text-left',
                isMatched
                  ? 'border-primary/60 bg-primary/10 text-foreground ring-1 ring-primary/30 font-medium'
                  : 'border-border/60 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground',
                disabled && 'opacity-50 cursor-not-allowed',
              )}>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground uppercase">{acc.provider}</span>
                <span className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                  {maskedAccount}
                </span>
              </div>
              <span className="text-muted-foreground/50">•</span>
              <span className="truncate max-w-[130px] sm:max-w-[180px]" title={acc.accountHolderName}>
                {acc.accountHolderName}
              </span>
              {acc.isPrimary ? (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Utama
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
