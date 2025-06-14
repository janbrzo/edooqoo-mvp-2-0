
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Clock, Database, Star, Edit, GraduationCap, BookOpen } from "lucide-react";

interface InputParamsCardProps {
  inputParams: {
    lessonTime: string;
    englishLevel: string;
    lessonTopic: string;
    lessonGoal: string;
    teachingPreferences?: string;
    additionalInformation?: string;
  };
}

const InputParamsCard = ({ inputParams }: InputParamsCardProps) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Info className="h-5 w-5 text-worksheet-purple" />
        Your Input Parameters
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lesson Duration */}
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Clock className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lesson Duration</p>
            <p className="font-medium text-sm">{inputParams.lessonTime}</p>
          </div>
        </div>
        
        {/* English Level */}
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <GraduationCap className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">English Level</p>
            <p className="font-medium text-sm">{inputParams.englishLevel}</p>
          </div>
        </div>
        
        {/* Lesson Topic */}
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Database className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lesson Topic</p>
            <p className="font-medium text-sm">{inputParams.lessonTopic}</p>
          </div>
        </div>
      
        {/* Lesson Goal */}
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Star className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lesson Goal</p>
            <p className="font-medium text-sm">{inputParams.lessonGoal}</p>
          </div>
        </div>
        
        {/* Grammar focus (conditionally rendered) */}
        {inputParams.teachingPreferences && (
          <div className="flex items-center gap-3">
            <div className="bg-worksheet-purpleLight rounded-full p-2">
              <BookOpen className="h-4 w-4 text-worksheet-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Grammar focus</p>
              <p className="font-medium text-sm">{inputParams.teachingPreferences}</p>
            </div>
          </div>
        )}

        {/* Additional Information (conditionally rendered) */}
        {inputParams.additionalInformation && (
          <div className="flex items-center gap-3">
            <div className="bg-worksheet-purpleLight rounded-full p-2">
              <Edit className="h-4 w-4 text-worksheet-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Additional Information</p>
              <p className="font-medium text-sm">{inputParams.additionalInformation}</p>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default InputParamsCard;
