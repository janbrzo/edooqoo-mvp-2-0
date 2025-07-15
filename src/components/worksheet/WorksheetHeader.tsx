import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Database, Clock } from "lucide-react";

interface WorksheetHeaderProps {
  onBack: () => void;
  generationTime: number;
  sourceCount: number;
  inputParams: any;
  studentName?: string | null;
}

function WorksheetHeader({
  onBack,
  generationTime,
  sourceCount,
  inputParams,
  studentName
}: WorksheetHeaderProps) {
  return <>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Create New Worksheet
      </Button>
      <div className="bg-worksheet-purple rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h1 className="mb-1 font-bald text-white text-2xl font-semibold">
              Your Generated Worksheet{studentName ? ` for ${studentName}` : ''}
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
    </>;
}
export default WorksheetHeader;