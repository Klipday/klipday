import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SUPPORTED_BANKS, SUPPORTED_EWALLETS } from '../constants';
import type { BankComboboxProps } from '../types';

/**
 * Dropdown select component for choosing Indonesian bank or e-wallet providers.
 * Displays all 35 supported Indonesian banks and 5 e-wallets.
 * Resolves narrow or truncated dropdown triggers by enforcing full width (w-full).
 * Styled with neutral input background (bg-input/50) matching surrounding form fields.
 *
 * @param props - Selected value, change handler, account type, disabled state, placeholder, and optional className.
 * @returns Rendered bank or e-wallet dropdown select element.
 */
export function BankCombobox({
  id,
  accountType = 'ALL',
  value,
  onChange,
  disabled = false,
  className,
  hasError = false,
  placeholder,
}: BankComboboxProps) {
  const showBanks = accountType === 'BANK_TRANSFER' || accountType === 'ALL';
  const showEwallets = accountType === 'E_WALLET' || accountType === 'ALL';

  const providerList = [
    ...(showBanks ? SUPPORTED_BANKS : []),
    ...(showEwallets ? SUPPORTED_EWALLETS : []),
  ];

  const matchedProvider = providerList.find(
    (item) =>
      item.code.toUpperCase() === value?.toUpperCase() ||
      item.name.toUpperCase() === value?.toUpperCase(),
  );

  const isKnownOtherType =
    (accountType === 'BANK_TRANSFER' &&
      SUPPORTED_EWALLETS.some(
        (e) =>
          e.code.toUpperCase() === value?.toUpperCase() ||
          e.name.toUpperCase() === value?.toUpperCase(),
      )) ||
    (accountType === 'E_WALLET' &&
      SUPPORTED_BANKS.some(
        (b) =>
          b.code.toUpperCase() === value?.toUpperCase() ||
          b.name.toUpperCase() === value?.toUpperCase(),
      ));

  const effectiveValue = matchedProvider?.code ?? (value?.trim() && !isKnownOtherType ? value.trim() : undefined);

  const defaultPlaceholder =
    accountType === 'BANK_TRANSFER'
      ? 'Pilih Bank Tujuan'
      : accountType === 'E_WALLET'
        ? 'Pilih E-Wallet Tujuan'
        : 'Pilih Bank / E-Wallet';

  const effectivePlaceholder = placeholder || defaultPlaceholder;

  return (
    <Select
      value={effectiveValue}
      onValueChange={onChange}
      disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-invalid={hasError}
        className={cn(
          'h-10 w-full rounded-xl text-xs cursor-pointer hover:bg-input/70 transition-colors',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className,
        )}>
        <SelectValue placeholder={effectivePlaceholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="w-[var(--radix-select-trigger-width)] max-h-60 rounded-xl border border-border/60 shadow-lg">
        {accountType === 'ALL' ? (
          <>
            <SelectGroup>
              <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                Transfer Bank
              </SelectLabel>
              {SUPPORTED_BANKS.map((item) => (
                <SelectItem key={item.code} value={item.code} className="text-xs cursor-pointer">
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator className="my-1" />
            <SelectGroup>
              <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                E-Wallet
              </SelectLabel>
              {SUPPORTED_EWALLETS.map((item) => (
                <SelectItem key={item.code} value={item.code} className="text-xs cursor-pointer">
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        ) : (
          providerList.map((item) => (
            <SelectItem key={item.code} value={item.code} className="text-xs cursor-pointer">
              {item.name}
            </SelectItem>
          ))
        )}
        {value?.trim() && !matchedProvider && !isKnownOtherType && (
          <SelectItem value={value.trim()} className="text-xs cursor-pointer">
            {value.trim()}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
