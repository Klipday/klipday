import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CreatorSubmissionsToolbarProps, SubmissionStatus } from '../types';

interface TabItem {
  id: SubmissionStatus | 'ALL';
  label: string;
  countKey?: 'all' | 'pendingReview' | 'approved' | 'revisionRequested' | 'rejected';
}

const TABS: TabItem[] = [
  { id: 'ALL', label: 'Semua', countKey: 'all' },
  { id: 'PENDING_REVIEW', label: 'Menunggu Review', countKey: 'pendingReview' },
  { id: 'APPROVED', label: 'Disetujui', countKey: 'approved' },
  { id: 'REVISION_REQUESTED', label: 'Perlu Revisi', countKey: 'revisionRequested' },
  { id: 'REJECTED', label: 'Ditolak', countKey: 'rejected' },
];

/**
 * Minimalist toolbar for Creator Submissions workspace.
 * Features edge-to-edge segmented status pills and a live search input.
 *
 * @param props - Component configuration containing active status, search state, and change handlers.
 * @returns Rendered toolbar element.
 */
export function CreatorSubmissionsToolbar({
  searchTerm,
  status,
  counts,
  onSearchChange,
  onResetSearch,
  onStatusChange,
  className,
}: CreatorSubmissionsToolbarProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)}>
      {/* Segmented Status Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/60 bg-muted/20 p-1 text-xs">
        {TABS.map((tab) => {
          const isActive = status === tab.id;
          const count = tab.countKey && counts ? counts[tab.countKey] : undefined;
          const isRevisionTab = tab.id === 'REVISION_REQUESTED';
          const hasRevisionAlert = isRevisionTab && count !== undefined && count > 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap cursor-pointer text-muted-foreground hover:text-foreground',
                isActive && 'bg-background text-foreground shadow-2xs font-semibold',
                hasRevisionAlert && !isActive && 'text-orange-500 hover:text-orange-600',
              )}>
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold bg-muted text-muted-foreground',
                    isActive && 'bg-primary/10 text-primary',
                    hasRevisionAlert && 'bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold',
                  )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Input with Clear Button */}
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari kampanye atau caption..."
          className="h-9 w-full pl-8.5 pr-8 text-xs rounded-xl border-border/60 bg-card text-foreground placeholder:text-muted-foreground shadow-2xs transition-colors"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={onResetSearch}
            aria-label="Hapus pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
