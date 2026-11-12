import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import type { BrandEscrowTrackerVisualProps } from '../types';

/**
 * Interactive Micro-UI simulating Brand Pay-Per-Views deduction and Auto-Refund telemetry.
 * Displays live Rekber Klipday locked budget balance, single-line verified views deduction (-Rp 2.880.000),
 * bot/invalid traffic immunity (Rp 0 Gratis), and remaining saldo guarantee.
 * All rows strictly fit on a single horizontal line with whitespace-nowrap.
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

      {/* Floating Card (w-[288px]) */}
      <motion.div
        animate={{
          y: [-2, 2, -2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 w-full max-w-[288px] p-3 sm:p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5 shadow-2xl backdrop-blur-md text-left"
      >
        {/* Header: Dana Rekber & Locked Balance */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="size-3.5 text-rose-500 shrink-0" />
            <span className="text-[11px] text-zinc-400 whitespace-nowrap">
              Dana Rekber
            </span>
          </div>
          <span className="text-xs font-bold text-white font-mono tabular-nums whitespace-nowrap">
            Rp 10.000.000
          </span>
        </div>

        {/* 2 Clean Single-Line Metric Rows: Verified Deduction vs Bot Immunity */}
        <div className="space-y-1.5">
          {/* Row 1 (Verified): 240K Views Valid */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <span className="text-[11px] text-zinc-200 whitespace-nowrap font-medium flex items-center gap-1">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>240K Views Valid</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
              - Rp 2.880.000
            </span>
          </div>

          {/* Row 2 (Bot/Invalid): 12K Trafik Bot */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[11px] text-zinc-500 whitespace-nowrap flex items-center gap-1">
              <span className="text-zinc-500">✕</span>
              <span>12K Trafik Bot</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
              Rp 0 (Gratis)
            </span>
          </div>
        </div>

        {/* Row 3 (Footer Refund Box): Sisa Saldo Utuh */}
        <div className="bg-zinc-950/90 border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 whitespace-nowrap">
            Sisa Saldo Utuh
          </span>
          <span className="text-[11px] font-bold text-rose-400 font-mono tabular-nums whitespace-nowrap">
            Rp 7.120.000
          </span>
        </div>
      </motion.div>
    </div>
  );
}
