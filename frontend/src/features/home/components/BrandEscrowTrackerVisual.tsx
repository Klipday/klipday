import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@solar-icons/react/linear';
import { BRAND_ESCROW_CLIP_ROWS } from '../constants/home.constants';
import type { BrandEscrowTrackerVisualProps } from '../types';

/**
 * Interactive Micro-UI simulating live campaign performance and pay-per-views deduction.
 * Displays campaign budget progress, real clip thumbnail rows with valid view counts,
 * and remaining refundable balance in neutral sans-serif tabular numerals.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Brand Escrow Tracker Micro-UI.
 */
export function BrandEscrowTrackerVisual({ className = '' }: BrandEscrowTrackerVisualProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -bottom-10 right-0 w-44 h-44 rounded-full bg-rose-500/10 blur-2xl"
        aria-hidden="true"
      />

      {/* Main Performance & Escrow Card */}
      <div className="relative z-10 w-full max-w-[278px] rounded-2xl bg-zinc-900/95 border border-white/10 p-3 sm:p-3.5 shadow-2xl backdrop-blur-md space-y-2.5 text-left">
        {/* Header: Escrow Budget */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheckIcon className="size-3.5 text-rose-400 shrink-0" />
              <span className="text-[11px] font-medium text-zinc-300 truncate">
                Saldo Campaign
              </span>
            </div>
            <span className="text-xs font-semibold text-white tabular-nums whitespace-nowrap">
              Rp 10.000.000
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '29%' }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400"
            />
          </div>
        </div>

        {/* Middle: Real Clip Thumbnail Performance Rows */}
        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {BRAND_ESCROW_CLIP_ROWS.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-2.5 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={row.thumbnailSrc}
                  alt={row.thumbnailAlt}
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="size-7 rounded-lg object-cover object-center border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <span className="block truncate text-[11px] font-medium text-zinc-200">
                    {row.handle}
                  </span>
                  <span className="block text-[9px] text-zinc-400 tabular-nums">
                    {row.views}
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-semibold text-emerald-400 tabular-nums whitespace-nowrap shrink-0">
                {row.cost}
              </span>
            </div>
          ))}
        </div>

        {/* Footer: Refundable Remainder */}
        <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between gap-2 text-[11px] whitespace-nowrap">
          <span className="text-zinc-400">Sisa saldo kembali</span>
          <span className="font-semibold text-white tabular-nums">
            Rp 7.120.000
          </span>
        </div>
      </div>
    </div>
  );
}
