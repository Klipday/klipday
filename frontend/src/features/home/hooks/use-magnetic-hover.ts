import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { UseMagneticHoverOptions } from '../types';

/**
 * Reusable custom hook providing smooth, 60fps magnetic cursor pull physics for primary CTA buttons.
 * Pulls the target element slightly toward the user's cursor via gsap.quickTo and snaps back
 * with an elastic overshoot on mouse leave, respecting prefers-reduced-motion.
 *
 * @param options - Configuration options for max pixel pull distance and sensitivity strength.
 * @returns Ref callback to attach to the magnetic interactive element.
 */
export function UseMagneticHover<T extends HTMLElement = HTMLElement>(
  options: UseMagneticHoverOptions = {}
) {
  const { maxPull = 6, strength = 0.25 } = options;
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const quickX = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' });
    const quickY = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' });

    /**
     * Handles mouse move event to pull element toward cursor.
     *
     * @param event - Mouse move event.
     * @returns void
     */
    const HandleMouseMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (event.clientX - centerX) * strength;
      const deltaY = (event.clientY - centerY) * strength;
      const clampedX = Math.max(-maxPull, Math.min(maxPull, deltaX));
      const clampedY = Math.max(-maxPull, Math.min(maxPull, deltaY));
      quickX(clampedX);
      quickY(clampedY);
    };

    /**
     * Smoothly restores element to resting position with elastic overshoot on mouse leave.
     *
     * @returns void
     */
    const HandleMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('mousemove', HandleMouseMove);
    el.addEventListener('mouseleave', HandleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', HandleMouseMove);
      el.removeEventListener('mouseleave', HandleMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [maxPull, strength]);

  return elementRef;
}
