import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { NotificationFeedbackModalProps } from '../types';

/**
 * Modal presenting the full revision or rejection feedback note thread.
 * Enables creators and brands to review feedback and immediately jump into remediation.
 *
 * @param props - Modal properties including notification item, open state, and close callback.
 * @returns The rendered feedback dialog modal or null if no notification.
 */
export function NotificationFeedbackModal({
  notification,
  isOpen,
  onClose,
}: NotificationFeedbackModalProps) {
  const navigate = useNavigate();

  if (!notification) {
    return null;
  }

  const rawMetadata = notification.metadata ?? {};
  const feedbackNote =
    (typeof rawMetadata.reviewNote === 'string' && rawMetadata.reviewNote) ||
    (typeof rawMetadata.adminNote === 'string' && rawMetadata.adminNote) ||
    (typeof rawMetadata.rejectionReason === 'string' && rawMetadata.rejectionReason) ||
    '';

  const isRejection =
    notification.type.includes('REJECTED') ||
    Boolean(rawMetadata.rejectionReason);

  const noteLabel = isRejection ? 'Alasan Penolakan' : 'Catatan Revisi';

  const handleAction = () => {
    onClose();
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            {notification.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </DialogDescription>
        </DialogHeader>

        {feedbackNote && (
          <div className="my-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {noteLabel}
            </span>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {feedbackNote}
            </p>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          {notification.actionUrl && (
            <Button
              variant="default"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAction}
            >
              {isRejection ? 'Lihat Halaman Terkait' : 'Buka Halaman Revisi'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
