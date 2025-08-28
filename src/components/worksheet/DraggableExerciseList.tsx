
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortableExerciseItem from './SortableExerciseItem';
import ExerciseSection from './ExerciseSection';
import { useState } from 'react';

interface DraggableExerciseListProps {
  exercises: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: any;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<any>>;
  isReorderingEnabled: boolean;
  onDragEnd: (event: any) => void;
}

const DraggableExerciseList: React.FC<DraggableExerciseListProps> = ({
  exercises,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet,
  isReorderingEnabled,
  onDragEnd
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const activeExercise = activeId ? exercises[parseInt(activeId.split('-')[1])] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext 
        items={exercises.map((_, index) => `exercise-${index}`)} 
        strategy={verticalListSortingStrategy}
      >
        <div className={`space-y-4 ${isReorderingEnabled ? 'pl-8' : ''}`}>
          {exercises.map((exercise, index) => (
            <SortableExerciseItem
              key={`exercise-${index}`}
              exercise={exercise}
              index={index}
              isEditing={isEditing}
              viewMode={viewMode}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
              isReorderingEnabled={isReorderingEnabled}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay for smooth dragging experience */}
      <DragOverlay>
        {activeExercise && (
          <div className="opacity-90 rotate-3 shadow-2xl">
            <ExerciseSection
              exercise={activeExercise}
              index={parseInt(activeId!.split('-')[1])}
              isEditing={isEditing}
              viewMode={viewMode}
              editableWorksheet={editableWorksheet}
              setEditableWorksheet={setEditableWorksheet}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default DraggableExerciseList;
