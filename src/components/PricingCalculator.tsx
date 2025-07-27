
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Info, DollarSign, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PricingCalculatorProps {
  onRecommendation: (plan: 'side-gig' | 'full-time', worksheetsNeeded: number, savings: { money: number, time: number }) => void;
}

export const PricingCalculator = ({ onRecommendation }: PricingCalculatorProps) => {
  const [prepTime, setPrepTime] = useState(30);
  const [lessonPrice, setLessonPrice] = useState(25);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(10);

  const calculateRecommendation = () => {
    const worksheetsNeeded = lessonsPerWeek * 4; // 4 weeks per month
    const timePerWorksheet = prepTime;
    const totalTimeSaved = worksheetsNeeded * timePerWorksheet;
    const totalMoneySaved = (totalTimeSaved / 60) * lessonPrice;

    const recommendedPlan = worksheetsNeeded <= 15 ? 'side-gig' : 'full-time';
    
    onRecommendation(recommendedPlan, worksheetsNeeded, {
      money: totalMoneySaved,
      time: totalTimeSaved
    });
  };

  const worksheetsNeeded = lessonsPerWeek * 4;
  const timePerWorksheet = prepTime;
  const totalTimeSaved = worksheetsNeeded * timePerWorksheet;
  const totalMoneySaved = (totalTimeSaved / 60) * lessonPrice;

  return (
    <Card className="max-w-4xl mx-auto mb-8">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Calculator className="h-5 w-5" />
          Find Your Perfect Plan
        </CardTitle>
        <CardDescription>
          Calculate how much time and money you'll save with edooqoo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="prepTime" className="text-sm font-medium">Prep Time</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How many minutes do you currently spend preparing each worksheet?</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="prepTime"
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className="w-full"
              min="1"
              max="180"
            />
            <p className="text-xs text-muted-foreground">minutes per worksheet</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="lessonPrice" className="text-sm font-medium">Lesson Rate</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How much do you charge per hour for your English lessons?</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="lessonPrice"
              type="number"
              value={lessonPrice}
              onChange={(e) => setLessonPrice(Number(e.target.value))}
              className="w-full"
              min="1"
              max="200"
            />
            <p className="text-xs text-muted-foreground">$ per hour</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="lessonsPerWeek" className="text-sm font-medium">Weekly Lessons</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How many lessons do you teach per week on average?</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="lessonsPerWeek"
              type="number"
              value={lessonsPerWeek}
              onChange={(e) => setLessonsPerWeek(Number(e.target.value))}
              className="w-full"
              min="1"
              max="100"
            />
            <p className="text-xs text-muted-foreground">lessons per week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Money you will save with edooqoo</h3>
            </div>
            <p className="text-2xl font-bold text-green-700">${totalMoneySaved.toFixed(0)}</p>
            <p className="text-sm text-green-600">per month</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Time you will save with edooqoo</h3>
            </div>
            <p className="text-2xl font-bold text-blue-700">{(totalTimeSaved / 60).toFixed(1)}</p>
            <p className="text-sm text-blue-600">hours per month</p>
          </div>
        </div>

        <div className="text-center">
          <Button onClick={calculateRecommendation} size="lg" className="px-8">
            Find My Perfect Plan
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            You'll need approximately {worksheetsNeeded} worksheets per month
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
