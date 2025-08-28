
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import ExerciseSection from './ExerciseSection';

interface SortableExerciseItemProps {
  exercise: any;
  index: number;
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: any;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>;
  isReorderingEnabled: boolean;
}

const SortableExerciseItem: React.FC<SortableExerciseItemProps> = ({
  exercise,
  index,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet,
  isReorderingEnabled
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `exercise-${index}`,
    disabled: !isReorderingEnabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag Handle - only visible when reordering is enabled */}
      {isReorderingEnabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-4 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Drag to reorder exercise"
        >
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </div>
      )}

      {/* Exercise content with visual feedback during dragging */}
      <div className={`${isDragging ? 'opacity-50 shadow-lg' : ''} ${isReorderingEnabled ? 'ml-2' : ''} transition-all duration-200`}>
        <ExerciseSection
          exercise={exercise}
          index={index}
          isEditing={isEditing}
          viewMode={viewMode}
          editableWorksheet={editableWorksheet}
          setEditableWorksheet={setEditableWorksheet}
        />
      </div>
    </div>
  );
};

export default SortableExerciseItem;
