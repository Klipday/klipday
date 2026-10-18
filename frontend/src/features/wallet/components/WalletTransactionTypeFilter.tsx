import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { WALLET_TRANSACTION_TABS } from '../constants';
import type { WalletTransactionType, WalletTransactionTypeFilterProps } from '../types';

/**
 * Shared filter select dropdown component for wallet transaction types across Brand and Creator.
 * Styled with neutral tones and consistent with platform campaign filter design.
 *
 * @param props - Component configuration properties.
 * @returns The rendered select filter element.
 */
export function WalletTransactionTypeFilter({
  activeType,
  onTypeChange,
  options = WALLET_TRANSACTION_TABS,
  className,
}: WalletTransactionTypeFilterProps) {
  const triggerClassName = cn(
    'h-9 w-full sm:w-auto min-w-[160px] rounded-xl border border-border/60 bg-card hover:bg-muted/30 text-foreground text-xs font-medium shadow-none sm:shadow-xs transition-colors focus-visible:border-border focus-visible:ring-0 cursor-pointer',
    className,
  );

  /**
   * Forwards the selected transaction type to the parent filter handler.
   *
   * @param nextValue - Selected option key.
   */
  const HandleValueChange = (nextValue: string) => {
    onTypeChange(nextValue as WalletTransactionType);
  };

  return (
    <Select value={activeType} onValueChange={HandleValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="Semua Transaksi" />
      </SelectTrigger>
      <SelectContent
        align="end"
        className="rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-lg">
        {options.map((tab) => (
          <SelectItem
            key={tab.key}
            value={tab.key}
            className="text-xs text-foreground focus:bg-muted/60 focus:text-foreground cursor-pointer py-2">
            {tab.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
