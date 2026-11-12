/**
 * Shared component type definitions for global/cross-feature primitives.
 */

export type KlipdayLogoVariant = 'full' | 'icon';
export type KlipdayLogoSize = 'sm' | 'md' | 'lg';

export interface KlipdayLogoProps {
  readonly variant?: KlipdayLogoVariant;
  readonly size?: KlipdayLogoSize;
  readonly className?: string;
}
