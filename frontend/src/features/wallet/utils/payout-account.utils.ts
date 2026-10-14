import type { PayoutAccountFormValues } from '../schemas/payout-account.schemas';
import type { CreateCreatorPayoutAccountPayload } from '../types';

/**
 * Generates the canonical initial form values for the unified payout account dialog.
 * Defaults isPrimary to true ONLY when existingAccountsCount is strictly 0.
 *
 * @param existingAccountsCount - Number of currently registered payout accounts.
 * @returns Initial form values satisfying PayoutAccountFormSchema.
 */
export function GetDefaultPayoutAccountFormValues(
  existingAccountsCount?: number,
): PayoutAccountFormValues {
  const isFirstAccount = existingAccountsCount === 0;

  const defaultValues: PayoutAccountFormValues = {
    accountType: 'BANK_TRANSFER',
    provider: 'BCA',
    accountNumber: '',
    accountHolderName: '',
    proofUrl: '',
    isPrimary: isFirstAccount,
  };

  return defaultValues;
}

/**
 * Returns the canonical default provider code for a given payout account type.
 *
 * @param accountType - Either 'BANK_TRANSFER' or 'E_WALLET'.
 * @returns Default provider code ('BCA' for bank, 'GOPAY' for e-wallet).
 */
export function GetAccountTypeDefaultProvider(
  accountType: 'BANK_TRANSFER' | 'E_WALLET',
): string {
  const defaultProvider = accountType === 'BANK_TRANSFER' ? 'BCA' : 'GOPAY';
  return defaultProvider;
}

/**
 * Transforms validated form values into a clean, sanitized API payload.
 *
 * @param values - Validated form values from react-hook-form.
 * @returns Sanitized payout account payload ready for submission.
 */
export function BuildCreatePayoutAccountPayload(
  values: PayoutAccountFormValues,
): CreateCreatorPayoutAccountPayload {
  const payload: CreateCreatorPayoutAccountPayload = {
    accountType: values.accountType,
    provider: values.provider,
    accountNumber: values.accountNumber.trim(),
    accountHolderName: values.accountHolderName.trim(),
    proofUrl: values.proofUrl,
    isPrimary: values.isPrimary,
  };

  return payload;
}

/**
 * Safely revokes a local object URL to prevent memory leaks in the browser.
 *
 * @param url - Object URL to revoke if it starts with blob:.
 */
export function RevokeObjectUrl(url?: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Resolves the effective user role ('BRAND' | 'CREATOR') deterministically.
 * Prioritizes explicit component prop, then authenticated session role, then current route path.
 *
 * @param roleProp - Optional role explicitly passed via component props.
 * @param sessionRole - Role string from the active authenticated account profile.
 * @param pathname - Current browser route path.
 * @returns Deterministic role ('BRAND' or 'CREATOR').
 */
export function ResolveEffectiveRole(
  roleProp?: 'BRAND' | 'CREATOR',
  sessionRole?: string,
  pathname?: string,
): 'BRAND' | 'CREATOR' {
  if (roleProp) {
    return roleProp;
  }

  if (sessionRole === 'CREATOR') {
    return 'CREATOR';
  }

  if (sessionRole === 'BRAND') {
    return 'BRAND';
  }

  if (pathname && (pathname.includes('/creator') || pathname.includes('creator-dashboard'))) {
    return 'CREATOR';
  }

  return 'BRAND';
}
