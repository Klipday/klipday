import { useCallback, useRef, useState } from 'react';
import { AltArrowLeftIcon, AltArrowRightIcon } from '@solar-icons/react/linear';
import { cn } from '@/lib/utils';
import type { FeaturedCampaignCarouselProps } from '../types';
import { FeaturedCampaignSlide } from './FeaturedCampaignSlide';

const AUTOPLAY_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 50;

/**
 * Hero featured campaign carousel component.
 * Displays a cinematic banner carousel of top campaigns with autoplay, hover pause,
 * touch-swipe gesture support with vertical scroll rejection, keyboard navigation,
 * active slide pagination pills, and micro-nav buttons.
 *
 * @param props - Component properties containing campaign items and optional selection callback.
 * @returns The rendered carousel element or null if no campaigns provided.
 */
export function FeaturedCampaignCarousel({
  campaigns,
  className,
  onSelectCampaign,
}: FeaturedCampaignCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchEndYRef = useRef<number | null>(null);

  const totalSlides = campaigns.length;

  /**
   * Advances the carousel to the next slide in sequence.
   */
  const GoToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  /**
   * Moves the carousel backward to the previous slide.
   */
  const GoToPrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  /**
   * Navigates directly to the specified slide index.
   *
   * @param index - Target slide index.
   */
  const GoToSlide = (index: number) => {
    setActiveIndex(index);
  };

  /**
   * Handles keyboard navigation when the carousel container is focused.
   *
   * @param event - Keyboard event.
   */
  const HandleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      GoToPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      GoToNext();
    }
  };

  /**
   * Pauses autoplay when the user hovers over the carousel.
   */
  const HandleMouseEnter = () => {
    setIsPaused(true);
  };

  /**
   * Resumes autoplay when the mouse leaves the carousel.
   */
  const HandleMouseLeave = () => {
    setIsPaused(false);
  };

  /**
   * Records initial touch coordinates on touch start.
   *
   * @param event - Touch event.
   */
  const HandleTouchStart = (event: React.TouchEvent) => {
    if (totalSlides <= 1) return;
    setIsPaused(true);
    const touch = event.targetTouches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
  };

  /**
   * Updates latest touch coordinates on touch drag.
   *
   * @param event - Touch event.
   */
  const HandleTouchMove = (event: React.TouchEvent) => {
    if (totalSlides <= 1) return;
    const touch = event.targetTouches[0];
    touchEndXRef.current = touch.clientX;
    touchEndYRef.current = touch.clientY;
  };

  /**
   * Evaluates swipe gestures upon touch release, discriminating between intentional
   * horizontal swipes and vertical page scrolling.
   */
  const HandleTouchEnd = () => {
    setIsPaused(false);

    if (
      touchStartXRef.current !== null &&
      touchEndXRef.current !== null &&
      touchStartYRef.current !== null &&
      touchEndYRef.current !== null
    ) {
      const diffX = touchStartXRef.current - touchEndXRef.current;
      const diffY = touchStartYRef.current - touchEndYRef.current;

      // Only treat as horizontal swipe if horizontal movement is dominant and meets threshold
      const isHorizontalSwipe = Math.abs(diffX) > SWIPE_THRESHOLD_PX && Math.abs(diffX) > Math.abs(diffY) * 1.5;

      if (isHorizontalSwipe) {
        if (diffX > 0) {
          GoToNext();
        } else {
          GoToPrev();
        }
      }
    }

    // Always reset touch tracking refs
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
  };

  /**
   * Cleans up touch state when a touch gesture is interrupted.
   */
  const HandleTouchCancel = () => {
    setIsPaused(false);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
  };

  if (totalSlides === 0) {
    return null;
  }

  return (
    <div
      role="region"
      tabIndex={0}
      onKeyDown={HandleKeyDown}
      onMouseEnter={HandleMouseEnter}
      onMouseLeave={HandleMouseLeave}
      onTouchStart={HandleTouchStart}
      onTouchMove={HandleTouchMove}
      onTouchEnd={HandleTouchEnd}
      onTouchCancel={HandleTouchCancel}
      aria-roledescription="carousel"
      aria-label="Featured Campaigns Carousel"
      className={cn(
        'relative flex h-[340px] w-full flex-col justify-between overflow-hidden bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-[380px] lg:h-[420px]',
        className
      )}>
        
      {/* Sliding Track */}
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {campaigns.map((campaign, index) => (
          <FeaturedCampaignSlide
            key={campaign.id}
            campaign={campaign}
            isActive={index === activeIndex}
            onSelect={onSelectCampaign}
          />
        ))}
      </div>

      {/* Bottom Center Pagination Indicators with Live Loading Progress */}
      {totalSlides > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-6">
          {campaigns.map((campaign, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`indicator-${campaign.id}`}
                type="button"
                onClick={() => GoToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={isActive ? 'true' : 'false'}
                className="group flex items-center justify-center p-0.5 cursor-pointer focus-visible:outline-none">
                {isActive ? (
                  <div className="relative h-1.5 w-9 sm:w-11 overflow-hidden rounded-full bg-white/25 shadow-xs">
                    <div
                      key={`progress-${activeIndex}`}
                      onAnimationEnd={GoToNext}
                      className="h-full w-full rounded-full bg-primary origin-left"
                      style={{
                        animation: `carousel-progress ${AUTOPLAY_INTERVAL_MS}ms linear forwards`,
                        animationPlayState: isPaused ? 'paused' : 'running',
                      }}
                    />
                  </div>
                ) : (
                  <div className="size-1.5 rounded-full bg-white/35 transition-all duration-300 group-hover:bg-white/80 group-hover:scale-125" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Right Micro-Navigation Controls */}
      {totalSlides > 1 && (
        <div className="absolute bottom-5 right-4 z-20 flex items-center gap-1.5 sm:bottom-6 sm:right-6 lg:right-8">
          <button
            type="button"
            onClick={GoToPrev}
            aria-label="Slide sebelumnya"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white/90 backdrop-blur-xs transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <AltArrowLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={GoToNext}
            aria-label="Slide berikutnya"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white/90 backdrop-blur-xs transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <AltArrowRightIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
