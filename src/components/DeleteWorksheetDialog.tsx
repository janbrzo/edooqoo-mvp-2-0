
import React from 'react';
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

interface DeleteWorksheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  worksheetTitle?: string;
}

export const DeleteWorksheetDialog: React.FC<DeleteWorksheetDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  worksheetTitle = 'this worksheet'
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Worksheet</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{worksheetTitle}"? This action will remove it from your dashboard and unassign it from any students. The worksheet data will be preserved in the system but will no longer be visible to you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
