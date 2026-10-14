import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SUPPORTED_BANKS, SUPPORTED_EWALLETS } from '../constants';
import type { BrandBankComboboxProps } from '../types';

/**
 * Dropdown select component for choosing Indonesian bank or e-wallet providers.
 * Styled with neutral input background (bg-input/50) matching surrounding form fields,
 * completely free of internal search bars and fast recommendation chip clutter.
 *
 * @param props - Selected value, change handler, account type, disabled state, and optional className.
 * @returns Rendered bank or e-wallet dropdown select element.
 */
export function BrandBankCombobox({
  accountType,
  value,
  onChange,
  disabled = false,
  className,
  hasError = false,
}: BrandBankComboboxProps) {
  const isBank = accountType === 'BANK_TRANSFER';
  const providerList = isBank ? SUPPORTED_BANKS : SUPPORTED_EWALLETS;

  const matchedProvider = providerList.find(
    (item) => item.code.toUpperCase() === value?.toUpperCase(),
  );
  const effectiveValue = matchedProvider?.code;

  return (
    <Select
      value={effectiveValue || undefined}
      onValueChange={onChange}
      disabled={disabled}>
      <SelectTrigger
        aria-invalid={hasError}
        className={cn(
          'h-10 w-full rounded-xl text-xs cursor-pointer hover:bg-input/70 transition-colors',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className,
        )}>
        <SelectValue placeholder={isBank ? 'Pilih Bank Tujuan' : 'Pilih E-Wallet Tujuan'} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="w-[var(--radix-select-trigger-width)] max-h-60 rounded-xl border border-border/60 shadow-lg">
        {providerList.map((item) => (
          <SelectItem key={item.code} value={item.code} className="text-xs cursor-pointer">
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
