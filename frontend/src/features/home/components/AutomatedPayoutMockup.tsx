import { motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { AUTOMATED_PAYOUT_CAMPAIGN_ROWS } from '../constants/home.constants';
import type { AutomatedPayoutMockupProps } from '../types';

/**
 * Interactive Micro-UI simulating real-time campaign progress and automated payout calculations.
 * Features a floating card with 3 campaign rows, animated progress bars expanding on whileInView
 * to 46%, 66%, and 54%, and an animated SVG cursor hovering near the bars.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Micro-UI stage.
 */
export function AutomatedPayoutMockup({ className = '' }: AutomatedPayoutMockupProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-2.5 sm:p-3 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -bottom-10 right-0 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl"
        aria-hidden="true"
      />

      {/* Floating Card */}
      <div className="relative z-10 w-full max-w-[275px] rounded-2xl border border-white/10 bg-zinc-900/90 p-3 sm:p-3.5 shadow-2xl backdrop-blur-md">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/5 text-[11px] whitespace-nowrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-white truncate">Akumulasi Saldo</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-medium shrink-0">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Terhitung
          </span>
        </div>

        {/* 3 Campaign Rows with Progress Bars */}
        <div className="space-y-2.5">
          {AUTOMATED_PAYOUT_CAMPAIGN_ROWS.map((row) => (
            <div key={row.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-medium text-zinc-300 truncate min-w-0">
                  {row.title}
                </span>
                <span className="font-mono font-semibold text-emerald-400 whitespace-nowrap tabular-nums shrink-0">
                  {row.payout}
                </span>
              </div>

              {/* Progress Track & Fill */}
              <div className="relative h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  whileInView={{ width: `${row.progress}%` }}
                  viewport={{ once: false }}
                  transition={{
                    duration: 1.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: row.delay,
                  }}
                  className={`h-full rounded-full bg-gradient-to-r ${row.gradient}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Summary Strip */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] whitespace-nowrap">
          <span className="text-zinc-400">Total Cair:</span>
          <span className="font-heading font-bold text-white text-xs flex items-center gap-0.5 tabular-nums">
            Rp 996.000
            <ArrowUpRight className="size-3 text-emerald-400" />
          </span>
        </div>
      </div>

      {/* Animated SVG Cursor Hovering Near Progress Bars */}
      <motion.svg
        animate={{
          x: [25, 45, 10, -20, 25],
          y: [-15, 20, 5, -30, -15],
          scale: [1, 0.92, 1, 0.95, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute z-20 size-5 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="black"
        strokeWidth="1.5"
      >
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
      </motion.svg>
    </div>
  );
}
