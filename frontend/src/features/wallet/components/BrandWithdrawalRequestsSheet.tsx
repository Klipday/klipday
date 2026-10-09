import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { BrandWithdrawalRequestsSheetProps } from '../types';
import { BrandWithdrawalRequestItemRow } from './BrandWithdrawalRequestItemRow';

/**
 * Slide-out drawer (Sheet) from the right edge displaying all active withdrawal requests
 * for the authenticated brand awaiting admin verification and disbursement.
 * Mirrors the top-up requests sheet drawer UX.
 *
 * @param props - Component properties.
 * @returns Rendered withdrawal requests sheet drawer element.
 */
export function BrandWithdrawalRequestsSheet({
  isOpen,
  onOpenChange,
  activeWithdrawals,
  className,
}: BrandWithdrawalRequestsSheetProps) {
  const count = activeWithdrawals.length;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn('flex flex-col gap-0 p-0 sm:max-w-md', className)}>
        <SheetHeader className="border-b border-border/40 p-5">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base font-semibold">
              Permintaan Penarikan Berjalan
            </SheetTitle>
            {count > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {count}
              </span>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Pantau verifikasi dan proses transfer penarikan saldo ke rekening atau e-wallet Anda.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                Tidak ada permintaan penarikan aktif
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Semua permintaan penarikan sebelumnya telah diproses atau dibatalkan.
              </p>
            </div>
          ) : (
            activeWithdrawals.map((withdrawal) => (
              <BrandWithdrawalRequestItemRow
                key={withdrawal.id}
                withdrawal={withdrawal}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
