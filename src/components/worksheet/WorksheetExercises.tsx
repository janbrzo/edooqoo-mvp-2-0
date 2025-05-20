
import React from "react";
import ExerciseSection from "./ExerciseSection";
import { Worksheet } from "@/types/worksheet";

interface WorksheetExercisesProps {
  exercises: any[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: Worksheet;
  setEditableWorksheet: React.Dispatch<React.SetStateAction<Worksheet>>;
}

const WorksheetExercises: React.FC<WorksheetExercisesProps> = ({
  exercises,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet
}) => {
  return (
    <>
      {exercises.map((exercise, index) => (
        <ExerciseSection
          key={index}
          exercise={exercise}
          index={index}
          isEditing={isEditing}
          viewMode={viewMode}
          editableWorksheet={editableWorksheet}
          setEditableWorksheet={setEditableWorksheet}
        />
      ))}
    </>
  );
};

export default WorksheetExercises;
