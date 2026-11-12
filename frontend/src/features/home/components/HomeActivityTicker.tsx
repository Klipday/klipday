import { HOME_PAYOUT_TICKER_ITEMS } from '../constants/home.constants';
import type { HomeActivityTickerProps } from '../types';

/**
 * Modern minimalist live platform payout ticker.
 * Displays a continuous, clean horizontal marquee of verified clipper payouts
 * without decorative icons or visual clutter, highlighting variative real clipper usernames.
 *
 * @param props - Component properties.
 * @returns The rendered live payout ticker component.
 */
export function HomeActivityTicker({ className = '' }: HomeActivityTickerProps) {
  // Duplicate list to guarantee seamless -50% CSS infinite marquee looping
  const duplicatedItems = [...HOME_PAYOUT_TICKER_ITEMS, ...HOME_PAYOUT_TICKER_ITEMS];

  const rootClasses = `w-full max-w-full border-y border-white/[0.06] bg-zinc-950/70 backdrop-blur-md py-2.5 overflow-hidden select-none ${className}`.trim();

  return (
    <div className={rootClasses} aria-label="Riwayat Pencairan Saldo Clipper Terkini">
      <div className="relative flex w-full max-w-full items-center overflow-hidden">
        {/* Subtle left & right gradient masks */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 sm:w-24 bg-gradient-to-r from-[#09090b] to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 sm:w-24 bg-gradient-to-l from-[#09090b] to-transparent"
          aria-hidden="true"
        />

        <div className="animate-marquee flex items-center gap-8 sm:gap-10">
          {duplicatedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-2 shrink-0 text-xs text-zinc-400"
            >
              <span className="font-semibold text-white">{item.username}</span>
              <span>mencairkan</span>
              <span className="font-mono font-semibold text-emerald-400">{item.amount}</span>
              <span>ke {item.channel}</span>
              <span className="text-[10px] text-zinc-400 font-mono">({item.timeAgo})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
