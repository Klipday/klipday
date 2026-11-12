import type { KlipdayLogoProps } from './types';

/**
 * Geometric K-Blade brand logo for Klipday.
 * Combines an app icon container with crimson sheen, dual-blade geometry,
 * and the signature Klipday wordmark.
 *
 * @param props - Component properties configuring variant, size, and custom classes.
 * @returns The rendered Klipday logo component.
 */
export function KlipdayLogo({
  variant = 'full',
  size = 'md',
  className = '',
}: KlipdayLogoProps) {
  const dimensions = {
    sm: { box: 'w-6 h-6', text: 'text-lg' },
    md: { box: 'w-8 h-8', text: 'text-xl' },
    lg: { box: 'w-10 h-10', text: 'text-2xl' },
  }[size];

  const containerClasses = `inline-flex items-center gap-2.5 select-none group ${className}`.trim();
  const boxClasses = `${dimensions.box} relative rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner overflow-hidden transition-transform duration-200 group-hover:scale-105 shrink-0`;
  const textClasses = `${dimensions.text} font-extrabold tracking-tight text-white`;

  return (
    <div className={containerClasses}>
      {/* Geometric K-Blade App Icon Container */}
      <div className={boxClasses}>
        {/* Subtle top-right crimson ambient sheen */}
        <div
          className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500/25 blur-md pointer-events-none"
          aria-hidden="true"
        />

        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[72%] h-[72%]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="klipdayCrimson"
              x1="14"
              y1="15"
              x2="27"
              y2="27"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#9F1239" />
            </linearGradient>
          </defs>

          {/* Left Vertical Video Timeline Pillar (White) */}
          <path
            d="M6 6.5C6 5.67157 6.67157 5 7.5 5H10.5C11.3284 5 12 5.67157 12 6.5V25.5C12 26.3284 11.3284 27 10.5 27H7.5C6.67157 27 6 26.3284 6 25.5V6.5Z"
            fill="#FFFFFF"
          />

          {/* Top-Right Angled Cut Blade (White) */}
          <path
            d="M20.2 5H25.5C26.4 5 26.9 6.05 26.3 6.75L18.4 15.5H13.2L20.2 5Z"
            fill="#FFFFFF"
          />

          {/* Bottom-Right Angled Cut Blade (Crimson Gradient) */}
          <path
            d="M15.8 15.5H20.8L26.4 25.25C26.9 26.05 26.35 27 25.4 27H20.1L14.3 17.2C13.9 16.5 14.4 15.5 15.2 15.5H15.8Z"
            fill="url(#klipdayCrimson)"
          />
        </svg>
      </div>

      {/* Wordmark (Klipday.) */}
      {variant === 'full' && (
        <span className={textClasses}>
          Klipday<span className="text-[#E11D48]">.</span>
        </span>
      )}
    </div>
  );
}
