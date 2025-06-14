
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Clock, Database, Star, User, UserCog, Edit, GraduationCap } from "lucide-react";

interface InputParamsCardProps {
  inputParams: any;
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
      {/* First row: Lesson Duration + English Level combined, Lesson Topic, Lesson Goal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Clock className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-500">Lesson Duration</p>
                <p className="font-medium text-sm">{inputParams.lessonTime}</p>
              </div>
              {inputParams.englishLevel && (
                <div>
                  <p className="text-sm text-gray-500">English Level</p>
                  <p className="font-medium text-sm">{inputParams.englishLevel}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Database className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lesson Topic</p>
            <p className="font-medium text-sm">{inputParams.lessonTopic}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Star className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lesson Goal</p>
            <p className="font-medium text-sm">{inputParams.lessonGoal}</p>
          </div>
        </div>
      </div>
      
      {/* Second row: Teaching Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <User className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Teaching Preferences</p>
            <p className="font-medium text-sm">{inputParams.teachingPreferences}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default InputParamsCard;
