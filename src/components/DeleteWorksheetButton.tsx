
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteWorksheetButtonProps {
  worksheetId: string;
  worksheetTitle: string;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  variant?: 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'default';
}

export const DeleteWorksheetButton = ({
  worksheetId,
  worksheetTitle,
  onDelete,
  variant = 'ghost',
  size = 'sm'
}: DeleteWorksheetButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const result = await onDelete(worksheetId);
      
      if (result.success) {
        toast({
          title: "Worksheet deleted",
          description: "The worksheet has been successfully deleted.",
        });
      } else {
        throw new Error(result.error || 'Failed to delete worksheet');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete worksheet",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Worksheet</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{worksheetTitle}"? This action can be undone later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
