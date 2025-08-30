
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Database, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { StudentSelector } from "@/components/StudentSelector";

interface WorksheetHeaderProps {
  onBack: () => void;
  generationTime: number;
  sourceCount: number;
  inputParams: any;
  studentName?: string;
  worksheetId?: string;
  onStudentChange?: () => void;
}

function WorksheetHeader({
  onBack,
  generationTime,
  sourceCount,
  inputParams,
  studentName,
  worksheetId,
  onStudentChange
}: WorksheetHeaderProps) {
  // Try to get student name from multiple sources
  const displayStudentName = studentName || 
    inputParams?.studentName || 
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('worksheetStudentName') : null);

  const studentId = inputParams?.studentId || 
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('worksheetStudentId') : null);

  const handleBack = () => {
    window.history.back();
  };

  const handleStudentTransferSuccess = () => {
    // Update sessionStorage with new student info after transfer
    if (onStudentChange) {
      onStudentChange();
    }
  };

  console.log('🔍 WorksheetHeader debug:', {
    worksheetId,
    displayStudentName,
    studentId,
    inputParams
  });

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Generate New Worksheet
        </Button>
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      <div className="bg-worksheet-purple rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h1 className="mb-1 font-bald text-white text-2xl font-semibold flex items-center gap-2">
              <span>Your Generated Worksheet</span>
              <span className="text-yellow-300 flex items-center gap-2">
                <span>for</span>
                {displayStudentName ? (
                  studentId ? (
                    <Link 
                      to={`/student/${studentId}`} 
                      className="hover:underline hover:text-yellow-200 transition-colors"
                    >
                      {displayStudentName}
                    </Link>
                  ) : displayStudentName
                ) : "Unassigned"}
                {worksheetId && (
                  <StudentSelector
                    worksheetId={worksheetId}
                    currentStudentId={studentId}
                    worksheetTitle="Current Worksheet"
                    onTransferSuccess={handleStudentTransferSuccess}
                    className="hover:bg-white/20 text-yellow-300"
                    size="sm"
                  />
                )}
              </span>
            </h1>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-md">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm text-white">Generated in {generationTime}s</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-md">
              <Database className="h-4 w-4 text-blue-300" />
              <span className="text-sm text-white">Based on {sourceCount} sources</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-md">
              <Clock className="h-4 w-4 text-green-300" />
              <span className="text-sm text-white">{inputParams.lessonTime} lesson</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorksheetHeader;
