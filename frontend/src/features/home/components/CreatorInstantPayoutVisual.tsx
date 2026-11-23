import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@solar-icons/react/linear';
import type { CreatorInstantPayoutVisualProps } from '../types';

/**
 * Minimalist interactive visualization showing Klipday wallet balance readiness
 * flowing smoothly into generic bank transfer and e-wallet payout channels.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Creator Instant Payout Framer Motion visual stage.
 */
export function CreatorInstantPayoutVisual({ className = '' }: CreatorInstantPayoutVisualProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-3 sm:p-4 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Subtle Ambient Glow */}
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full bg-emerald-500/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-[380px] flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-2">
        {/* Source Wallet Card */}
        <div className="flex-1 rounded-xl border border-white/10 bg-zinc-900/95 p-3 shadow-xl space-y-2.5">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-medium text-zinc-400">
              Dompet Klipday
            </span>
            <span className="block text-[10px] text-zinc-500">
              Saldo Siap Tarik
            </span>
          </div>

          <div className="text-base sm:text-lg font-bold tracking-tight text-white tabular-nums whitespace-nowrap">
            Rp 50.000+
          </div>

          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                initial={{ width: '18%' }}
                animate={{ width: ['18%', '100%', '100%'] }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  times: [0, 0.55, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-400"
              />
            </div>
            <span className="block text-[9px] text-zinc-500 tabular-nums">
              Minimal penarikan terpenuhi
            </span>
          </div>
        </div>

        {/* Center Animated Transfer Track */}
        <div className="hidden sm:flex relative w-10 shrink-0 items-center justify-center" aria-hidden="true">
          <div className="h-px w-full bg-white/15" />
          <motion.div
            animate={{
              x: [-18, 18],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute h-1 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          />
        </div>

        {/* Destination Multi-Channel Card */}
        <div className="flex-1 rounded-xl border border-white/10 bg-zinc-900/95 p-3 shadow-xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-zinc-300">
              Tujuan Pencairan
            </span>
            <div className="relative h-4 w-16 flex items-center justify-end">
              <motion.span
                animate={{ opacity: [1, 1, 0, 0, 1] }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  times: [0, 0.48, 0.54, 0.94, 1],
                }}
                className="absolute right-0 text-[10px] font-medium text-zinc-400 whitespace-nowrap"
              >
                Siap ditarik
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  times: [0, 0.48, 0.54, 0.94, 1],
                }}
                className="absolute right-0 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 whitespace-nowrap"
              >
                <CheckCircleIcon className="size-3 shrink-0" />
                <span>Terkirim</span>
              </motion.span>
            </div>
          </div>

          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            <div className="flex items-center justify-between py-1.5 text-[11px]">
              <span className="font-medium text-zinc-200">Transfer Bank</span>
              <span className="text-[10px] text-zinc-400">Langsung cair</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 text-[11px]">
              <span className="font-medium text-zinc-200">E-Wallet</span>
              <span className="text-[10px] text-zinc-400">Bebas antre</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
