import { motion } from 'framer-motion';
import type { CreatorCampaignCardVisualProps } from '../types';

/**
 * Interactive Micro-UI simulating Creator Marketplace Campaign Discovery Card.
 * Displays a central film clipping campaign card ("3726 MDPL" by Falcon Pictures),
 * a subtle stacked background card, real-time budget progress bar,
 * and an animated SVG cursor that glides in and clicks to inspect.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Creator Campaign Discovery Micro-UI.
 */
export function CreatorCampaignCardVisual({ className = '' }: CreatorCampaignCardVisualProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl"
        aria-hidden="true"
      />

      {/* Blurred Ghost Card in Background to imply list */}
      <div
        className="absolute w-[84%] max-w-[236px] h-48 rounded-2xl bg-zinc-950/80 border border-white/5 -top-1 opacity-40 scale-95 blur-[1px] transform -translate-y-2 pointer-events-none"
        aria-hidden="true"
      />

      {/* Sleek Central Card */}
      <motion.div
        animate={{
          scale: [1, 1, 0.97, 1.01, 1],
          borderColor: [
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(244, 63, 94, 0.6)',
            'rgba(244, 63, 94, 0.6)',
            'rgba(255, 255, 255, 0.1)',
          ],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          times: [0, 0.35, 0.48, 0.75, 1],
          ease: 'easeInOut',
        }}
        className="relative z-10 w-full max-w-[256px] rounded-2xl bg-zinc-900/90 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md"
      >
        {/* Top Banner with Oversized Typography & Badge */}
        <div className="h-16 relative bg-gradient-to-tr from-sky-900/80 via-zinc-800 to-amber-900/60 overflow-hidden flex items-center px-3.5">
          <span className="text-4xl font-black text-white/25 tracking-tighter select-none font-heading">
            3726
          </span>
          <div className="absolute top-0 right-0 bg-zinc-950/80 text-amber-400 text-[9px] px-2.5 py-0.5 rounded-bl-xl border-b border-l border-white/10 font-medium">
            Film Clipping
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3 space-y-2 text-left">
          {/* Row 1: Brand Avatar + Name & CLIPPING Pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="size-4 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 shrink-0 flex items-center justify-center text-[7px] font-bold text-black">
                F
              </div>
              <span className="text-[11px] text-zinc-200 font-medium truncate">
                Falcon Pictures
              </span>
            </div>
            <span className="border border-white/15 text-[8px] font-mono text-zinc-300 px-2 py-0.5 rounded-full shrink-0">
              CLIPPING
            </span>
          </div>

          {/* Row 2: Campaign Title & Payout Rate */}
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-xs font-bold text-white tracking-tight">
              3726 MDPL
            </span>
            <div className="text-right">
              <span className="text-sm font-extrabold text-white">
                Rp12.000
              </span>
              <span className="text-[10px] text-zinc-400 font-normal ml-0.5">
                / 1K Views
              </span>
            </div>
          </div>

          {/* Row 3: Social Icons + Category & Clipper Count */}
          <div className="flex items-center gap-1.5 text-[8px]">
            {/* TikTok Icon */}
            <svg className="size-3 fill-zinc-300 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.33V9.26a8.16 8.16 0 0 0 4.91 1.63V7.45a4.85 4.85 0 0 1-1-.76z" />
            </svg>
            {/* Instagram Icon */}
            <svg className="size-3 fill-zinc-300 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="bg-zinc-800 text-[8px] text-zinc-300 px-2 py-0.5 rounded-full">
              ENTERTAINMENT
            </span>
            <span className="bg-zinc-800/80 text-[8px] text-zinc-400 px-1.5 py-0.5 rounded-full font-mono">
              5.322 Clipper
            </span>
          </div>

          {/* Row 4 (Footer): Budget Progress */}
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">Budget Tersisa</span>
              <span className="font-bold text-white font-mono">82%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                whileInView={{ width: '82%' }}
                viewport={{ once: false }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Animated SVG Mouse Cursor */}
      <motion.svg
        animate={{
          x: [50, 0, 0, 0, 50],
          y: [40, 10, 10, 10, 40],
          scale: [1, 1, 0.88, 1, 1],
          opacity: [0, 1, 1, 1, 0],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          times: [0, 0.35, 0.48, 0.75, 1],
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
