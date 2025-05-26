
import React, { useState } from "react";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface FormViewProps {
  onSubmit: (data: FormData, useV2?: boolean) => void;
}

const FormView: React.FC<FormViewProps> = ({ onSubmit }) => {
  const [useV2Generation, setUseV2Generation] = useState(false);

  const handleSubmit = (data: FormData) => {
    onSubmit(data, useV2Generation);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Worksheet Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create personalized English worksheets for adult learners in seconds
          </p>
        </div>

        {/* Generation Version Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Generation System
              {useV2Generation && <Badge variant="secondary">V2 - Testing</Badge>}
              {!useV2Generation && <Badge variant="default">V1 - Current</Badge>}
            </CardTitle>
            <CardDescription>
              Choose between the current generation system (V1) and the new improved system (V2)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="generation-version"
                checked={useV2Generation}
                onCheckedChange={setUseV2Generation}
              />
              <Label htmlFor="generation-version">
                {useV2Generation ? 'Using V2 Generation (Testing)' : 'Using V1 Generation (Current)'}
              </Label>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {useV2Generation ? (
                <p>
                  <strong>V2 System:</strong> Improved single-pass generation with better consistency and quality control
                </p>
              ) : (
                <p>
                  <strong>V1 System:</strong> Current production system with multi-step validation
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <WorksheetForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default FormView;
