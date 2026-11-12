import { motion } from 'framer-motion';
import { ArrowRight, Film } from 'lucide-react';
import type { BrandCreateCampaignVisualProps } from '../types';

/**
 * Interactive Micro-UI simulating Brand Campaign Setup & Footage Upload.
 * Displays raw footage upload dropzone ('footage-produk.mp4'), 2-column Total Budget & Rate inputs,
 * an animated cursor clicking the rate input and gliding to click 'Tayangkan Campaign ->'.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Brand Campaign Creation Micro-UI.
 */
export function BrandCreateCampaignVisual({ className = '' }: BrandCreateCampaignVisualProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Background ambient spotlight */}
      <div
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-rose-500/10 blur-2xl"
        aria-hidden="true"
      />

      {/* Main Campaign Creation Card */}
      <div className="relative z-10 w-full max-w-[280px] p-3 sm:p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5 shadow-2xl backdrop-blur-md text-left">
        {/* Row 1: Raw Footage Upload Box */}
        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-dashed border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Film className="size-3 text-rose-400" />
            </div>
            <span className="text-[11px] font-medium text-zinc-200 truncate">
              footage-produk.mp4
            </span>
          </div>
          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            Uploaded ✓
          </span>
        </div>

        {/* Row 2: 2-Column Budget & CPM Inputs */}
        <div className="grid grid-cols-2 gap-2">
          {/* Left Box: Total Budget */}
          <div className="p-2 rounded-xl bg-zinc-950 border border-white/5 space-y-0.5">
            <span className="block text-[9px] text-zinc-500 whitespace-nowrap">
              Total Budget
            </span>
            <span className="block text-[11px] font-bold text-white tabular-nums whitespace-nowrap">
              Rp 5.000.000
            </span>
          </div>

          {/* Right Box: Rate per 1K Views (Target of first cursor click) */}
          <motion.div
            animate={{
              borderColor: [
                'rgba(244, 63, 94, 0.4)',
                'rgba(244, 63, 94, 0.9)',
                'rgba(244, 63, 94, 0.9)',
                'rgba(244, 63, 94, 0.4)',
                'rgba(244, 63, 94, 0.4)',
              ],
              scale: [1, 0.97, 1.02, 1, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              times: [0, 0.22, 0.35, 0.55, 1],
              ease: 'easeInOut',
            }}
            className="p-2 rounded-xl bg-zinc-950 border border-rose-500/50 bg-rose-500/5 space-y-0.5 relative"
          >
            <span className="block text-[9px] text-rose-300/80 whitespace-nowrap">
              Rate per 1K Views
            </span>
            <span className="block text-[11px] font-bold text-white tabular-nums whitespace-nowrap">
              Rp 12.000
            </span>
          </motion.div>
        </div>

        {/* Row 3: Action Bar (Right-aligned CTA button) */}
        <div className="flex justify-end pt-0.5">
          <motion.div
            animate={{
              scale: [1, 1, 1, 0.95, 1.03, 1],
              boxShadow: [
                'none',
                'none',
                'none',
                '0 0 14px rgba(225, 29, 72, 0.6)',
                '0 0 14px rgba(225, 29, 72, 0.6)',
                'none',
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              times: [0, 0.5, 0.62, 0.72, 0.85, 1],
              ease: 'easeInOut',
            }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-semibold whitespace-nowrap shadow-sm"
          >
            <span>Tayangkan Campaign</span>
            <ArrowRight className="size-2.5" />
          </motion.div>
        </div>
      </div>

      {/* Animated SVG Mouse Cursor (Clicks Rp 12.000 then Tayangkan Campaign) */}
      <motion.svg
        animate={{
          x: [60, 40, 40, 40, 75, 75, 75, 60],
          y: [50, -5, -5, -5, 45, 45, 45, 50],
          scale: [1, 1, 0.85, 1, 1, 0.85, 1, 1],
          opacity: [0, 1, 1, 1, 1, 1, 1, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          times: [0, 0.2, 0.25, 0.4, 0.65, 0.72, 0.85, 1],
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
