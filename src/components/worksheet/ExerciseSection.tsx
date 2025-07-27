
import React from "react";
import ExerciseHeader from "./ExerciseHeader";
import ExerciseContent from "./ExerciseContent";
import ExerciseReading from "./ExerciseReading";
import ExerciseMatching from "./ExerciseMatching";
import ExerciseFillInBlanks from "./ExerciseFillInBlanks";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import TeacherTipSection from "./TeacherTipSection";
import ExerciseDialogue from "./ExerciseDialogue";
import {
  renderOtherExerciseTypes,
  renderTrueFalseExercise
} from "./ExerciseSectionUtils";

interface Exercise {
  type: string;
  title: string;
  icon: string;
  time: number;
  instructions: string;
  content?: string;
  questions?: any[];
  items?: any[];
  sentences?: any[];
  dialogue?: any[];
  statements?: any[];
  word_bank?: string[];
  expressions?: string[];
  expression_instruction?: string;
  teacher_tip: string;
}

interface ExerciseSectionProps {
  exercise: Exercise;
  exerciseIndex: number;
  viewMode: "student" | "teacher";
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  exerciseIndex,
  viewMode
}) => {
  return (
    <div className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm">
      <ExerciseHeader
        icon={exercise.icon}
        title={exercise.title}
        isEditing={false}
        time={exercise.time}
        onTitleChange={() => {}}
      />

      <div className="p-5">
        <ExerciseContent
          instructions={exercise.instructions}
          isEditing={false}
          onInstructionsChange={() => {}}
          content={exercise.content}
          onContentChange={() => {}}
        />

        {exercise.type === 'reading' && exercise.questions && (
          <ExerciseReading
            questions={exercise.questions}
            isEditing={false}
            viewMode={viewMode}
            onQuestionChange={() => {}}
          />
        )}

        {exercise.type === 'matching' && exercise.items && (
          <ExerciseMatching
            items={exercise.items}
            isEditing={false}
            viewMode={viewMode}
            getMatchedItems={() => exercise.items?.map((item, index) => ({ ...item, index })) || []}
            onItemChange={() => {}}
          />
        )}

        {exercise.type === 'fill-in-blanks' && exercise.sentences && (
          <ExerciseFillInBlanks
            word_bank={exercise.word_bank}
            sentences={exercise.sentences}
            isEditing={false}
            viewMode={viewMode}
            onWordBankChange={() => {}}
            onSentenceChange={() => {}}
          />
        )}

        {exercise.type === 'multiple-choice' && exercise.questions && (
          <ExerciseMultipleChoice
            questions={exercise.questions}
            isEditing={false}
            viewMode={viewMode}
            onQuestionTextChange={() => {}}
            onOptionTextChange={() => {}}
          />
        )}

        {exercise.type === 'dialogue' && exercise.dialogue && (
          <ExerciseDialogue
            dialogue={exercise.dialogue}
            expressions={exercise.expressions}
            expression_instruction={exercise.expression_instruction}
            isEditing={false}
            viewMode={viewMode}
            onDialogueChange={() => {}}
            onExpressionChange={() => {}}
            onExpressionInstructionChange={() => {}}
          />
        )}

        {exercise.type === 'discussion' && exercise.questions && (
          <div className="space-y-0.5">
            <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
            {exercise.questions.map((question: string, qIndex: number) => (
              <div key={qIndex} className="p-1 border-b">
                <p className="leading-snug">
                  {qIndex + 1}. {question}
                </p>
              </div>
            ))}
          </div>
        )}

        {(exercise.type === 'error-correction' || exercise.type === 'word-formation' || exercise.type === 'word-order') && 
          exercise.sentences && renderOtherExerciseTypes(exercise, false, viewMode, () => {})}
        
        {exercise.type === 'true-false' && exercise.statements && 
          renderTrueFalseExercise(exercise, false, viewMode, () => {})}

        <TeacherTipSection
          tip={exercise.teacher_tip}
          isEditing={false}
          onChange={() => {}}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default ExerciseSection;
