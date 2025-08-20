
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteWorksheetDialogProps {
  worksheetId: string;
  worksheetTitle: string;
  onDelete: (worksheetId: string) => Promise<boolean>;
  variant?: "icon" | "button";
  size?: "sm" | "default";
}

export const DeleteWorksheetDialog = ({ 
  worksheetId, 
  worksheetTitle, 
  onDelete, 
  variant = "icon",
  size = "sm"
}: DeleteWorksheetDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await onDelete(worksheetId);
      if (success) {
        toast.success("Worksheet deleted successfully");
        setOpen(false);
      } else {
        toast.error("Failed to delete worksheet");
      }
    } catch (error) {
      console.error('Error deleting worksheet:', error);
      toast.error("An error occurred while deleting the worksheet");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size={size}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="destructive" size={size}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Worksheet</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{worksheetTitle}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
