
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, DollarSign, Clock, Users, Info, Plus, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PricingCalculatorProps {
  onRecommendation?: (plan: 'side-gig' | 'full-time', worksheetsNeeded: number) => void;
}

export const PricingCalculator = ({ onRecommendation }: PricingCalculatorProps) => {
  const [prepTime, setPrepTime] = useState(30);
  const [lessonPrice, setLessonPrice] = useState(25);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(10);

  const monthlyLessons = lessonsPerWeek * 4;
  const monthlyPrepTime = prepTime * monthlyLessons;
  const monthlyPrepCost = (monthlyPrepTime / 60) * lessonPrice;
  
  const timesSaved = monthlyPrepTime * 0.8; // 80% time reduction
  const moneySaved = monthlyPrepCost * 0.8;

  // Calculate recommended plan based on lessons per week
  React.useEffect(() => {
    if (onRecommendation) {
      const worksheetsNeeded = Math.ceil(lessonsPerWeek * 1.2); // 20% buffer
      const recommendedPlan = worksheetsNeeded <= 15 ? 'side-gig' : 'full-time';
      onRecommendation(recommendedPlan, worksheetsNeeded);
    }
  }, [lessonsPerWeek, onRecommendation]);

  const handleIncrement = (field: 'prepTime' | 'lessonPrice' | 'lessonsPerWeek') => {
    switch (field) {
      case 'prepTime':
        setPrepTime(prev => Math.min(180, prev + 5));
        break;
      case 'lessonPrice':
        setLessonPrice(prev => Math.min(200, prev + 5));
        break;
      case 'lessonsPerWeek':
        setLessonsPerWeek(prev => Math.min(50, prev + 1));
        break;
    }
  };

  const handleDecrement = (field: 'prepTime' | 'lessonPrice' | 'lessonsPerWeek') => {
    switch (field) {
      case 'prepTime':
        setPrepTime(prev => Math.max(1, prev - 5));
        break;
      case 'lessonPrice':
        setLessonPrice(prev => Math.max(1, prev - 5));
        break;
      case 'lessonsPerWeek':
        setLessonsPerWeek(prev => Math.max(1, prev - 1));
        break;
    }
  };

  return (
    <div className="bg-gradient-to-br from-background to-secondary/20 py-16">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Savings Calculator
            </CardTitle>
            <CardDescription>
              Adjust the values below to see your personalized savings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left side - Input fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prepTime" className="flex items-center gap-2">
                    Prep Time? (minutes)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How many minutes do you typically spend preparing for each lesson?</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement('prepTime')}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="prepTime"
                      type="number"
                      value={prepTime}
                      onChange={(e) => setPrepTime(Math.max(1, Math.min(180, Number(e.target.value))))}
                      min="1"
                      max="180"
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement('prepTime')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonPrice" className="flex items-center gap-2">
                    Lesson Price? ($)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>What do you charge per hour for your English lessons?</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement('lessonPrice')}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="lessonPrice"
                      type="number"
                      value={lessonPrice}
                      onChange={(e) => setLessonPrice(Math.max(1, Math.min(200, Number(e.target.value))))}
                      min="1"
                      max="200"
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement('lessonPrice')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonsPerWeek" className="flex items-center gap-2">
                    Lessons per Week?
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How many lessons do you teach per week on average?</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement('lessonsPerWeek')}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="lessonsPerWeek"
                      type="number"
                      value={lessonsPerWeek}
                      onChange={(e) => setLessonsPerWeek(Math.max(1, Math.min(50, Number(e.target.value))))}
                      min="1"
                      max="50"
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement('lessonsPerWeek')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right side - Results */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Money you will save with edooqoo</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    ${moneySaved.toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Time you will save with edooqoo</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round(timesSaved / 60)}h {Math.round(timesSaved % 60)}m
                  </p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" className="w-full md:w-auto">
                Start Saving Today
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
