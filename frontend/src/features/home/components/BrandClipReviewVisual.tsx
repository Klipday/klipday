import { motion } from 'framer-motion';
import { CheckCircleIcon, PlayIcon } from '@solar-icons/react/linear';
import type { BrandClipReviewVisualProps } from '../types';

/**
 * Interactive Micro-UI simulating Brand Clip Review with a real 9:16 vertical clip thumbnail,
 * concise hook assessment, and smooth Framer Motion status transition from review to approval.
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

      {/* Ghost Queue Card */}
      <div
        className="pointer-events-none absolute -top-1 w-[84%] max-w-[248px] h-32 rounded-2xl bg-zinc-950/80 border border-white/5 opacity-40 scale-95 blur-[1px] -translate-y-1.5"
        aria-hidden="true"
      />

      {/* Foreground Clip Review Card */}
      <motion.div
        animate={{
          borderColor: [
            'rgba(255, 255, 255, 0.10)',
            'rgba(255, 255, 255, 0.10)',
            'rgba(16, 185, 129, 0.45)',
            'rgba(16, 185, 129, 0.45)',
            'rgba(255, 255, 255, 0.10)',
          ],
        }}
        transition={{
          duration: 4.4,
          repeat: Infinity,
          times: [0, 0.42, 0.52, 0.88, 1],
          ease: 'easeInOut',
        }}
        className="relative z-10 w-full max-w-[278px] rounded-2xl bg-zinc-900/95 border border-white/10 p-3 shadow-2xl backdrop-blur-md text-left"
      >
        <div className="flex items-center gap-3">
          {/* Left: 9:16 Vertical Video Preview Frame */}
          <div className="relative w-[68px] h-[114px] shrink-0 rounded-xl overflow-hidden border border-white/15 bg-zinc-950">
            <img
              src="/assets/images/clip-adit.webp"
              alt="Cuplikan video oleh @adit_clipper"
              width={240}
              height={420}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center brightness-90"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/80"
              aria-hidden="true"
            />

            <span className="relative z-10 block px-1.5 pt-1.5 text-[9px] font-medium text-white tabular-nums drop-shadow">
              0:28
            </span>

            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="size-6 rounded-full bg-black/55 border border-white/25 backdrop-blur-xs flex items-center justify-center text-white">
                <PlayIcon className="size-2.5 fill-white ml-0.5" />
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 h-[2px] bg-white/15">
              <motion.div
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 4.4, repeat: Infinity, ease: 'linear' }}
                className="h-full bg-rose-500"
              />
            </div>
          </div>

          {/* Right: Creator Details, Hook Note, and Status */}
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="space-y-0.5">
              <span className="block truncate text-xs font-semibold text-white">
                @adit_clipper
              </span>
              <span className="block text-[10px] text-zinc-400">
                Klip #04
              </span>
            </div>

            <p className="border-l-2 border-rose-500/60 pl-2 text-[10px] leading-snug text-zinc-300">
              Hook 3 detik awal kuat, siap tayang.
            </p>

            <div className="relative h-6 border-t border-white/[0.06] pt-2 flex items-center">
              <motion.span
                animate={{ opacity: [1, 1, 0, 0, 1] }}
                transition={{
                  duration: 4.4,
                  repeat: Infinity,
                  times: [0, 0.42, 0.5, 0.88, 1],
                }}
                className="absolute left-0 top-2 text-[10px] font-medium text-amber-400 whitespace-nowrap"
              >
                Meninjau klip
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{
                  duration: 4.4,
                  repeat: Infinity,
                  times: [0, 0.42, 0.5, 0.88, 1],
                }}
                className="absolute left-0 top-2 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 whitespace-nowrap"
              >
                <CheckCircleIcon className="size-3 shrink-0" />
                <span>Klip disetujui</span>
              </motion.span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
