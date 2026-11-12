import { motion } from 'framer-motion';
import { Eye, Play, Volume2 } from 'lucide-react';
import type { VerticalClipsCarouselMockupProps } from '../types';

interface ClipCardData {
  readonly id: string;
  readonly handle: string;
  readonly views: string;
  readonly isFocal?: boolean;
  readonly yRange: readonly number[];
  readonly duration: number;
  readonly delay?: number;
}

const CLIPS_DATA: readonly ClipCardData[] = [
  {
    id: 'clip-1',
    handle: '@maya_cut',
    views: '86K',
    yRange: [-6, 6, -6],
    duration: 4.6,
  },
  {
    id: 'clip-2',
    handle: '@adit_clipper',
    views: '124K',
    isFocal: true,
    yRange: [6, -8, 6],
    duration: 3.8,
  },
  {
    id: 'clip-3',
    handle: '@fajar_edit',
    views: '54K',
    yRange: [-8, 4, -8],
    duration: 5.2,
    delay: 0.4,
  },
];

/**
 * Interactive Micro-UI simulating vertical 9:16 short video clips.
 * Displays 3 rounded phone containers side-by-side with subtle dark gradients,
 * animated sound bars, centered play icons, and a floating view counter badge (124K views)
 * floating at staggered speeds.
 *
 * @param props - Component properties including optional className.
 * @returns The rendered Micro-UI stage.
 */
export function VerticalClipsCarouselMockup({ className = '' }: VerticalClipsCarouselMockupProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center gap-1.5 sm:gap-2.5 p-2 select-none overflow-hidden ${className}`.trim()}
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-rose-500/10 blur-2xl"
        aria-hidden="true"
      />

      {CLIPS_DATA.map((clip) => {
        if (clip.isFocal) {
          return (
            <motion.div
              key={clip.id}
              animate={{ y: [...clip.yRange] }}
              transition={{
                duration: clip.duration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative z-10 w-[84px] sm:w-24 xl:w-28 h-40 sm:h-44 rounded-xl border border-rose-500/40 bg-gradient-to-b from-rose-950/30 via-zinc-900/90 to-zinc-950 p-2 flex flex-col justify-between shadow-2xl backdrop-blur-md shrink-0 scale-105"
            >
              {/* Top Row: Mini Handle & Audio */}
              <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-zinc-400">
                <span className="font-mono font-medium truncate max-w-[55px] sm:max-w-[65px] text-white">
                  {clip.handle}
                </span>
                <span className="flex items-center gap-0.5 shrink-0">
                  <Volume2 className="size-2.5 text-rose-400" />
                </span>
              </div>

              {/* Center Play Icon with Glow */}
              <div className="my-auto flex items-center justify-center">
                <div className="size-7 rounded-full bg-rose-500/20 border border-rose-500/50 backdrop-blur-sm flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.35)] transition-transform hover:scale-110">
                  <Play className="size-3.5 fill-rose-400 ml-0.5" />
                </div>
              </div>

              {/* Floating View Counter Badge (124K views) */}
              <div className="rounded-full border border-emerald-500/30 bg-black/80 px-1.5 py-0.5 flex items-center justify-center gap-1 shadow-lg whitespace-nowrap">
                <Eye className="size-2.5 text-emerald-400 shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 tabular-nums whitespace-nowrap">
                  {clip.views}
                </span>
              </div>
            </motion.div>
          );
        }

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
            className="relative w-[70px] sm:w-20 xl:w-24 h-36 sm:h-40 rounded-xl border border-white/[0.08] bg-gradient-to-b from-zinc-800/60 via-zinc-900/80 to-zinc-950 p-1.5 sm:p-2 flex flex-col justify-between shadow-lg backdrop-blur-sm shrink-0 opacity-70"
          >
            {/* Top Row: Mini Handle */}
            <div className="flex items-center justify-between text-[8px] text-zinc-500 font-mono truncate">
              <span className="truncate">{clip.handle}</span>
            </div>

            {/* Center Play Icon */}
            <div className="my-auto flex items-center justify-center">
              <div className="size-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-zinc-400">
                <Play className="size-2.5 fill-zinc-400 ml-0.5" />
              </div>
            </div>

            {/* Bottom Views Pill */}
            <div className="rounded bg-black/60 px-1.5 py-0.5 flex items-center justify-center gap-1">
              <Eye className="size-2 text-zinc-400" />
              <span className="text-[9px] font-mono text-zinc-300">
                {clip.views}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
