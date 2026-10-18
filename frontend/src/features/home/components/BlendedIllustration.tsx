import { cn } from '@/lib/utils';
import type { BlendedIllustrationProps } from '../types';

/**
 * Reusable 3D dark-glass illustration component.
 * Renders high-fidelity transparent PNG 3D illustrations with an ambient crimson halo glow
 * that brightens on parent card hover and dimensional drop shadow.
 *
 * @param props - Component properties including image source, alt text, and custom classes.
 * @returns The rendered illustration element.
 */
export function BlendedIllustration({
  src,
  alt,
  className = '',
  imageClassName = '',
}: BlendedIllustrationProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none',
        className
      )}
    >
      {/* Ambient Crimson Halo Glow */}
      <div
        className="pointer-events-none absolute inset-0 m-auto size-3/4 rounded-full bg-rose-600/15 blur-2xl transition-all duration-500 ease-out group-hover:bg-rose-600/30 group-hover:blur-3xl group-hover:scale-110"
        aria-hidden="true"
      />

      {/* 3D Dark-Glass Illustration (Native Transparent PNG) */}
      <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        draggable={false}
        className={cn(
          'relative z-10 h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]',
          'transition-transform duration-500 ease-out group-hover:scale-[1.03] will-change-transform',
          imageClassName
        )}
      />
    </div>
  );
}
