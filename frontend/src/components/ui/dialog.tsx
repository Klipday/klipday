import * as React from 'react';
import { cn } from '@/lib/utils';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { CloseIcon } from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';

/**
 * Root container primitive for Radix dialogs.
 *
 * @param props - Radix Dialog root properties.
 * @returns Dialog Root component.
 */
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/**
 * Trigger element that opens the dialog modal.
 *
 * @param props - Radix Dialog trigger properties.
 * @returns Dialog Trigger component.
 */
function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/**
 * Portal wrapper rendering the dialog into document body.
 *
 * @param props - Radix Dialog portal properties.
 * @returns Dialog Portal component.
 */
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

/**
 * Close button primitive for dismissing dialog modal.
 *
 * @param props - Radix Dialog close properties.
 * @returns Dialog Close component.
 */
function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Backdrop overlay styling dimmed background behind dialog content.
 *
 * @param props - Radix Dialog overlay properties.
 * @returns Dialog Overlay component.
 */
function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className
      )}
      {...props}
    />
  );
}

/**
 * Main modal content card supporting responsive layouts and custom close button.
 *
 * @param props - Radix Dialog content properties with showCloseButton toggle.
 * @returns Dialog Content component.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 text-card-foreground shadow-2xl ring-1 ring-border duration-150 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 max-w-lg',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4 rounded-full text-muted-foreground hover:text-foreground cursor-pointer z-20"
            >
              <CloseIcon className="size-4" />
              <span className="sr-only">Tutup</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * Top header container for dialog titles and descriptions.
 *
 * @param props - Header div properties.
 * @returns Dialog Header component.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

/**
 * Bottom action footer for dialog buttons.
 *
 * @param props - Footer div properties.
 * @returns Dialog Footer component.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2', className)}
      {...props}
    />
  );
}

/**
 * Accessible title heading for dialogs.
 *
 * @param props - Radix Dialog title properties.
 * @returns Dialog Title component.
 */
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('font-heading text-lg font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  );
}

/**
 * Accessible subtitle description for dialogs.
 *
 * @param props - Radix Dialog description properties.
 * @returns Dialog Description component.
 */
function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
