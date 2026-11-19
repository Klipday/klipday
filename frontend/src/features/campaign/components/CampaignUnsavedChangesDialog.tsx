import { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CampaignUnsavedChangesDialogProps } from '../types';

/**
 * Confirmation dialog prompting user when attempting to navigate away
 * with unsaved campaign form changes. Guards against Radix AlertDialog's
 * synchronous `onOpenChange(false)` firing `onCancel` after `onConfirm`.
 *
 * @param props - Dialog open state and confirm/cancel action callbacks.
 * @returns The rendered alert dialog modal.
 */
export function CampaignUnsavedChangesDialog({
  isOpen,
  onConfirm,
  onCancel,
}: CampaignUnsavedChangesDialogProps) {
  const isConfirmingRef = useRef(false);

  const HandleConfirmClick = () => {
    isConfirmingRef.current = true;
    onConfirm();
  };

  const HandleOpenChange = (open: boolean) => {
    if (open) {
      return;
    }

    if (isConfirmingRef.current) {
      isConfirmingRef.current = false;
      return;
    }

    onCancel();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={HandleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Perubahan Belum Disimpan</AlertDialogTitle>
          <AlertDialogDescription>
            Anda memiliki perubahan data yang belum disimpan di langkah ini. Jika Anda meninggalkan halaman ini, perubahan yang Anda buat akan hilang.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Tetap di Sini</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={HandleConfirmClick}>
            Tinggalkan Halaman
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
