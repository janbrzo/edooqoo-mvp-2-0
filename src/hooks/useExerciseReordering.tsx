
import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { useToast } from '@/hooks/use-toast';

interface UseExerciseReorderingProps {
  editableWorksheet: any;
  setEditableWorksheet: (worksheet: any) => void;
}

export const useExerciseReordering = ({
  editableWorksheet,
  setEditableWorksheet
}: UseExerciseReorderingProps) => {
  const [isReorderingEnabled, setIsReorderingEnabled] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<any[]>([]);
  const { toast } = useToast();

  const enableReordering = useCallback(() => {
    if (!isReorderingEnabled && editableWorksheet?.exercises) {
      // Store original order for potential reset
      setOriginalOrder([...editableWorksheet.exercises]);
    }
    setIsReorderingEnabled(true);
    toast({
      title: "Reordering enabled",
      description: "You can now drag and drop exercises to reorder them.",
      className: "bg-blue-50 border-blue-200"
    });
  }, [isReorderingEnabled, editableWorksheet?.exercises, toast]);

  const disableReordering = useCallback(() => {
    setIsReorderingEnabled(false);
    toast({
      title: "Reordering disabled",
      description: "Exercise reordering has been disabled.",
      className: "bg-gray-50 border-gray-200"
    });
  }, [toast]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && editableWorksheet?.exercises) {
      const exercises = editableWorksheet.exercises;
      const oldIndex = exercises.findIndex((ex: any, idx: number) => `exercise-${idx}` === active.id);
      const newIndex = exercises.findIndex((ex: any, idx: number) => `exercise-${idx}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedExercises = arrayMove(exercises, oldIndex, newIndex);
        
        setEditableWorksheet({
          ...editableWorksheet,
          exercises: reorderedExercises
        });

        toast({
          title: "Exercise reordered",
          description: "The exercise order has been updated.",
          className: "bg-green-50 border-green-200"
        });
      }
    }
  }, [editableWorksheet, setEditableWorksheet, toast]);

  const resetToOriginalOrder = useCallback(() => {
    if (originalOrder.length > 0) {
      setEditableWorksheet({
        ...editableWorksheet,
        exercises: [...originalOrder]
      });
      toast({
        title: "Order reset",
        description: "Exercises have been restored to their original order.",
        className: "bg-blue-50 border-blue-200"
      });
    }
  }, [originalOrder, editableWorksheet, setEditableWorksheet, toast]);

  return {
    isReorderingEnabled,
    enableReordering,
    disableReordering,
    handleDragEnd,
    resetToOriginalOrder,
    hasOriginalOrder: originalOrder.length > 0
  };
};
