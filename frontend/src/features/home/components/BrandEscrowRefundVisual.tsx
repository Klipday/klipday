import { motion } from 'framer-motion';
import { CheckCircleIcon, ShieldCheckIcon } from '@solar-icons/react/linear';
import type { BrandEscrowRefundVisualProps } from '../types';

/**
 * Interactive Escrow & Budget Refund Framer Motion visualization for the Brand Benefits section.
 * Displays real-time campaign allocation vs refundable unused balance without pill clutter.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Brand Escrow Refund Framer Motion visual stage.
 */
export function BrandEscrowRefundVisual({ className = '' }: BrandEscrowRefundVisualProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-3 sm:p-4 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Subtle Ambient Glow */}
      <div
        className="pointer-events-none absolute -bottom-12 right-4 w-52 h-44 rounded-full bg-emerald-500/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[300px] rounded-2xl border border-white/10 bg-zinc-900/95 p-3.5 sm:p-4 shadow-2xl space-y-3">
        {/* Header: Escrow Title & Locked Balance */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheckIcon className="size-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-300 truncate">
              Rekening Bersama Klipday
            </span>
          </div>
          <span className="text-xs font-semibold text-white tabular-nums whitespace-nowrap">
            Rp 10.000.000
          </span>
        </div>

        {/* Animated Dual-Segment Allocation Bar */}
        <div className="relative h-2 w-full rounded-full bg-zinc-800/90 overflow-hidden flex">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '29%' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-rose-500"
          />
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '71%' }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative h-full bg-emerald-500/80 overflow-hidden"
          >
            <motion.div
              animate={{ x: ['-100%', '220%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>

        {/* 2-Column Clean Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <div className="space-y-0.5">
            <span className="block text-[10px] text-zinc-400 whitespace-nowrap">
              Terpakai (Views Valid)
            </span>
            <span className="block text-xs font-semibold text-white tabular-nums whitespace-nowrap">
              Rp 2.880.000
            </span>
          </div>

          <div className="space-y-0.5 text-right">
            <span className="block text-[10px] text-zinc-400 whitespace-nowrap">
              Sisa Budget
            </span>
            <span className="block text-xs font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
              Rp 7.120.000
            </span>
          </div>
        </div>

        {/* Footer Settlement Status */}
        <div className="border-t border-white/[0.07] pt-2.5 flex items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <motion.span
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="size-1.5 rounded-full bg-emerald-400 shrink-0"
            />
            <span className="text-zinc-400 truncate">
              Kembali ke dompet brand
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-400 whitespace-nowrap shrink-0">
            <CheckCircleIcon className="size-3 shrink-0" />
            <span>Otomatis</span>
          </span>
        </div>
      </div>
    </div>
  );
}
