import { motion } from 'framer-motion';
import { PlayIcon } from '@solar-icons/react/linear';
import type { BrandCreateCampaignVisualProps } from '../types';

/**
 * Interactive Micro-UI simulating Brand Campaign Setup with a real video preview frame,
 * budget & CPM metrics, and a smooth Framer Motion playback scrubber.
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

      {/* Ghost Depth Card */}
      <div
        className="pointer-events-none absolute -top-1 w-[82%] max-w-[238px] h-44 rounded-2xl bg-zinc-950/80 border border-white/5 opacity-40 scale-95 blur-[1px] -translate-y-2"
        aria-hidden="true"
      />

      {/* Main Campaign Setup Card */}
      <div className="relative z-10 w-full max-w-[264px] rounded-2xl bg-zinc-900/95 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md text-left">
        {/* Top 16:9 Real Video Preview Frame */}
        <div className="relative h-24 w-full overflow-hidden bg-zinc-950">
          <img
            src="/assets/images/clip-adit.webp"
            alt="Preview materi video produk untuk kampanye"
            width={400}
            height={225}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center brightness-90 contrast-105"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/80"
            aria-hidden="true"
          />

          {/* Top Frame Caption & Duration */}
          <div className="relative z-10 flex items-center justify-between px-3 pt-2 text-[10px]">
            <span className="font-medium text-white drop-shadow">
              Materi Video Produk
            </span>
            <span className="text-zinc-300 tabular-nums drop-shadow">
              04:12
            </span>
          </div>

          {/* Center Translucent Play Button */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="size-7 rounded-full bg-black/55 border border-white/25 backdrop-blur-xs flex items-center justify-center text-white shadow-lg">
              <PlayIcon className="size-3.5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Animated Bottom Playback Scrubber */}
          <div className="absolute inset-x-0 bottom-0 z-10 h-[2.5px] bg-white/15">
            <motion.div
              animate={{ width: ['18%', '82%', '18%'] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full bg-rose-500"
            />
          </div>
        </div>

        {/* Bottom 2-Column Budget & CPM Details */}
        <div className="p-3 space-y-2.5">
          <div className="grid grid-cols-2 divide-x divide-white/[0.08]">
            <div className="space-y-0.5 pr-2">
              <span className="block text-[9px] text-zinc-400 whitespace-nowrap">
                Total Budget
              </span>
              <span className="block text-xs font-semibold text-white tabular-nums whitespace-nowrap">
                Rp 5.000.000
              </span>
            </div>

            <div className="space-y-0.5 pl-3">
              <span className="block text-[9px] text-zinc-400 whitespace-nowrap">
                Rate / 1K Views
              </span>
              <span className="block text-xs font-semibold text-rose-400 tabular-nums whitespace-nowrap">
                Rp 12.000
              </span>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between text-[10px] whitespace-nowrap">
            <span className="text-zinc-400">Status Campaign</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
              <motion.span
                animate={{ scale: [1, 1.35, 1], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="size-1.5 rounded-full bg-emerald-400"
              />
              <span>Siap Tayang</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
