import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { INDONESIA_CITIES } from '../constants';
import type { BrandLocationComboboxProps } from '../types';

/**
 * Searchable combobox component for selecting an Indonesian city or regency
 * from a curated list of national cities without automatic GPS location queries.
 *
 * @param props - Selected value, change handler, and disabled state.
 * @returns The rendered location combobox element.
 */
export function BrandLocationCombobox({
  value,
  onChange,
  disabled = false,
}: BrandLocationComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filteredCities = INDONESIA_CITIES.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  useEffect(() => {
    const HandleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', HandleClickOutside);
      // Focus search input on open
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', HandleClickOutside);
    };
  }, [isOpen]);

  const HandleSelectCity = (city: string) => {
    onChange(city);
    setIsOpen(false);
    setSearchQuery('');
  };

  const HandleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border border-transparent bg-input/50 px-3 py-2 text-xs transition-[color,box-shadow] duration-200 outline-none cursor-pointer hover:bg-input/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
          isOpen && 'border-ring ring-3 ring-ring/30 bg-input/70',
          disabled && 'cursor-not-allowed opacity-50 pointer-events-none',
          !value && 'text-muted-foreground',
        )}>
        <div className="flex items-center gap-2 truncate">
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{value || 'Pilih Kota / Kabupaten (cth: Jakarta Selatan)'}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={HandleClear}
              className="size-5 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Hapus lokasi terpilih">
              <X className="size-3" />
            </Button>
          ) : null}
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-border/60 bg-popover p-2 text-popover-foreground shadow-xl ring-1 ring-foreground/5 dark:ring-foreground/10 animate-in fade-in-0 zoom-in-95">
          {/* Search Header */}
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredCities.length > 0) {
                    HandleSelectCity(filteredCities[0]);
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsOpen(false);
                }
              }}
              placeholder="Cari nama kota..."
              className="h-8 pl-8 text-xs rounded-lg"
            />
          </div>

          {/* Filtered Cities List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => {
                const isSelected = value === city;
                return (
                  <button
                    key={city}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => HandleSelectCity(city)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-foreground hover:bg-muted/60',
                    )}>
                    <span>{city}</span>
                    {isSelected ? <Check className="size-3.5 text-primary" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Kota tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
