import { motion } from 'framer-motion';
import { EyeIcon, PlayIcon, VolumeLoudIcon } from '@solar-icons/react/linear';
import { VERTICAL_CLIPS_MOCKUP_ITEMS } from '../constants/home.constants';
import type { VerticalClipsCarouselMockupProps } from '../types';

/**
 * Interactive Micro-UI simulating vertical 9:16 short video clips.
 * Displays 3 rounded phone containers side-by-side with vertical video thumbnail previews,
 * cinema gradient overlays, centered play icons, and floating view counter badges
 * floating at staggered speeds.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Micro-UI stage.
 */
export function VerticalClipsCarouselMockup({ className = '' }: VerticalClipsCarouselMockupProps) {
  const containerClassName = `relative w-full h-full flex items-center justify-center gap-1.5 sm:gap-2.5 p-2 select-none overflow-hidden ${className}`.trim();

  return (
    <div className={containerClassName}>
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-rose-500/10 blur-2xl"
        aria-hidden="true"
      />

      {VERTICAL_CLIPS_MOCKUP_ITEMS.map((clip) => {
        const isFocal = Boolean(clip.isFocal);
        const cardClassName = isFocal
          ? 'relative z-10 w-[84px] sm:w-24 xl:w-28 h-40 sm:h-44 rounded-xl border border-rose-500/45 bg-zinc-950 overflow-hidden p-2 flex flex-col justify-between shadow-2xl shrink-0 scale-105'
          : 'relative w-[70px] sm:w-20 xl:w-24 h-36 sm:h-40 rounded-xl border border-white/[0.08] bg-zinc-950 overflow-hidden p-1.5 sm:p-2 flex flex-col justify-between shadow-lg shrink-0 opacity-75';
        const imageClassName = isFocal
          ? 'pointer-events-none absolute inset-0 w-full h-full object-cover object-center brightness-95 contrast-105'
          : 'pointer-events-none absolute inset-0 w-full h-full object-cover object-center brightness-75 saturate-75';
        const scrimClassName = isFocal
          ? 'pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-rose-950/15 to-black/85'
          : 'pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-zinc-950/25 to-black/90';
        const headerClassName = isFocal
          ? 'relative z-10 flex items-center justify-between text-[8px] sm:text-[9px] text-zinc-400'
          : 'relative z-10 flex items-center justify-between text-[8px] text-zinc-300/90 font-mono truncate';
        const playButtonClassName = isFocal
          ? 'size-7 rounded-full bg-zinc-950/55 border border-rose-500/60 backdrop-blur-sm flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] transition-transform hover:scale-110'
          : 'size-6 rounded-full bg-black/50 border border-white/15 backdrop-blur-sm flex items-center justify-center text-zinc-200';
        const playIconClassName = isFocal
          ? 'size-3.5 fill-rose-400 ml-0.5'
          : 'size-2.5 fill-zinc-200 ml-0.5';
        const viewsPillClassName = isFocal
          ? 'relative z-10 rounded-full border border-emerald-500/40 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 flex items-center justify-center gap-1 shadow-lg whitespace-nowrap'
          : 'relative z-10 rounded bg-black/75 border border-white/10 backdrop-blur-sm px-1.5 py-0.5 flex items-center justify-center gap-1';

        return (
          <motion.div
            key={clip.id}
            animate={{ y: [...clip.yRange] }}
            transition={{
              duration: clip.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: clip.delay ?? 0,
            }}
            className={cardClassName}
          >
            {/* Video Thumbnail Frame */}
            <img
              src={clip.thumbnailSrc}
              alt={clip.thumbnailAlt}
              width={360}
              height={645}
              loading="lazy"
              decoding="async"
              className={imageClassName}
            />

            {/* Top & Bottom Cinema Scrim for Overlay Contrast */}
            <div className={scrimClassName} aria-hidden="true" />

            {/* Top Row: Creator Handle & Audio Indicator */}
            <div className={headerClassName}>
              <span
                className={
                  isFocal
                    ? 'font-mono font-medium truncate max-w-[55px] sm:max-w-[65px] text-white drop-shadow'
                    : 'truncate drop-shadow'
                }
              >
                {clip.handle}
              </span>
              {isFocal && (
                <span className="flex items-center gap-0.5 shrink-0">
                  <VolumeLoudIcon className="size-2.5 text-rose-400 drop-shadow" />
                </span>
              )}
            </div>

            {/* Center Play Icon */}
            <div className="relative z-10 my-auto flex items-center justify-center">
              <div className={playButtonClassName}>
                <PlayIcon className={playIconClassName} />
              </div>
            </div>

            {/* Bottom Views Pill */}
            <div className={viewsPillClassName}>
              <EyeIcon className={isFocal ? 'size-2.5 text-emerald-400 shrink-0' : 'size-2 text-zinc-400'} />
              <span
                className={
                  isFocal
                    ? 'text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 tabular-nums whitespace-nowrap'
                    : 'text-[9px] font-mono text-zinc-300'
                }
              >
                {clip.views}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
