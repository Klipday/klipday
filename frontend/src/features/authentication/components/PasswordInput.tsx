import * as React from 'react';
import { EyeIcon, EyeOffIcon } from '@solar-icons/react/linear';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PasswordInputProps } from '../types';

/**
 * An accessible password input component featuring a show/hide password toggle button.
 *
 * @param props - Standard HTML input properties.
 * @returns The rendered password input with an interactive visibility toggle.
 */
export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  /**
   * Toggles the visibility state between plaintext and masked password characters.
   */
  function ToggleVisibility() {
    setIsVisible((previousState) => !previousState);
  }

  return (
    <div className="relative w-full">
      <Input {...props} type={isVisible ? 'text' : 'password'} disabled={disabled} className={cn('pr-10', className)} />
      <button
        type="button"
        tabIndex={-1}
        onClick={ToggleVisibility}
        disabled={disabled}
        aria-label={isVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
        {isVisible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}
