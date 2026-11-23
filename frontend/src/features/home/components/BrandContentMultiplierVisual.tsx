import { motion } from 'framer-motion';
import { EyeIcon, PlayIcon } from '@solar-icons/react/linear';
import { BRAND_MULTIPLIER_PHONE_CLIPS } from '../constants/home.constants';
import type { BrandContentMultiplierVisualProps } from '../types';

/**
 * Interactive 1-to-many Framer Motion visualization showing a single brand video
 * expanding into multiple real vertical 9:16 TikTok clip previews in phone frames.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Brand Content Multiplier visual stage.
 */
export function BrandContentMultiplierVisual({ className = '' }: BrandContentMultiplierVisualProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Subtle Ambient Glow */}
      <div
        className="pointer-events-none absolute -bottom-10 right-6 w-48 h-48 rounded-full bg-rose-500/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-[330px] items-center justify-center gap-1.5 sm:gap-2">
        {/* Left: Compact Source Material Preview Frame */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-[72px] sm:w-[82px] h-14 sm:h-16 rounded-xl border border-white/15 bg-zinc-950 overflow-hidden shadow-xl">
            <img
              src="/assets/images/clip-fajar.webp"
              alt="Materi video utama dari brand"
              width={320}
              height={200}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center brightness-75"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35"
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-6 rounded-full bg-black/55 border border-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <PlayIcon className="size-3 fill-white ml-0.5" />
              </div>
            </div>
          </div>
          <span className="mt-1.5 text-[10px] font-medium text-zinc-300 whitespace-nowrap">
            1 Materi
          </span>
        </div>

        {/* Middle: Flowing Connector Curves */}
        <svg
          className="w-6 sm:w-8 h-24 shrink-0 overflow-visible"
          viewBox="0 0 32 96"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M 0 48 C 14 48, 18 16, 32 16"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.25"
          />
          <path
            d="M 0 48 L 32 48"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.25"
          />
          <path
            d="M 0 48 C 14 48, 18 80, 32 80"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.25"
          />

          <motion.path
            d="M 0 48 C 14 48, 18 16, 32 16"
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1], opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 0 48 L 32 48"
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1], opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
          />
          <motion.path
            d="M 0 48 C 14 48, 18 80, 32 80"
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1], opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </svg>

        {/* Right: 3 Realistic Overlapping Vertical Phone Frames */}
        <div className="flex items-center justify-center -space-x-3 sm:-space-x-2.5 pr-1">
          {BRAND_MULTIPLIER_PHONE_CLIPS.map((clip) => {
            const isFocal = Boolean(clip.isFocal);
            const frameClassName = isFocal
              ? 'relative z-10 w-[64px] sm:w-[74px] h-[112px] sm:h-[126px] rounded-2xl border border-rose-500/45 bg-zinc-950 overflow-hidden p-1.5 flex flex-col justify-between shadow-2xl shrink-0 scale-105'
              : 'relative w-[56px] sm:w-[64px] h-[98px] sm:h-[112px] rounded-2xl border border-white/15 bg-zinc-950 overflow-hidden p-1.5 flex flex-col justify-between shadow-lg shrink-0 opacity-85';

            return (
              <motion.div
                key={clip.id}
                animate={{
                  y: [...clip.yRange],
                  rotate: clip.rotate,
                }}
                transition={{
                  y: {
                    duration: clip.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  rotate: {
                    duration: 0.3,
                  },
                }}
                className={frameClassName}
              >
                <img
                  src={clip.thumbnailSrc}
                  alt={clip.thumbnailAlt}
                  width={240}
                  height={420}
                  loading="lazy"
                  decoding="async"
                  className={
                    isFocal
                      ? 'pointer-events-none absolute inset-0 h-full w-full object-cover object-center brightness-95 contrast-105'
                      : 'pointer-events-none absolute inset-0 h-full w-full object-cover object-center brightness-75 saturate-75'
                  }
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/85"
                  aria-hidden="true"
                />

                {/* Top Phone Notch Hairline + Handle */}
                <div className="relative z-10 space-y-1">
                  <div className="mx-auto h-[2.5px] w-5 rounded-full bg-white/30" />
                  <span className="block truncate text-[8px] font-medium text-white drop-shadow">
                    {clip.handle}
                  </span>
                </div>

                {/* Bottom Plain View Metric */}
                <div className="relative z-10 flex items-center gap-1 whitespace-nowrap">
                  <EyeIcon
                    className={
                      isFocal
                        ? 'size-2.5 text-rose-400 shrink-0'
                        : 'size-2 text-zinc-300 shrink-0'
                    }
                  />
                  <span className="text-[8px] sm:text-[9px] font-semibold text-white tabular-nums">
                    {clip.views}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
