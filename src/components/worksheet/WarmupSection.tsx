
import React from "react";
import { MessageSquare } from "lucide-react";

interface WarmupSectionProps {
  warmup: {
    questions: string[];
  };
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: any;
  setEditableWorksheet: (worksheet: any) => void;
}

export default function WarmupSection({
  warmup,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet
}: WarmupSectionProps) {
  const handleQuestionChange = (questionIndex: number, value: string) => {
    const updatedWarmup = {
      ...editableWorksheet.warmup,
      questions: editableWorksheet.warmup.questions.map((q: string, index: number) => 
        index === questionIndex ? value : q
      )
    };
    
    setEditableWorksheet({
      ...editableWorksheet,
      warmup: updatedWarmup
    });
  };

  return (
    <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-100" />
          <div>
            <h3 className="text-lg font-semibold">Warmup</h3>
            <p className="text-blue-100 text-sm">Personal discussion questions</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-4">
            Discuss these questions with your teacher to warm up and practice speaking about the topic.
          </p>
        </div>

        <div className="space-y-3">
          {warmup.questions.map((question: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                    className="w-full border p-2 rounded editable-content"
                    placeholder={`Question ${index + 1}`}
                  />
                ) : (
                  <p className="text-gray-800 leading-relaxed">{question}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Teacher tip for warmup */}
        {viewMode === 'teacher' && (
          <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-md" data-teacher-tip="true">
            <h4 className="font-medium text-amber-800 mb-2">👨‍🏫 Teacher Tip:</h4>
            <p className="text-sm text-amber-700">
              Use these warmup questions to get students talking and thinking about the topic. 
              Encourage personal responses and follow-up questions. This helps activate prior knowledge 
              and creates a comfortable speaking environment before moving to more structured exercises.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
