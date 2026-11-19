import { useState } from 'react';
import {
  AddIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  CloseIcon,
  TrashBinTrashIcon,
} from '@solar-icons/react/linear';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BriefDynamicListFieldProps, DynamicListInputProps, DynamicListPillsProps, DynamicListRowsProps } from '../types';
import { FieldLengthTracker } from './FieldLengthTracker';

/**
 * Dedicated input bar for adding new string items to dynamic lists.
 * Encapsulates input state, keyboard shortcuts (Enter), and prefix formatting.
 *
 * @param props - Component properties for input interactions and formatting.
 * @returns The rendered input bar element.
 */
function DynamicListInput({ onAdd, placeholder, prefix, disabled = false, maxLength }: DynamicListInputProps) {
  const [inputValue, setInputValue] = useState('');

  /**
   * Cleans, formats, and dispatches the input value to the parent onAdd callback.
   */
  function HandleAdd() {
    const raw = inputValue.trim();
    if (!raw) return;

    let cleanItem = raw;
    if (prefix && !cleanItem.startsWith(prefix)) {
      cleanItem = `${prefix}${cleanItem}`;
    }

    onAdd(cleanItem);
    setInputValue('');
  }

  /**
   * Captures Enter key press in the text input to add items without submitting the parent form.
   *
   * @param event - Keyboard event from the input element.
   */
  function HandleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      HandleAdd();
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={HandleKeyDown}
          onBlur={HandleAdd}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={HandleAdd}
          disabled={disabled || inputValue.trim() === ''}
          className="flex items-center gap-1.5 shrink-0">
          <AddIcon className="size-4" />
          <span>Tambah</span>
        </Button>
      </div>

      {maxLength && inputValue.length > 0 && (
        <div className="flex justify-end px-1">
          <FieldLengthTracker current={inputValue.length} max={maxLength} />
        </div>
      )}
    </div>
  );
}

/**
 * Renders dynamic list items as compact badge pills (e.g. hashtags, mention tags).
 *
 * @param props - Component properties containing item list and removal callback.
 * @returns The rendered pills flex-wrap container.
 */
function DynamicListPills({ items, onRemove, disabled = false }: DynamicListPillsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors">
          <span>{item}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground outline-none"
              aria-label={`Hapus ${item}`}>
              <CloseIcon className="size-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * Renders dynamic list items as full-width structured cards/rows (e.g. Do's & Don'ts).
 *
 * @param props - Component properties containing item list, status tone, and removal callback.
 * @returns The rendered rows list element.
 */
function DynamicListRows({ items, onRemove, tone = 'neutral', disabled = false }: DynamicListRowsProps) {
  const isPositive = tone === 'positive';
  const isNegative = tone === 'negative';

  return (
    <ul className="space-y-1.5 pt-1">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={cn(
            'flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs sm:text-sm transition-colors',
            isPositive && 'border-emerald-500/30',
            isNegative && 'border-rose-500/30'
          )}>
          <div className="flex items-start gap-2.5 min-w-0">
            {isPositive && <CheckCircleIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
            {isNegative && <CloseCircleIcon className="size-3.5 text-rose-500 shrink-0 mt-0.5" />}
            <span className="text-foreground leading-relaxed wrap-break-word">{item}</span>
          </div>

          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onRemove(index)}
              className="h-6 w-6 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
              aria-label={`Hapus ${item}`}>
              <TrashBinTrashIcon className="size-3" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Reusable dynamic list field component for managing array-based string items
 * such as hashtags, mention tags, and Do's & Don'ts content guidelines.
 * Composes input entry and list presentation (pills or rows) inside a standard Field container.
 *
 * @param props - Component properties for managing list items and input interactions.
 * @returns The rendered dynamic list input element.
 */
export function BriefDynamicListField({
  label,
  description,
  placeholder,
  items,
  onAddItem,
  onRemoveItem,
  disabled = false,
  prefix,
  variant = 'pills',
  tone = 'neutral',
  error,
  maxItemLength,
}: BriefDynamicListFieldProps) {
  const hasItems = items.length > 0;
  const itemLimit = maxItemLength ?? (variant === 'rows' ? 200 : 50);

  return (
    <Field data-invalid={Boolean(error)} className="space-y-2">
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        {hasItems && (
          <span className="text-[11px] text-muted-foreground/70 tabular-nums font-normal">
            {items.length} item
          </span>
        )}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}

      <DynamicListInput
        onAdd={onAddItem}
        placeholder={placeholder}
        prefix={prefix}
        disabled={disabled}
        maxLength={itemLimit}
      />

      {hasItems &&
        (variant === 'pills' ? (
          <DynamicListPills items={items} onRemove={onRemoveItem} disabled={disabled} />
        ) : (
          <DynamicListRows items={items} onRemove={onRemoveItem} tone={tone} disabled={disabled} />
        ))}

      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  );
}
