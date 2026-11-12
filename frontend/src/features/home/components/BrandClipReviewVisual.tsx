import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { BrandClipReviewVisualProps } from '../types';

/**
 * Interactive Micro-UI simulating Brand Clip Approval and Review Queue.
 * Displays a submitted clipper video row with thumbnail, vertical stack of handle and duration,
 * fixed-width animated status pill (Review -> Approved ✓), timestamped hook feedback,
 * and an animated SVG cursor that clicks "Setujui Klip ✓".
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Brand Clip Review Micro-UI.
 */
export function BrandClipReviewVisual({ className = '' }: BrandClipReviewVisualProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Ambient background spotlight */}
      <div
        className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl"
        aria-hidden="true"
      />

      {/* Main Review Card */}
      <div className="relative z-10 w-full max-w-[280px] p-3 sm:p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5 shadow-2xl backdrop-blur-md text-left">
        {/* Top Header Row: Thumbnail + Vertical Stack on Left, Fixed-width Status Pill on Right */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Mini Play Button + Stack */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
              <Play className="size-3.5 fill-white text-white ml-0.5" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white whitespace-nowrap">
                @adit_clipper
              </span>
              <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                Klip #04 • 0:28
              </span>
            </div>
          </div>

          {/* Right: Fixed-width Status Pill (w-[92px] prevents any layout shift or overflow) */}
          <motion.div
            animate={{
              backgroundColor: [
                'rgba(245, 158, 11, 0.1)',
                'rgba(245, 158, 11, 0.1)',
                'rgba(16, 185, 129, 0.15)',
                'rgba(16, 185, 129, 0.15)',
                'rgba(245, 158, 11, 0.1)',
              ],
              color: [
                '#fbbf24',
                '#fbbf24',
                '#34d399',
                '#34d399',
                '#fbbf24',
              ],
              borderColor: [
                'rgba(245, 158, 11, 0.25)',
                'rgba(245, 158, 11, 0.25)',
                'rgba(16, 185, 129, 0.35)',
                'rgba(16, 185, 129, 0.35)',
                'rgba(245, 158, 11, 0.25)',
              ],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              times: [0, 0.4, 0.52, 0.8, 1],
              ease: 'easeInOut',
            }}
            className="w-[92px] text-center py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap shrink-0 border"
          >
            <motion.span
              animate={{
                opacity: [1, 1, 0, 0, 1],
                display: ['inline', 'inline', 'none', 'none', 'inline'],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                times: [0, 0.45, 0.48, 0.85, 1],
              }}
            >
              Review
            </motion.span>
            <motion.span
              animate={{
                opacity: [0, 0, 1, 1, 0],
                display: ['none', 'none', 'inline', 'inline', 'none'],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                times: [0, 0.45, 0.48, 0.85, 1],
              }}
            >
              Approved ✓
            </motion.span>
          </motion.div>
        </div>

        {/* Middle Row: Single-line Comment Box */}
        <div className="bg-zinc-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-300 flex items-center gap-1.5 overflow-hidden">
          <span className="font-mono text-rose-400 font-semibold shrink-0">
            0:03
          </span>
          <span className="whitespace-nowrap truncate text-zinc-300">
            Hook awal udah dapet, siap tayang.
          </span>
        </div>

        {/* Bottom Row: Actions */}
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <button
            type="button"
            tabIndex={-1}
            className="bg-zinc-800 text-zinc-400 text-[10px] px-2.5 py-1 rounded-lg hover:bg-zinc-700 transition-colors pointer-events-none whitespace-nowrap"
          >
            Minta Revisi
          </button>

          <motion.div
            animate={{
              scale: [1, 1, 0.94, 1.02, 1],
              backgroundColor: [
                'rgba(16, 185, 129, 0.1)',
                'rgba(16, 185, 129, 0.1)',
                'rgba(16, 185, 129, 0.28)',
                'rgba(16, 185, 129, 0.28)',
                'rgba(16, 185, 129, 0.1)',
              ],
              boxShadow: [
                'none',
                'none',
                '0 0 10px rgba(16, 185, 129, 0.4)',
                '0 0 10px rgba(16, 185, 129, 0.4)',
                'none',
              ],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              times: [0, 0.38, 0.5, 0.78, 1],
              ease: 'easeInOut',
            }}
            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-medium px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm whitespace-nowrap"
          >
            <span>Setujui Klip</span>
            <span>✓</span>
          </motion.div>
        </div>
      </div>

      {/* Animated SVG Mouse Cursor Clicking "Setujui Klip" */}
      <motion.svg
        animate={{
          x: [40, 75, 75, 75, 40],
          y: [30, 42, 42, 42, 30],
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
