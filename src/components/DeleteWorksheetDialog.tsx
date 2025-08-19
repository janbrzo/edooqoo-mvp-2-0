
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteWorksheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  worksheetTitle: string;
  isDeleting: boolean;
}

export const DeleteWorksheetDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  worksheetTitle,
  isDeleting
}: DeleteWorksheetDialogProps) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Worksheet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this worksheet?
          </p>
          
          <div className="bg-muted p-3 rounded-md">
            <p className="font-medium text-sm truncate">{worksheetTitle}</p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            This action cannot be undone. The worksheet will be permanently removed from your account and will no longer be visible to you or your students.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Worksheet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
